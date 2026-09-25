const mongoose = require('mongoose');
const { DEPARTMENTS, RISK_ISSUE_TYPES, IMPACT_LEVELS, LIKELIHOOD_LEVELS, RISK_ISSUE_STATUSES } = require('../config/constants');

// RISK_ISSUE (RI) — ความเสี่ยง/ปัญหา, ระดับผลกระทบ-โอกาสเกิด
const riskIssueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: RISK_ISSUE_TYPES,
    default: RISK_ISSUE_TYPES[0],
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
  impactLevel: {
    type: String,
    enum: IMPACT_LEVELS,
    default: IMPACT_LEVELS[1],
  },
  likelihoodLevel: {
    type: String,
    enum: LIKELIHOOD_LEVELS,
    default: LIKELIHOOD_LEVELS[1],
  },
  status: {
    type: String,
    enum: RISK_ISSUE_STATUSES,
    default: RISK_ISSUE_STATUSES[0],
  },
  mitigation: {
    type: String,
    trim: true,
    default: '',
  },
  owner: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
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

module.exports = mongoose.model('RiskIssue', riskIssueSchema);
