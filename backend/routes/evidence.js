const express = require('express');
const router = express.Router();
const Evidence = require('../models/Evidence');
const auth = require('../middleware/auth');
const { moduleAccess, departmentFilter, canAccessDoc } = require('../middleware/moduleAccess');
const { logAudit } = require('../utils/audit');

const POPULATE = [
  { path: 'relatedTask', select: 'title department' },
  { path: 'uploadedBy', select: 'name email' },
];

router.get('/', auth, moduleAccess('view'), async (req, res) => {
  try {
    const query = { ...departmentFilter(req) };
    if (req.query.taskId) query.relatedTask = req.query.taskId;
    const evidence = await Evidence.find(query).populate(POPULATE).sort({ createdAt: -1 });
    res.json(evidence);
  } catch (error) {
    console.error('Get evidence error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.post('/', auth, moduleAccess('create'), async (req, res) => {
  try {
    const { relatedTask, department, description, fileUrl } = req.body;
    if (!relatedTask || !department) {
      return res.status(400).json({ message: 'กรุณาระบุงานที่เกี่ยวข้องและฝ่าย' });
    }
    const role = req.user.role?.name;
    if (role !== 'admin' && !['president', 'vice_president'].includes(role) && department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถเพิ่มหลักฐานได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const evidence = new Evidence({ relatedTask, department, description, fileUrl, uploadedBy: req.user._id });
    await evidence.save();
    await evidence.populate(POPULATE);

    await logAudit({ req, module: 'EVIDENCE', action: 'create', entityId: evidence._id, department: evidence.department, summary: 'เพิ่มหลักฐานผูกกับงาน' });

    res.status(201).json(evidence);
  } catch (error) {
    console.error('Create evidence error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.delete('/:id', auth, moduleAccess('delete'), async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.id);
    if (!evidence) return res.status(404).json({ message: 'ไม่พบหลักฐานนี้' });
    if (!canAccessDoc(req, evidence, { ownerField: 'uploadedBy', action: 'delete' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบหลักฐานนี้' });
    }

    await evidence.deleteOne();

    await logAudit({ req, module: 'EVIDENCE', action: 'delete', entityId: evidence._id, department: evidence.department, summary: 'ลบหลักฐาน' });

    res.json({ message: 'ลบหลักฐานเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete evidence error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
