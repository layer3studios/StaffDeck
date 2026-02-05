const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, requireOrg, authorize } = require('../middleware/auth');

router.use(protect, requireOrg, authorize('ADMIN'));

// @route   GET /api/audit
// @desc    Get audit logs
// @access  Private (Admin only)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const logs = await AuditLog.find({
            organizationId: req.orgId
        })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments({
            organizationId: req.orgId
        });

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
