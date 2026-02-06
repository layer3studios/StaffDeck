const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const { protect, requireOrg, authorize } = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

router.use(protect, requireOrg);

// --- 1. GET CALENDAR (The Source of Truth) ---
// Returns ALL approved leaves so everyone knows who is away.
router.get('/calendar', async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({
            organizationId: req.orgId,
            status: 'APPROVED'
        }).populate('employeeId', 'firstName lastName avatar role department');

        res.json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2. GET REQUESTS (The Workflow Engine) ---
// Admin: Sees ALL requests.
// Staff: Sees ONLY their own requests.
router.get('/requests', async (req, res) => {
    try {
        const query = { organizationId: req.orgId };
        
        // If Staff, restrict to self
        if (req.user.role !== 'ADMIN') {
            query.employeeId = req.user.employeeId;
        }

        const requests = await LeaveRequest.find(query)
            .populate('employeeId', 'firstName lastName avatar role leaveBalance')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 3. SUBMIT REQUEST (The Ask) ---
const requestSchema = z.object({
    body: z.object({
        type: z.enum(['Vacation', 'Sick', 'Personal', 'Other']),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        reason: z.string().optional()
    })
});

router.post('/request', validate(requestSchema), async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;

        // Validation: End date cannot be before start date
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
        }

        const request = await LeaveRequest.create({
            organizationId: req.orgId,
            employeeId: req.user.employeeId,
            type,
            startDate,
            endDate,
            reason,
            status: 'PENDING'
        });

        res.status(201).json({ success: true, data: request, message: 'Request submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 4. APPROVE/REJECT (The Decision) ---
// Only Admins can do this.
// CRITICAL: If Approved, we MUST deduct the balance from the Employee record.
router.put('/requests/:id/action', authorize('ADMIN'), async (req, res) => {
    try {
        const { status } = req.body; // 'APPROVED' or 'REJECTED'
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await LeaveRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'PENDING') return res.status(400).json({ message: 'Request already processed' });

        // Update Request Status
        request.status = status;
        request.reviewedBy = req.user._id;
        await request.save();

        // LOGIC: If Approved, deduct balance
        if (status === 'APPROVED') {
            const start = new Date(request.startDate);
            const end = new Date(request.endDate);
            // Calculate days (inclusive)
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            
            await Employee.findByIdAndUpdate(request.employeeId, { 
                $inc: { leaveBalance: -days },
                status: 'On Leave'
            });

            // Audit Log
            await AuditLog.create({
                organizationId: req.orgId,
                action: 'Leave Approved',
                actor: `${req.user.firstName} ${req.user.lastName}`,
                actorId: req.user._id,
                target: 'Leave Request',
                targetId: request._id,
                details: `Approved ${days} days for ${request.type}`
            });
        }

        res.json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;