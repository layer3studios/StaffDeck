const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true
    },
    domain: {
        type: String,
        trim: true,
        lowercase: true
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    },
    settings: {
        payFrequency: {
            type: String,
            enum: ['MONTHLY', 'BIWEEKLY'],
            default: 'MONTHLY'
        },
        nextPayrollDate: Date,
        lastPayrollDate: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

organizationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Organization', organizationSchema);
