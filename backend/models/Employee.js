const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['Frontend Dev', 'Product Manager', 'Designer'],
        required: true
    },
    department: {
        type: String,
        enum: ['Engineering', 'Product', 'Design'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'On Leave', 'Terminated'],
        default: 'Active',
        index: true
    },
    salary: {
        type: Number,
        required: true
    },
    joinDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    avatar: {
        type: String,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    leaveBalance: {
        type: Number,
        default: 20 // Default 20 days PTO
    },
});

// Compound index for org scoping and filtering
employeeSchema.index({ organizationId: 1, status: 1, deletedAt: 1 });
employeeSchema.index({ organizationId: 1, email: 1 });

// Virtual for full name
employeeSchema.virtual('name').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

employeeSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Employee', employeeSchema);
