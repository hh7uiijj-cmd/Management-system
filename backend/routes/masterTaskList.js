const express = require('express');
const router = express.Router();
const MasterTaskItem = require('../models/MasterTaskItem');
const auth = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const POPULATE = [
  { path: 'responsible', select: 'name email department' },
  { path: 'createdBy', select: 'name email' },
];

// เพิ่ม/แก้ไข/ลบ ได้เฉพาะแอดมิน/ประธาน/รองประธาน/หัวหน้าฝ่าย/เลขาฝ่าย (ทุกฝ่าย ไม่จำกัดฝ่ายตัวเอง) — สมาชิกทั่วไปดูได้อย่างเดียว
const canManage = (req) => ['admin', 'president', 'vice_president', 'head', 'secretary'].includes(req.user.role?.name);

// GET /api/master-task-list — ทุกคนที่ล็อกอินดูได้ (ไม่แบ่งฝ่าย)
router.get('/', auth, async (req, res) => {
  try {
    const items = await MasterTaskItem.find({}).populate(POPULATE).sort({ no: 1, createdAt: 1 });
    res.json(items);
  } catch (error) {
    console.error('Get master task list error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// POST /api/master-task-list
router.post('/', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เพิ่มรายการนี้' });

    const { no, task, responsible } = req.body;
    if (!task) return res.status(400).json({ message: 'กรุณากรอกชื่องาน/รายงาน' });

    const item = new MasterTaskItem({
      no: no === '' || no === undefined ? null : no,
      task,
      responsible: responsible || null,
      createdBy: req.user._id,
    });
    await item.save();
    await item.populate(POPULATE);

    await logAudit({ req, module: 'MASTER_TASK_LIST', action: 'create', entityId: item._id, summary: `เพิ่มรายการ: ${item.task}` });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create master task item error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/master-task-list/:id
router.put('/:id', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' });

    const item = await MasterTaskItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการนี้' });

    const { no, task, responsible } = req.body;
    if (no !== undefined) item.no = no === '' ? null : no;
    if (task) item.task = task;
    if (responsible !== undefined) item.responsible = responsible || null;

    await item.save();
    await item.populate(POPULATE);

    await logAudit({ req, module: 'MASTER_TASK_LIST', action: 'update', entityId: item._id, summary: `แก้ไขรายการ: ${item.task}` });

    res.json(item);
  } catch (error) {
    console.error('Update master task item error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/master-task-list/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบรายการนี้' });

    const item = await MasterTaskItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการนี้' });

    await item.deleteOne();

    await logAudit({ req, module: 'MASTER_TASK_LIST', action: 'delete', entityId: item._id, summary: `ลบรายการ: ${item.task}` });

    res.json({ message: 'ลบรายการเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete master task item error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
