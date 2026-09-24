const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const { departmentFilter } = require('../middleware/moduleAccess');

// AUDIT_LOG (A) — อ่านอย่างเดียว ไม่มี route แก้ไข/ลบ
router.get('/', auth, async (req, res) => {
  try {
    const role = req.user.role?.name;
    if (!['admin', 'president', 'vice_president', 'head', 'secretary'].includes(role)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ดูประวัติการแก้ไข' });
    }

    const logs = await AuditLog.find(departmentFilter(req))
      .populate({
        path: 'performedBy',
        select: 'name email department',
        populate: { path: 'role', select: 'name displayName' },
      })
      .sort({ createdAt: -1 })
      .limit(500);
    res.json(logs);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
