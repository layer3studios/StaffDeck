const express = require('express');
const router = express.Router();
const { protect, requireOrg } = require('../middleware/auth');

router.use(protect, requireOrg);

// @route   GET /api/billing
// @desc    Get subscription details (Mock)
// @access  Private
router.get('/', async (req, res) => {
    // In a real app, you would fetch this from Stripe/Paddle using req.orgId
    const mockBilling = {
        plan: 'Pro Plan',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        amount: 2900, // $29.00
        paymentMethod: {
            brand: 'visa',
            last4: '4242'
        },
        invoices: [
            { id: 'inv_123', date: new Date(), amount: 2900, status: 'paid' },
            { id: 'inv_122', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), amount: 2900, status: 'paid' }
        ]
    };

    res.json({
        success: true,
        data: mockBilling
    });
});

module.exports = router;