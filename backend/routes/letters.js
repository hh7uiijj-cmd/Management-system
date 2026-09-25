const express = require('express');
const router = express.Router();
const LetterTracker = require('../models/LetterTracker');
const auth = require('../middleware/auth');
const { moduleAccess, departmentFilter, canAccessDoc } = require('../middleware/moduleAccess');
const { logAudit } = require('../utils/audit');

const POPULATE = [
  { path: 'relatedTask', select: 'title' },
  { path: 'createdBy', select: 'name email' },
];

router.get('/', auth, moduleAccess('view'), async (req, res) => {
  try {
    const letters = await LetterTracker.find(departmentFilter(req)).populate(POPULATE).sort({ createdAt: -1 });
    res.json(letters);
  } catch (error) {
    console.error('Get letters error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.post('/', auth, moduleAccess('create'), async (req, res) => {
  try {
    const { letterNumber, subject, department, sentTo, sentDate, dueDate, relatedTask, status, fileUrl } = req.body;
    if (!letterNumber || !subject || !department) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    const role = req.user.role?.name;
    if (role !== 'admin' && !['president', 'vice_president'].includes(role) && department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถเพิ่มหนังสือได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const existing = await LetterTracker.findOne({ letterNumber: letterNumber.trim() });
    if (existing) {
      return res.status(400).json({ message: `เลขที่หนังสือ "${letterNumber}" ถูกใช้ไปแล้ว กรุณาใช้เลขอื่น` });
    }

    const letter = new LetterTracker({
      letterNumber, subject, department, sentTo, sentDate, dueDate,
      relatedTask: relatedTask || null, status, fileUrl, createdBy: req.user._id,
    });
    await letter.save();
    await letter.populate(POPULATE);

    await logAudit({ req, module: 'LETTER_TRACKER', action: 'create', entityId: letter._id, department: letter.department, summary: `สร้างหนังสือ: ${letter.subject}` });

    res.status(201).json(letter);
  } catch (error) {
    console.error('Create letter error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.put('/:id', auth, moduleAccess('edit'), async (req, res) => {
  try {
    const letter = await LetterTracker.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'ไม่พบหนังสือนี้' });
    if (!canAccessDoc(req, letter, { action: 'edit' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขหนังสือนี้' });
    }

    const { subject, sentTo, sentDate, dueDate, relatedTask, status, fileUrl } = req.body;
    if (subject) letter.subject = subject;
    if (sentTo !== undefined) letter.sentTo = sentTo;
    if (sentDate !== undefined) letter.sentDate = sentDate;
    if (dueDate !== undefined) letter.dueDate = dueDate;
    if (relatedTask !== undefined) letter.relatedTask = relatedTask;
    if (status) letter.status = status;
    if (fileUrl !== undefined) letter.fileUrl = fileUrl;

    await letter.save();
    await letter.populate(POPULATE);

    await logAudit({ req, module: 'LETTER_TRACKER', action: 'update', entityId: letter._id, department: letter.department, summary: `แก้ไขหนังสือ: ${letter.subject}` });

    res.json(letter);
  } catch (error) {
    console.error('Update letter error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.delete('/:id', auth, moduleAccess('delete'), async (req, res) => {
  try {
    const letter = await LetterTracker.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'ไม่พบหนังสือนี้' });
    if (!canAccessDoc(req, letter, { action: 'delete' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบหนังสือนี้' });
    }

    await letter.deleteOne();

    await logAudit({ req, module: 'LETTER_TRACKER', action: 'delete', entityId: letter._id, department: letter.department, summary: `ลบหนังสือ: ${letter.subject}` });

    res.json({ message: 'ลบหนังสือเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete letter error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
