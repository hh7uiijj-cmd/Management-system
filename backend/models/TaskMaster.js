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
  reviewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  startDate: {
    type: Date,
    default: null,
  },
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
  // ส่งงาน — ผู้รับผิดชอบหลัก/ร่วมแต่ละคนส่งผลงานของตัวเองแยกกันได้ (1 รายการต่อ 1 คน แก้ไขทับของตัวเองได้)
  submissions: [{
    link: { type: String, trim: true, default: '' },
    text: { type: String, trim: true, default: '' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
  }],
  // เหตุผลที่ผู้อนุมัติตีกลับให้แก้ไขล่าสุด (ว่างแปลว่าไม่มีงานค้างตีกลับ) — เคลียร์อัตโนมัติเมื่อส่งงานใหม่หรืออนุมัติผ่าน
  rejectionReason: {
    type: String,
    trim: true,
    default: '',
  },
  rejectedAt: {
    type: Date,
    default: null,
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
