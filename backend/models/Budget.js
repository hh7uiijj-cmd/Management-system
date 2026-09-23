const mongoose = require('mongoose');
const { DEPARTMENTS, BUDGET_CATEGORIES } = require('../config/constants');

// BUDGET (B) — งบตั้งต้น/ประมาณการ/ค่าใช้จ่ายจริง
const budgetSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: BUDGET_CATEGORIES,
    default: BUDGET_CATEGORIES[0],
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
  initialBudget: {
    type: Number,
    default: 0,
    min: 0,
  },
  estimatedCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  actualCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  note: {
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

module.exports = mongoose.model('Budget', budgetSchema);
