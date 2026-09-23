const express = require('express');
const router = express.Router();
const DocumentFile = require('../models/DocumentFile');
const auth = require('../middleware/auth');
const { moduleAccess, departmentFilter, canAccessDoc } = require('../middleware/moduleAccess');
const { logAudit } = require('../utils/audit');
const { DOCUMENT_APPROVAL_STATUSES } = require('../config/constants');

const POPULATE = [
  { path: 'relatedTask', select: 'title' },
  { path: 'uploadedBy', select: 'name email' },
  { path: 'approvalHistory.by', select: 'name' },
];

// GET /api/documents
router.get('/', auth, moduleAccess('view'), async (req, res) => {
  try {
    const documents = await DocumentFile.find(departmentFilter(req))
      .populate(POPULATE)
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/documents/:id
router.get('/:id', auth, moduleAccess('view'), async (req, res) => {
  try {
    const doc = await DocumentFile.findById(req.params.id).populate(POPULATE);
    if (!doc) return res.status(404).json({ message: 'ไม่พบเอกสารนี้' });
    if (!canAccessDoc(req, doc, { ownerField: 'uploadedBy', action: 'view' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ดูเอกสารนี้' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// POST /api/documents
router.post('/', auth, moduleAccess('create'), async (req, res) => {
  try {
    const { title, category, department, relatedTask, fileUrl } = req.body;
    if (!title || !category || !department) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const role = req.user.role?.name;
    if (role !== 'admin' && !['president', 'vice_president'].includes(role) && department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถเพิ่มเอกสารได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const doc = new DocumentFile({
      title,
      category,
      department,
      relatedTask: relatedTask || null,
      fileUrl,
      uploadedBy: req.user._id,
      approvalHistory: [{ status: DOCUMENT_APPROVAL_STATUSES[0], by: req.user._id, note: 'สร้างเอกสาร' }],
    });

    await doc.save();
    await doc.populate(POPULATE);

    await logAudit({ req, module: 'DOCUMENT', action: 'create', entityId: doc._id, department: doc.department, summary: `สร้างเอกสาร: ${doc.title}` });

    res.status(201).json(doc);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/documents/:id
router.put('/:id', auth, moduleAccess('edit'), async (req, res) => {
  try {
    const doc = await DocumentFile.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'ไม่พบเอกสารนี้' });
    if (!canAccessDoc(req, doc, { ownerField: 'uploadedBy', action: 'edit' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขเอกสารนี้' });
    }

    const { title, category, relatedTask, fileUrl } = req.body;
    if (title) doc.title = title;
    if (category) doc.category = category;
    if (relatedTask !== undefined) doc.relatedTask = relatedTask;
    if (fileUrl !== undefined) doc.fileUrl = fileUrl;

    await doc.save();
    await doc.populate(POPULATE);

    await logAudit({ req, module: 'DOCUMENT', action: 'update', entityId: doc._id, department: doc.department, summary: `แก้ไขเอกสาร: ${doc.title}` });

    res.json(doc);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/documents/:id/approve - เปลี่ยนสถานะอนุมัติ (6 ขั้น)
router.put('/:id/approve', auth, moduleAccess('approve'), async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!status || !DOCUMENT_APPROVAL_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'สถานะอนุมัติไม่ถูกต้อง' });
    }

    const doc = await DocumentFile.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'ไม่พบเอกสารนี้' });
    if (!canAccessDoc(req, doc, { ownerField: 'uploadedBy', action: 'approve' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์อนุมัติเอกสารนี้' });
    }

    doc.approvalStatus = status;
    doc.approvalHistory.push({ status, by: req.user._id, note: note || '' });
    await doc.save();
    await doc.populate(POPULATE);

    await logAudit({ req, module: 'DOCUMENT', action: 'approve', entityId: doc._id, department: doc.department, summary: `เปลี่ยนสถานะเอกสาร "${doc.title}" เป็น ${status}` });

    res.json(doc);
  } catch (error) {
    console.error('Approve document error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', auth, moduleAccess('delete'), async (req, res) => {
  try {
    const doc = await DocumentFile.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'ไม่พบเอกสารนี้' });
    if (!canAccessDoc(req, doc, { ownerField: 'uploadedBy', action: 'delete' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบเอกสารนี้' });
    }

    await doc.deleteOne();

    await logAudit({ req, module: 'DOCUMENT', action: 'delete', entityId: doc._id, department: doc.department, summary: `ลบเอกสาร: ${doc.title}` });

    res.json({ message: 'ลบเอกสารเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
