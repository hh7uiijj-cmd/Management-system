const mongoose = require('mongoose');

// MASTER_TASK_LIST — รายการงาน/รายงานหลักของทั้งโครงการ (No. / งาน-รายงาน / ผู้รับผิดชอบ)
// แยกจาก TASK_MASTER ใช้เป็นรายการสรุปภาพรวม ไม่แบ่งตามฝ่าย
const masterTaskItemSchema = new mongoose.Schema({
  no: {
    type: Number,
    default: null,
  },
  task: {
    type: String,
    required: true,
    trim: true,
  },
  responsible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
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

module.exports = mongoose.model('MasterTaskItem', masterTaskItemSchema);
