const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { protect, requireOrg, authorize } = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

router.use(protect, requireOrg);

// Validation Schemas
const createEmployeeSchema = z.object({
    body: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        role: z.string().min(1),
        department: z.string().min(1),
        salary: z.number().min(0),
        password: z.string().min(6).optional() // Admin sets temp password
    })
});

// @route   GET /api/employees
// @desc    Get all employees (Scoped by Role)
router.get('/', async (req, res) => {
    try {
        const { search, department, status, page = 1, limit = 20, sortBy = 'joinDate', sortOrder = 'desc' } = req.query;
        const query = { organizationId: req.orgId, deletedAt: null };

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (department && department !== 'all') query.department = department;
        if (status && status !== 'all') query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // SECURITY: Select fields based on Role
        let selectFields = '-__v'; 
        if (req.user.role !== 'ADMIN') {
            // Staff cannot see salaries or DB internal versions
            selectFields = '-salary -__v';
        }

        const [employees, total] = await Promise.all([
            Employee.find(query).sort(sort).skip(skip).limit(parseInt(limit)).select(selectFields).lean(),
            Employee.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                employees: employees.map(emp => ({ ...emp, id: emp._id })), // Map _id to id for frontend
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/employees
// @desc    Onboard new employee (Admin Only)
router.post('/', authorize('ADMIN'), validate(createEmployeeSchema), async (req, res) => {
    // NOTE: Transactions removed for standalone DB compatibility
    try {
        const { firstName, lastName, email, role, department, salary, password } = req.body;

        // 1. Check uniqueness
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // 2. Create Login User
        // Default password if not provided: "staff123"
        const tempPassword = password || 'staff123';
        
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: tempPassword, 
            organizationId: req.orgId,
            role: 'STAFF' // Default to Staff
        });

        // 3. Create Employee Record
        const employee = await Employee.create({
            organizationId: req.orgId,
            userId: user._id,
            firstName,
            lastName,
            email,
            role,
            department,
            status: 'Active',
            salary,
            joinDate: new Date()
        });

        // 4. Link them
        user.employeeId = employee._id;
        await user.save();

        // 5. Audit Log
        await AuditLog.create({
            organizationId: req.orgId,
            action: 'Employee onboarded',
            actor: `${req.user.firstName} ${req.user.lastName}`,
            actorId: req.user._id,
            target: `${firstName} ${lastName}`,
            targetId: employee._id,
            details: `Onboarded as ${role} in ${department}`
        });

        res.status(201).json({ success: true, data: employee, message: 'Employee onboarded successfully' });
    } catch (error) {
        console.error("Onboarding Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/employees/:id
// @desc    Terminate employee
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
    try {
        const employee = await Employee.findOne({ _id: req.params.id, organizationId: req.orgId });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        // Soft Delete Employee
        employee.deletedAt = new Date();
        employee.status = 'Terminated';
        await employee.save();

        // Disable Login Access
        if (employee.userId) {
            await User.findByIdAndUpdate(employee.userId, { isActive: false });
        }

        // Audit Log
        await AuditLog.create({
            organizationId: req.orgId,
            action: 'Employee terminated',
            actor: `${req.user.firstName} ${req.user.lastName}`,
            actorId: req.user._id,
            target: `${employee.firstName} ${employee.lastName}`,
            targetId: employee._id,
            details: 'Access revoked and marked terminated'
        });

        res.json({ success: true, message: 'Employee terminated and access revoked' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/employees/:id/restore
// @desc    Restore deleted employee
router.post('/:id/restore', authorize('ADMIN'), async (req, res) => {
    try {
        const employee = await Employee.findOne({ _id: req.params.id, organizationId: req.orgId });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        employee.deletedAt = null;
        employee.status = 'Active';
        await employee.save();

        if (employee.userId) {
            await User.findByIdAndUpdate(employee.userId, { isActive: true });
        }

        res.json({ success: true, data: employee, message: 'Employee restored' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;