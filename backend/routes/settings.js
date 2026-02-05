const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const { protect, requireOrg, authorize } = require('../middleware/auth');

router.use(protect, requireOrg);

// @route   GET /api/settings
// @desc    Get organization settings
// @access  Private
router.get('/', async (req, res) => {
    try {
        const org = await Organization.findById(req.orgId);

        if (!org) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        res.json({
            success: true,
            data: org
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/settings
// @desc    Update organization settings
// @access  Private (Admin only)
router.put('/', authorize('ADMIN'), async (req, res) => {
    try {
        const { name, domain, timezone, settings } = req.body;

        const org = await Organization.findById(req.orgId);

        if (!org) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        if (name) org.name = name;
        if (domain) org.domain = domain;
        if (timezone) org.timezone = timezone;
        if (settings) org.settings = { ...org.settings, ...settings };

        await org.save();

        res.json({
            success: true,
            data: org,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
