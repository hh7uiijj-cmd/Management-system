const express = require('express');
const router = express.Router();
const MasterTaskItem = require('../models/MasterTaskItem');
const auth = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const POPULATE = [
  { path: 'responsible', select: 'name email department' },
  { path: 'supporters', select: 'name email department' },
  { path: 'createdBy', select: 'name email' },
];

const TOP_TIERS = ['admin', 'president', 'vice_president'];
const isTopTier = (req) => TOP_TIERS.includes(req.user.role?.name);
const isDeptLead = (req) => ['head', 'secretary'].includes(req.user.role?.name);

// หัวหน้า/เลขา/สมาชิก เห็นได้เฉพาะฝ่ายตัวเอง — ประธาน/รองประธาน/แอดมิน เห็นได้ทุกฝ่าย (เลือกดูทีละฝ่ายได้ที่ฝั่ง UI)
// GET /api/master-task-list
router.get('/', auth, async (req, res) => {
  try {
    const filter = isTopTier(req) ? {} : { department: req.user.department };
    const items = await MasterTaskItem.find(filter).populate(POPULATE).sort({ department: 1, no: 1, createdAt: 1 });
    res.json(items);
  } catch (error) {
    console.error('Get master task list error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// POST /api/master-task-list — แอดมิน/ประธาน/รองประธานเลือกฝ่ายได้เอง ส่วนหัวหน้า/เลขาเพิ่มได้เฉพาะฝ่ายตัวเอง
router.post('/', auth, async (req, res) => {
  try {
    if (!isTopTier(req) && !isDeptLead(req)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เพิ่มรายการนี้' });
    }

    const { no, task, responsible, supporters } = req.body;
    if (!task) return res.status(400).json({ message: 'กรุณากรอกชื่องาน/รายงาน' });

    const department = isTopTier(req) ? req.body.department : req.user.department;
    if (!department) return res.status(400).json({ message: 'กรุณาระบุฝ่าย' });

    let itemNo = no === '' || no === undefined ? null : no;
    if (itemNo === null) {
      const last = await MasterTaskItem.findOne({ department }).sort({ no: -1 });
      itemNo = (last?.no || 0) + 1;
    }

    const item = new MasterTaskItem({
      department,
      no: itemNo,
      task,
      responsible: responsible || [],
      supporters: supporters || [],
      createdBy: req.user._id,
    });
    await item.save();
    await item.populate(POPULATE);

    await logAudit({ req, module: 'MASTER_TASK_LIST', action: 'create', entityId: item._id, department: item.department, summary: `เพิ่มรายการ: ${item.task}` });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create master task item error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/master-task-list/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await MasterTaskItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการนี้' });

    if (!isTopTier(req) && !(isDeptLead(req) && item.department === req.user.department)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' });
    }

    const { no, task, responsible, supporters } = req.body;
    if (no !== undefined) item.no = no === '' ? null : no;
    if (task) item.task = task;
    if (responsible !== undefined) item.responsible = responsible || [];
    if (supporters !== undefined) item.supporters = supporters || [];

    await item.save();
    await item.populate(POPULATE);

    await logAudit({ req, module: 'MASTER_TASK_LIST', action: 'update', entityId: item._id, department: item.department, summary: `แก้ไขรายการ: ${item.task}` });

    res.json(item);
  } catch (error) {
    console.error('Update master task item error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/master-task-list/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await MasterTaskItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'ไม่พบรายการนี้' });

    if (!isTopTier(req) && !(isDeptLead(req) && item.department === req.user.department)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบรายการนี้' });
    }

    await item.deleteOne();

    await logAudit({ req, module: 'MASTER_TASK_LIST', action: 'delete', entityId: item._id, department: item.department, summary: `ลบรายการ: ${item.task}` });

    res.json({ message: 'ลบรายการเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete master task item error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
