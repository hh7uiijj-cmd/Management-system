const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const auth = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

// MEMBER (M) — ทะเบียนสมาชิก ดูได้ทุกฝ่ายไม่จำกัด (ทะเบียนรวมทั้งโครงการ)
// แก้ไข/เพิ่ม/ลบ ดูแลโดย admin/president/vice_president/head/เลขา เท่านั้น
const canManage = (req) => {
  const role = req.user.role?.name;
  return role === 'admin' || ['president', 'vice_president', 'head', 'secretary'].includes(role);
};

router.get('/', auth, async (req, res) => {
  try {
    const members = await Member.find({}).sort({ department: 1, name: 1 });
    res.json(members);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เพิ่มสมาชิก' });

    const { name, nickname, department, position, phone, email, workStatus, note } = req.body;
    if (!name || !department) return res.status(400).json({ message: 'กรุณากรอกชื่อและฝ่าย' });

    const role = req.user.role?.name;
    if (!['admin', 'president', 'vice_president'].includes(role) && department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถเพิ่มสมาชิกได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const member = new Member({ name, nickname, department, position, phone, email, workStatus, note });
    await member.save();

    await logAudit({ req, module: 'MEMBER', action: 'create', entityId: member._id, department: member.department, summary: `เพิ่มสมาชิก: ${member.name}` });

    res.status(201).json(member);
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขสมาชิก' });

    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'ไม่พบสมาชิกนี้' });

    const role = req.user.role?.name;
    if (!['admin', 'president', 'vice_president'].includes(role) && member.department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถแก้ไขสมาชิกได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const { name, nickname, position, phone, email, workStatus, note } = req.body;
    if (name) member.name = name;
    if (nickname !== undefined) member.nickname = nickname;
    if (position !== undefined) member.position = position;
    if (phone !== undefined) member.phone = phone;
    if (email !== undefined) member.email = email;
    if (workStatus) member.workStatus = workStatus;
    if (note !== undefined) member.note = note;

    await member.save();

    await logAudit({ req, module: 'MEMBER', action: 'update', entityId: member._id, department: member.department, summary: `แก้ไขสมาชิก: ${member.name}` });

    res.json(member);
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!canManage(req)) return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบสมาชิก' });

    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'ไม่พบสมาชิกนี้' });

    const role = req.user.role?.name;
    if (!['admin', 'president', 'vice_president'].includes(role) && member.department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถลบสมาชิกได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    await member.deleteOne();

    await logAudit({ req, module: 'MEMBER', action: 'delete', entityId: member._id, department: member.department, summary: `ลบสมาชิก: ${member.name}` });

    res.json({ message: 'ลบสมาชิกเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
