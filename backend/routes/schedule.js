const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const AuditLog = require('../models/AuditLog');
const { protect, requireOrg, authorize } = require('../middleware/auth');
const { z } = require('zod');
const validate = require('../middleware/validate');

router.use(protect, requireOrg);

// Schemas
const requestLeaveSchema = z.object({
    body: z.object({
        type: z.enum(['Sick', 'Vacation', 'Personal', 'Other']),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
        reason: z.string().min(3)
    })
});

const actionSchema = z.object({
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED'])
    })
});

// @route   GET /api/schedule/calendar
// @desc    Get all approved leaves for the calendar view
router.get('/calendar', async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({
            organizationId: req.orgId,
            status: 'APPROVED'
        }).populate('employeeId', 'firstName lastName avatar role');

        res.json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/schedule/requests
// @desc    Get pending requests (Admin: All, Staff: Own)
router.get('/requests', async (req, res) => {
    try {
        const query = { organizationId: req.orgId };
        
        // If not admin, restrict to self
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

// @route   POST /api/schedule/request
// @desc    Submit a leave request
router.post('/request', validate(requestLeaveSchema), async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;

        // Basic date validation
        if (new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
        }

        const request = await LeaveRequest.create({
            organizationId: req.orgId,
            employeeId: req.user.employeeId,
            type,
            startDate,
            endDate,
            reason
        });

        res.status(201).json({ success: true, data: request, message: 'Leave request submitted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/schedule/requests/:id/action
// @desc    Approve/Reject request (Admin Only)
router.put('/requests/:id/action', authorize('ADMIN'), validate(actionSchema), async (req, res) => {
    try {
        const { status } = req.body;
        const request = await LeaveRequest.findOne({ _id: req.params.id, organizationId: req.orgId });

        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
        if (request.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Request already processed' });

        request.status = status;
        request.reviewedBy = req.user._id;
        await request.save();

        // If Approved, deduct balance & update Employee status
        if (status === 'APPROVED') {
            const days = Math.ceil((new Date(request.endDate) - new Date(request.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            
            await Employee.findByIdAndUpdate(request.employeeId, {
                $inc: { leaveBalance: -days },
                status: 'On Leave' // Simple status update
            });

            await AuditLog.create({
                organizationId: req.orgId,
                action: 'Leave Approved',
                actor: `${req.user.firstName} ${req.user.lastName}`,
                actorId: req.user._id,
                target: `Leave Request`,
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