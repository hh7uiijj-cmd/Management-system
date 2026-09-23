const mongoose = require('mongoose');
const { DEPARTMENTS, TASK_STATUSES, TASK_PRIORITIES } = require('../config/constants');

// TASK_MASTER (T)
const taskMasterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  department: {
    type: String,
    enum: DEPARTMENTS,
    required: true,
  },
  mainAssignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coAssignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: TASK_STATUSES,
    default: TASK_STATUSES[0],
  },
  priority: {
    type: String,
    enum: TASK_PRIORITIES,
    default: TASK_PRIORITIES[1],
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

taskMasterSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('TaskMaster', taskMasterSchema);
