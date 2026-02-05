const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const PayrollRun = require('../models/PayrollRun');
const { protect, requireOrg } = require('../middleware/auth');

router.use(protect, requireOrg);


router.get('/stats', async (req, res) => {
    try {
        const isAdmin = req.user.role === 'ADMIN';

        // Get employee counts
        const [totalEmployees, activeEmployees, onLeaveEmployees, terminatedEmployees] = await Promise.all([
            Employee.countDocuments({ organizationId: req.orgId, deletedAt: null }),
            Employee.countDocuments({ organizationId: req.orgId, deletedAt: null, status: 'Active' }),
            Employee.countDocuments({ organizationId: req.orgId, deletedAt: null, status: 'On Leave' }),
            Employee.countDocuments({ organizationId: req.orgId, deletedAt: null, status: 'Terminated' })
        ]);

        // Get new hires this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newThisMonth = await Employee.countDocuments({
            organizationId: req.orgId,
            deletedAt: null,
            joinDate: { $gte: startOfMonth }
        });

        // Get on leave employees for avatar stack
        const onLeaveEmployeesList = await Employee.find({
            organizationId: req.orgId,
            deletedAt: null,
            status: 'On Leave'
        }).select('firstName lastName avatar').limit(5);

        // Payroll stats (admin only)
        let payrollStats = null;

      if (isAdmin) {
            const activeEmps = await Employee.find({
                organizationId: req.orgId,
                deletedAt: null,
                status: 'Active'
            }).select('salary');

            // Robust sum: Ensure emp.salary is treated as a number
            const totalAnnualPayroll = activeEmps.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0);
            
            // Monthly calculation
            const projectedMonthly = Math.round(totalAnnualPayroll / 12);
            
            const avgSalary = activeEmps.length > 0 ? Math.round(totalAnnualPayroll / activeEmps.length) : 0;

            const Organization = require('../models/Organization');
            const org = await Organization.findById(req.orgId);
            const nextPayrollDate = org?.settings?.nextPayrollDate || new Date();

            const now = new Date();
            const diffTime = new Date(nextPayrollDate) - now;
            const dueInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            payrollStats = {
                totalAnnualPayroll,
                projectedPayroll: projectedMonthly, // This will now surely be > 0 if you have employees
                avgSalary,
                nextPayrollDate,
                dueInDays
            };
        }

        res.json({
            success: true,
            data: {
                totalEmployees,
                activeEmployees,
                onLeaveCount: onLeaveEmployees,
                terminatedEmployees,
                newThisMonth,
                recentOnLeave: onLeaveEmployeesList,
                offersSent: 5, // Placeholder
                offersAcceptedThisMonth: 2, // Placeholder
                
                // Returns null if not admin
                payroll: payrollStats, 

                // Convenience aliases (safe access)
                nextPayrollCost: payrollStats?.projectedPayroll || 0,
                avgSalary: payrollStats?.avgSalary || 0,
                nextPayrollDate: payrollStats?.nextPayrollDate || null,
                dueInDays: payrollStats?.dueInDays ?? null
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/dashboard/payroll-trend
// @desc    Get 12-month payroll trend data
// @access  Private (Admin only)
router.get('/payroll-trend', async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        // Get last 12 months of payroll runs
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);

        const payrollRuns = await PayrollRun.find({
            organizationId: req.orgId,
            status: 'COMPLETED',
            runDate: { $gte: twelveMonthsAgo }
        }).sort({ runDate: 1 });

        // Create array of last 12 months
        const trendData = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short' });

            // Find payroll run for this month
            const run = payrollRuns.find(r => {
                const runDate = new Date(r.runDate);
                return runDate.getMonth() === date.getMonth() && runDate.getFullYear() === date.getFullYear();
            });

            trendData.push({
                month: monthKey,
                amount: run ? run.totalAmount : 0
            });
        }

        res.json({
            success: true,
            data: trendData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
