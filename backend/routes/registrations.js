const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// POST /api/registrations - register for event
router.post('/', auth, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'กรุณาระบุกิจกรรมที่ต้องการลงทะเบียน' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมนี้' });
    }

    if (event.status !== 'active') {
      return res.status(400).json({ message: 'กิจกรรมนี้ไม่เปิดรับสมัครแล้ว' });
    }

    const existingRegistration = await Registration.findOne({
      event: eventId,
      user: req.user._id,
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'คุณได้ลงทะเบียนกิจกรรมนี้แล้ว' });
    }

    if (event.maxParticipants != null) {
      const approvedCount = await Registration.countDocuments({
        event: eventId,
        status: 'approved',
      });
      if (approvedCount >= event.maxParticipants) {
        return res.status(400).json({ message: 'กิจกรรมนี้เต็มแล้ว' });
      }
    }

    const registration = new Registration({
      event: eventId,
      user: req.user._id,
      status: 'pending',
    });

    await registration.save();
    await registration.populate([
      { path: 'event', select: 'title date location' },
      { path: 'user', select: 'name email' },
    ]);

    res.status(201).json(registration);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'คุณได้ลงทะเบียนกิจกรรมนี้แล้ว' });
    }
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/registrations/my - my registrations
router.get('/my', auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ user: req.user._id })
      .populate('event', 'title date location status')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/registrations/event/:eventId - list registrations for event
router.get(
  '/event/:eventId',
  auth,
  checkPermission('approve_registrations'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: 'ไม่พบกิจกรรมนี้' });
      }

      const registrations = await Registration.find({ event: req.params.eventId })
        .populate('user', 'name email')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 });

      res.json(registrations);
    } catch (error) {
      console.error('Get event registrations error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
    }
  }
);

// GET /api/registrations/event/:eventId/export - export CSV
router.get(
  '/event/:eventId/export',
  auth,
  checkPermission('export_csv'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: 'ไม่พบกิจกรรมนี้' });
      }

      const registrations = await Registration.find({ event: req.params.eventId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

      const statusMap = {
        pending: 'รอการอนุมัติ',
        approved: 'อนุมัติแล้ว',
        rejected: 'ถูกปฏิเสธ',
      };

      const headers = 'ชื่อ,อีเมล,วันที่ลงทะเบียน,สถานะ';
      const rows = registrations.map((reg) => {
        const name = `"${(reg.user?.name || '').replace(/"/g, '""')}"`;
        const email = `"${(reg.user?.email || '').replace(/"/g, '""')}"`;
        const date = reg.createdAt
          ? new Date(reg.createdAt).toLocaleDateString('th-TH')
          : '';
        const status = statusMap[reg.status] || reg.status;
        return `${name},${email},${date},${status}`;
      });

      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="participants_${req.params.eventId}.csv"`
      );
      res.send('﻿' + csv);
    } catch (error) {
      console.error('Export CSV error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
    }
  }
);

// GET /api/registrations/pending - all pending registrations (for approval page)
router.get(
  '/pending',
  auth,
  checkPermission('approve_registrations'),
  async (req, res) => {
    try {
      const registrations = await Registration.find({ status: 'pending' })
        .populate('user', 'name email')
        .populate('event', 'title date location')
        .sort({ createdAt: -1 });

      res.json(registrations);
    } catch (error) {
      console.error('Get pending registrations error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
    }
  }
);

// PUT /api/registrations/:id/approve - approve registration
router.put(
  '/:id/approve',
  auth,
  checkPermission('approve_registrations'),
  async (req, res) => {
    try {
      const registration = await Registration.findById(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: 'ไม่พบการลงทะเบียนนี้' });
      }

      registration.status = 'approved';
      registration.approvedBy = req.user._id;
      registration.approvedAt = new Date();

      await registration.save();
      await registration.populate([
        { path: 'user', select: 'name email' },
        { path: 'event', select: 'title date location' },
        { path: 'approvedBy', select: 'name' },
      ]);

      res.json(registration);
    } catch (error) {
      console.error('Approve registration error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
    }
  }
);

// PUT /api/registrations/:id/reject - reject registration
router.put(
  '/:id/reject',
  auth,
  checkPermission('approve_registrations'),
  async (req, res) => {
    try {
      const { note } = req.body;
      const registration = await Registration.findById(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: 'ไม่พบการลงทะเบียนนี้' });
      }

      registration.status = 'rejected';
      registration.approvedBy = req.user._id;
      registration.approvedAt = new Date();
      if (note) registration.note = note;

      await registration.save();
      await registration.populate([
        { path: 'user', select: 'name email' },
        { path: 'event', select: 'title date location' },
        { path: 'approvedBy', select: 'name' },
      ]);

      res.json(registration);
    } catch (error) {
      console.error('Reject registration error:', error);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
    }
  }
);

module.exports = router;
