const mongoose = require('mongoose');
const { DEPARTMENTS, LETTER_STATUSES } = require('../config/constants');

// LETTER_TRACKER (L) — หนังสือราชการที่ส่งออก
const letterTrackerSchema = new mongoose.Schema({
  letterNumber: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    enum: DEPARTMENTS,
    required: true,
  },
  sentTo: {
    type: String,
    trim: true,
    default: '',
  },
  sentDate: {
    type: Date,
    default: null,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskMaster',
    default: null,
  },
  status: {
    type: String,
    enum: LETTER_STATUSES,
    default: LETTER_STATUSES[0],
  },
  fileUrl: {
    type: String,
    trim: true,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LetterTracker', letterTrackerSchema);
