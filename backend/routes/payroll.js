const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PayrollRun = require('../models/PayrollRun');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const Organization = require('../models/Organization');
const { protect, requireOrg, authorize } = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

router.use(protect, requireOrg, authorize('ADMIN'));

// Validation for the Run
const runSchema = z.object({
    body: z.object({
        periodMonth: z.number().min(0).max(11), // 0-11 for JS Date
        periodYear: z.number().min(2000).max(2100),
        adjustments: z.array(z.object({
            employeeId: z.string(),
            bonus: z.number().min(0).default(0),
            deduction: z.number().min(0).default(0),
            note: z.string().optional()
        })).optional().default([])
    })
});

// Helper: Get Start/End of a given month
const getPeriodDates = (month, year) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

// @route   GET /api/payroll/preview
// @desc    Get base calculations for the current/next month
router.get('/preview', async (req, res) => {
    try {
        const activeEmployees = await Employee.find({
            organizationId: req.orgId,
            deletedAt: null,
            status: 'Active'
        });

        const items = activeEmployees.map(emp => {
            const safeSalary = Number(emp.salary) || 0;
            // Base monthly salary
            const baseAmount = Math.round((safeSalary / 12) * 100) / 100; 
            
            return {
                employeeId: emp._id,
                name: `${emp.firstName} ${emp.lastName}`,
                role: emp.role,
                baseSalary: baseAmount,
                bonus: 0,
                deduction: 0,
                netPay: baseAmount
            };
        });

        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/payroll/run
// @desc    Execute payroll with adjustments
router.post('/run', validate(runSchema), async (req, res) => {
    // NOTE: Transactions removed for standalone DB compatibility
    try {
        const { periodMonth, periodYear, adjustments } = req.body;
        const { start, end } = getPeriodDates(periodMonth, periodYear);

        // 1. DUPLICATE CHECK (Critical Fix)
        // Check if a run already exists for this exact period overlap
        const existingRun = await PayrollRun.findOne({
            organizationId: req.orgId,
            periodStart: { $gte: start, $lte: end },
            status: 'COMPLETED'
        });

        if (existingRun) {
            return res.status(409).json({ 
                success: false, 
                message: `Payroll for ${start.toLocaleString('default', { month: 'long', year: 'numeric' })} has already been processed.` 
            });
        }

        // 2. Fetch Employees
        const activeEmployees = await Employee.find({
            organizationId: req.orgId,
            deletedAt: null,
            status: 'Active'
        });

        if (activeEmployees.length === 0) {
            return res.status(400).json({ success: false, message: 'No active employees to pay.' });
        }

        // 3. Calculation Engine
        let totalAmount = 0;
        
        const items = activeEmployees.map(emp => {
            const safeSalary = Number(emp.salary) || 0;
            const baseAmount = Math.round((safeSalary / 12) * 100) / 100;

            // Find adjustment for this employee
            const adj = adjustments.find(a => a.employeeId === emp._id.toString()) || { bonus: 0, deduction: 0 };
            
            const finalAmount = Math.max(0, baseAmount + adj.bonus - adj.deduction); // Prevent negative pay
            totalAmount += finalAmount;

            return {
                employeeId: emp._id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                amount: finalAmount, // The actual check amount
                salarySnapshot: safeSalary,
                meta: {
                    base: baseAmount,
                    bonus: adj.bonus,
                    deduction: adj.deduction,
                    note: adj.note
                }
            };
        });

        // 4. Commit to DB
        const idempotencyKey = `run-${req.orgId}-${periodMonth}-${periodYear}`;
        
        const payrollRun = await PayrollRun.create({
            organizationId: req.orgId,
            periodStart: start,
            periodEnd: end,
            status: 'COMPLETED',
            totalAmount,
            employeeCount: activeEmployees.length,
            items,
            createdBy: req.user._id,
            idempotencyKey
        });

        // 5. Update Org Schedule (Next month)
        const nextDate = new Date(end);
        nextDate.setDate(nextDate.getDate() + 1); // 1st of next month
        
        await Organization.findByIdAndUpdate(req.orgId, {
            'settings.lastPayrollDate': new Date(),
            'settings.nextPayrollDate': nextDate
        });

        // 6. Audit
        await AuditLog.create({
            organizationId: req.orgId,
            action: 'Payroll executed',
            actor: `${req.user.firstName} ${req.user.lastName}`,
            actorId: req.user._id,
            target: 'Payroll Run',
            targetId: payrollRun._id,
            details: `Processed ${items.length} employees for ${start.toLocaleDateString()}`,
            metadata: { totalAmount, month: periodMonth, year: periodYear }
        });

        res.status(201).json({ success: true, data: payrollRun });

    } catch (error) {
        console.error("Payroll Run Error:", error);
        // Handle unique constraint violation on idempotencyKey gracefully
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'This payroll period is currently processing or already done.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/payroll/runs
router.get('/runs', async (req, res) => {
    try {
        const runs = await PayrollRun.find({ organizationId: req.orgId })
            .sort({ periodStart: -1 }) // Sort by period, not just creation
            .limit(12);
        res.json({ success: true, data: runs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



router.get('/me', protect, requireOrg, async (req, res) => {
    try {
        // Find runs that include this user
        const runs = await PayrollRun.find({
            organizationId: req.orgId,
            status: 'COMPLETED',
            'items.employeeId': req.user.employeeId
        })
        .sort({ periodStart: -1 })
        .limit(24);

        // Filter the output to ONLY show this user's data
        const mySlips = runs.map(run => {
            const myItem = run.items.find(i => i.employeeId.toString() === req.user.employeeId.toString());
            return {
                _id: run._id,
                periodStart: run.periodStart,
                periodEnd: run.periodEnd,
                paidDate: run.createdAt,
                amount: myItem ? myItem.amount : 0,
                status: 'Paid'
            };
        });

        res.json({ success: true, data: mySlips });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
module.exports = router;