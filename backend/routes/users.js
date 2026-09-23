const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// GET /api/users/directory - รายชื่อผู้ใช้แบบย่อ สำหรับเลือกผู้รับผิดชอบงาน (ทุกคนที่ login แล้วเรียกได้)
// จำกัดเฉพาะฝ่ายตัวเอง ยกเว้น admin/president/vice_president ที่เห็นทุกฝ่าย
router.get('/directory', auth, async (req, res) => {
  try {
    const role = req.user.role?.name;
    const filter = ['admin', 'president', 'vice_president'].includes(role)
      ? {}
      : { department: req.user.department };
    const users = await User.find(filter).select('name email department').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Get user directory error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/users - list all users
router.get('/', auth, checkPermission('manage_users'), async (req, res) => {
  try {
    const users = await User.find().populate('role', 'name displayName permissions').sort({ createdAt: -1 });
    res.json(users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      createdAt: u.createdAt,
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/users/:id/role - update user role and/or department
router.put('/:id/role', auth, checkPermission('manage_users'), async (req, res) => {
  try {
    const { roleId, department, member } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
    }

    if (roleId) {
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ message: 'ไม่พบ Role ที่ระบุ' });
      }
      user.role = roleId;
    }
    if (department !== undefined) user.department = department;
    if (member !== undefined) user.member = member;

    await user.save();
    await user.populate('role', 'name displayName permissions');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      member: user.member,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/users/:id - delete user
router.delete('/:id', auth, checkPermission('manage_users'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
    }

    await user.deleteOne();
    res.json({ message: 'ลบผู้ใช้เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
