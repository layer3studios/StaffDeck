const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { protect, requireOrg } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Unique filename: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Allow images, pdfs, docs
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and documents are allowed'));
        }
    }
});

router.use(protect, requireOrg);

// @route   GET /api/documents
// @desc    Get all documents
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { search, employeeId } = req.query;

        const query = {
            organizationId: req.orgId,
            isDeleted: false
        };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (employeeId) {
            query.employeeId = employeeId;
        }

        const documents = await Document.find(query)
            .populate('uploadedBy', 'firstName lastName')
            .sort({ uploadedAt: -1 });

        res.json({
            success: true,
            data: documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/documents
// @desc    Upload a document
// @access  Private
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const { type, name, employeeId } = req.body;

        const document = await Document.create({
            organizationId: req.orgId,
            employeeId: employeeId || null,
            type: type || 'Other',
            name: name || req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            size: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user._id
        });

        // Populate uploader info for immediate frontend display
        await document.populate('uploadedBy', 'firstName lastName');

        res.status(201).json({
            success: true,
            data: document,
            message: 'Document uploaded successfully'
        });
    } catch (error) {
        // Cleanup file if DB insert fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Soft delete document
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            organizationId: req.orgId
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        document.isDeleted = true;
        await document.save();

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
