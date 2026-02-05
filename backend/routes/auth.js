const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Employee = require('../models/Employee');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10,
    message: { success: false, message: "Too many login attempts, please try again later" }
});

const registerSchema = z.object({
    body: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        companyName: z.string().min(2).default('My Organization')
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string()
    })
});

const updateProfileSchema = z.object({
    body: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional()
    })
});

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// @route   POST /api/auth/register
// @desc    Register new user AND new organization
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
    // NOTE: Transactions removed for standalone DB compatibility
    try {
        const { firstName, lastName, email, password, companyName } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const organization = await Organization.create({
            name: companyName,
            domain: email.split('@')[1],
            timezone: 'Asia/Kolkata',
            settings: { payFrequency: 'MONTHLY' }
        });

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            organizationId: organization._id,
            role: 'ADMIN'
        });

        const employee = await Employee.create({
            organizationId: organization._id,
            userId: user._id,
            firstName,
            lastName,
            email,
            role: 'Product Manager',
            department: 'Engineering',
            status: 'Active',
            salary: 0,
            joinDate: new Date()
        });

        user.employeeId = employee._id;
        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                organizationId: organization._id
            }
        });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account is inactive' });
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                employeeId: user.employeeId
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role,
                organizationId: req.user.organizationId,
                employeeId: req.user.employeeId
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put('/profile', protect, validate(updateProfileSchema), async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const user = await User.findById(req.user.id);

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;