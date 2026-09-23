const mongoose = require('mongoose');
const { DEPARTMENTS, MEMBER_WORK_STATUSES } = require('../config/constants');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    enum: DEPARTMENTS,
    required: true,
  },
  position: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  workStatus: {
    type: String,
    enum: MEMBER_WORK_STATUSES,
    default: MEMBER_WORK_STATUSES[0],
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Member', memberSchema);
