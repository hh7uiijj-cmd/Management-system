const express = require('express');
const router = express.Router();
const TaskMaster = require('../models/TaskMaster');
const DocumentFile = require('../models/DocumentFile');
const LetterTracker = require('../models/LetterTracker');
const Member = require('../models/Member');
const auth = require('../middleware/auth');

const TOP_TIERS = ['admin', 'president', 'vice_president'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/search?q=... — ค้นหาแบบรวดเร็วข้ามโมดูล (งาน/เอกสาร/หนังสือราชการ/สมาชิก) สำหรับช่องค้นหาบน Navbar
router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const re = new RegExp(escapeRegex(q), 'i');
    const isTopTier = TOP_TIERS.includes(req.user.role?.name);
    const deptFilter = isTopTier ? {} : { department: req.user.department };

    const [tasks, documents, letters, members] = await Promise.all([
      TaskMaster.find({ ...deptFilter, title: re }).select('title department').limit(5),
      DocumentFile.find({ title: re }).select('title department').limit(5),
      LetterTracker.find({ ...deptFilter, subject: re }).select('subject department').limit(5),
      Member.find({ $or: [{ name: re }, { nickname: re }] }).select('name nickname department').limit(5),
    ]);

    const results = [
      ...tasks.map((t) => ({ type: 'task', typeLabel: 'งาน', label: t.title, department: t.department, link: '/tasks' })),
      ...documents.map((d) => ({ type: 'document', typeLabel: 'เอกสาร', label: d.title, department: d.department, link: '/documents' })),
      ...letters.map((l) => ({ type: 'letter', typeLabel: 'หนังสือราชการ', label: l.subject, department: l.department, link: '/letters' })),
      ...members.map((m) => ({ type: 'member', typeLabel: 'สมาชิก', label: `${m.name}${m.nickname ? ` (${m.nickname})` : ''}`, department: m.department, link: '/members' })),
    ];

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
