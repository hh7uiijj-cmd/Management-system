const mongoose = require('mongoose');
const { DEPARTMENTS } = require('../config/constants');

// AUDIT_LOG (A) — insert-only: no update/delete routes are exposed for this model.
const auditLogSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    trim: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  department: {
    type: String,
    enum: [...DEPARTMENTS, null],
    default: null,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  summary: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
