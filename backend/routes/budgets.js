const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const { moduleAccess, departmentFilter, canAccessDoc } = require('../middleware/moduleAccess');
const { logAudit } = require('../utils/audit');

const POPULATE = [
  { path: 'relatedTask', select: 'title' },
  { path: 'createdBy', select: 'name email' },
];

router.get('/', auth, moduleAccess('view'), async (req, res) => {
  try {
    const budgets = await Budget.find(departmentFilter(req)).populate(POPULATE).sort({ createdAt: -1 });
    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.post('/', auth, moduleAccess('create'), async (req, res) => {
  try {
    const { item, category, department, relatedTask, initialBudget, estimatedCost, actualCost, note } = req.body;
    if (!item || !department) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    const role = req.user.role?.name;
    if (role !== 'admin' && !['president', 'vice_president'].includes(role) && department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถเพิ่มงบประมาณได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const budget = new Budget({
      item, category, department, relatedTask: relatedTask || null,
      initialBudget, estimatedCost, actualCost, note, createdBy: req.user._id,
    });
    await budget.save();
    await budget.populate(POPULATE);

    await logAudit({ req, module: 'BUDGET', action: 'create', entityId: budget._id, department: budget.department, summary: `สร้างรายการงบประมาณ: ${budget.item}` });

    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.put('/:id', auth, moduleAccess('edit'), async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: 'ไม่พบรายการงบประมาณนี้' });
    if (!canAccessDoc(req, budget, { action: 'edit' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' });
    }

    const { item, category, relatedTask, initialBudget, estimatedCost, actualCost, note } = req.body;
    if (item) budget.item = item;
    if (category) budget.category = category;
    if (relatedTask !== undefined) budget.relatedTask = relatedTask;
    if (initialBudget !== undefined) budget.initialBudget = initialBudget;
    if (estimatedCost !== undefined) budget.estimatedCost = estimatedCost;
    if (actualCost !== undefined) budget.actualCost = actualCost;
    if (note !== undefined) budget.note = note;

    await budget.save();
    await budget.populate(POPULATE);

    await logAudit({ req, module: 'BUDGET', action: 'update', entityId: budget._id, department: budget.department, summary: `แก้ไขรายการงบประมาณ: ${budget.item}` });

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.delete('/:id', auth, moduleAccess('delete'), async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ message: 'ไม่พบรายการงบประมาณนี้' });
    if (!canAccessDoc(req, budget, { action: 'delete' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบรายการนี้' });
    }

    await budget.deleteOne();

    await logAudit({ req, module: 'BUDGET', action: 'delete', entityId: budget._id, department: budget.department, summary: `ลบรายการงบประมาณ: ${budget.item}` });

    res.json({ message: 'ลบรายการงบประมาณเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
