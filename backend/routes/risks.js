const express = require('express');
const router = express.Router();
const RiskIssue = require('../models/RiskIssue');
const auth = require('../middleware/auth');
const { moduleAccess, departmentFilter, canAccessDoc } = require('../middleware/moduleAccess');
const { logAudit } = require('../utils/audit');

const POPULATE = [
  { path: 'relatedTask', select: 'title' },
  { path: 'owner', select: 'name email' },
  { path: 'createdBy', select: 'name email' },
];

router.get('/', auth, moduleAccess('view'), async (req, res) => {
  try {
    const risks = await RiskIssue.find(departmentFilter(req)).populate(POPULATE).sort({ createdAt: -1 });
    res.json(risks);
  } catch (error) {
    console.error('Get risks error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.post('/', auth, moduleAccess('create'), async (req, res) => {
  try {
    const { title, type, department, relatedTask, impactLevel, likelihoodLevel, status, mitigation, owner } = req.body;
    if (!title || !department) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }
    const role = req.user.role?.name;
    if (role !== 'admin' && !['president', 'vice_president'].includes(role) && department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถเพิ่มความเสี่ยง/ปัญหาได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const risk = new RiskIssue({
      title, type, department, relatedTask: relatedTask || null,
      impactLevel, likelihoodLevel, status, mitigation, owner: owner || null, createdBy: req.user._id,
    });
    await risk.save();
    await risk.populate(POPULATE);

    await logAudit({ req, module: 'RISK_ISSUE', action: 'create', entityId: risk._id, department: risk.department, summary: `สร้างรายการ: ${risk.title}` });

    res.status(201).json(risk);
  } catch (error) {
    console.error('Create risk error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.put('/:id', auth, moduleAccess('edit'), async (req, res) => {
  try {
    const risk = await RiskIssue.findById(req.params.id);
    if (!risk) return res.status(404).json({ message: 'ไม่พบรายการนี้' });
    if (!canAccessDoc(req, risk, { action: 'edit' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' });
    }

    const { title, impactLevel, likelihoodLevel, status, mitigation, owner, relatedTask } = req.body;
    if (title) risk.title = title;
    if (impactLevel) risk.impactLevel = impactLevel;
    if (likelihoodLevel) risk.likelihoodLevel = likelihoodLevel;
    if (status) risk.status = status;
    if (mitigation !== undefined) risk.mitigation = mitigation;
    if (owner !== undefined) risk.owner = owner;
    if (relatedTask !== undefined) risk.relatedTask = relatedTask;

    await risk.save();
    await risk.populate(POPULATE);

    await logAudit({ req, module: 'RISK_ISSUE', action: 'update', entityId: risk._id, department: risk.department, summary: `แก้ไขรายการ: ${risk.title}` });

    res.json(risk);
  } catch (error) {
    console.error('Update risk error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.delete('/:id', auth, moduleAccess('delete'), async (req, res) => {
  try {
    const risk = await RiskIssue.findById(req.params.id);
    if (!risk) return res.status(404).json({ message: 'ไม่พบรายการนี้' });
    if (!canAccessDoc(req, risk, { action: 'delete' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบรายการนี้' });
    }

    await risk.deleteOne();

    await logAudit({ req, module: 'RISK_ISSUE', action: 'delete', entityId: risk._id, department: risk.department, summary: `ลบรายการ: ${risk.title}` });

    res.json({ message: 'ลบรายการเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete risk error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
