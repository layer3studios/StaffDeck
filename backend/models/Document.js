const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    type: {
        type: String,
        enum: ['Policy', 'Template', 'Legal', 'Offer Letter', 'NDA', 'ID Proof', 'Other'],
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: String,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

documentSchema.index({ organizationId: 1, employeeId: 1, isDeleted: 1 });

module.exports = mongoose.model('Document', documentSchema);
