const mongoose = require('mongoose');
const { DEPARTMENTS, DOCUMENT_CATEGORIES, DOCUMENT_APPROVAL_STATUSES } = require('../config/constants');

// DOCUMENT (D) — เอกสาร, หมวดหมู่ 10 แบบ, สถานะอนุมัติ 6 ขั้น
const documentFileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: DOCUMENT_CATEGORIES,
    required: true,
  },
  department: {
    type: String,
    enum: DEPARTMENTS,
    required: true,
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskMaster',
    default: null,
  },
  approvalStatus: {
    type: String,
    enum: DOCUMENT_APPROVAL_STATUSES,
    default: DOCUMENT_APPROVAL_STATUSES[0],
  },
  fileUrl: {
    type: String,
    trim: true,
    default: '',
  },
  approvalHistory: [{
    status: { type: String, enum: DOCUMENT_APPROVAL_STATUSES },
    note: { type: String, trim: true, default: '' },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DocumentFile', documentFileSchema);
