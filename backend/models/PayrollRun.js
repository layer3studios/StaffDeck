const mongoose = require('mongoose');

const payrollRunSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    runDate: {
        type: Date,
        default: Date.now
    },
    periodStart: {
        type: Date,
        required: true
    },
    periodEnd: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
        default: 'PROCESSING'
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    employeeCount: {
        type: Number,
        default: 0
    },
    items: [{
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        employeeName: String,
        amount: Number,
        salarySnapshot: Number
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true
    },
    failureReason: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

payrollRunSchema.index({ organizationId: 1, createdAt: -1 });
payrollRunSchema.index({ organizationId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model('PayrollRun', payrollRunSchema);
