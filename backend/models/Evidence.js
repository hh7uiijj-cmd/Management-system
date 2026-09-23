const mongoose = require('mongoose');
const { DEPARTMENTS } = require('../config/constants');

// EVIDENCE (E) — หลักฐานผูกกับแต่ละงาน
const evidenceSchema = new mongoose.Schema({
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskMaster',
    required: true,
  },
  department: {
    type: String,
    enum: DEPARTMENTS,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  fileUrl: {
    type: String,
    trim: true,
    default: '',
  },
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

module.exports = mongoose.model('Evidence', evidenceSchema);
