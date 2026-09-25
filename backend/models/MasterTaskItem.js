const mongoose = require('mongoose');
const { DEPARTMENTS } = require('../config/constants');

// MASTER_TASK_LIST — รายการงาน/รายงานหลักของแต่ละฝ่าย (No. / งาน-รายงาน / ผู้รับผิดชอบ)
// แยกจาก TASK_MASTER ใช้เป็นรายการสรุปภาพรวม แบ่งตามฝ่ายเหมือนโมดูลอื่น
const masterTaskItemSchema = new mongoose.Schema({
  department: {
    type: String,
    enum: DEPARTMENTS,
    required: true,
  },
  no: {
    type: Number,
    default: null,
  },
  task: {
    type: String,
    required: true,
    trim: true,
  },
  responsible: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  supporters: [{
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

module.exports = mongoose.model('MasterTaskItem', masterTaskItemSchema);
