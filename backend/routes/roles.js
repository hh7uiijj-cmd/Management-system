const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// GET /api/roles
router.get('/', auth, async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 });
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// POST /api/roles
router.post('/', auth, checkPermission('manage_roles'), async (req, res) => {
  try {
    const { name, displayName, permissions } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อ Role ให้ครบถ้วน' });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'ชื่อ Role นี้มีอยู่แล้ว' });
    }

    const role = new Role({ name, displayName, permissions: permissions || [] });
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/roles/:id
// role 'admin' ต้องคง manage_roles/manage_users ไว้เสมอ ป้องกันแอดมินเผลอถอดสิทธิ์ตัวเองจนล็อกระบบ
router.put('/:id', auth, checkPermission('manage_roles'), async (req, res) => {
  try {
    const { displayName, permissions } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'ไม่พบ Role นี้' });
    }

    if (displayName) role.displayName = displayName;
    if (permissions !== undefined) {
      if (role.name === 'admin' && (!permissions.includes('manage_roles') || !permissions.includes('manage_users'))) {
        return res.status(400).json({ message: 'ไม่สามารถถอดสิทธิ์ manage_roles/manage_users ออกจาก Role admin ได้ เพราะจะทำให้ไม่มีใครเข้าหน้าจัดการผู้ใช้/Role ได้อีก' });
      }
      role.permissions = permissions;
    }

    await role.save();
    res.json(role);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/roles/:id
router.delete('/:id', auth, checkPermission('manage_roles'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'ไม่พบ Role นี้' });
    }

    if (['admin', 'member'].includes(role.name)) {
      return res.status(400).json({ message: 'ไม่สามารถลบ Role พื้นฐานของระบบนี้ได้' });
    }

    const usersWithRole = await User.countDocuments({ role: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        message: `ไม่สามารถลบ Role นี้ได้ เนื่องจากมีผู้ใช้งาน ${usersWithRole} คนที่ใช้ Role นี้อยู่`,
      });
    }

    await role.deleteOne();
    res.json({ message: 'ลบ Role เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
