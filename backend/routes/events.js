const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// GET /api/events - list all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const approvedCount = await Registration.countDocuments({
          event: event._id,
          status: 'approved',
        });
        return {
          ...event.toObject(),
          approvedCount,
          availableSpots:
            event.maxParticipants != null
              ? event.maxParticipants - approvedCount
              : null,
        };
      })
    );

    res.json(eventsWithCount);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// POST /api/events - create event
router.post('/', auth, checkPermission('manage_events'), async (req, res) => {
  try {
    const { title, description, date, location, maxParticipants, status } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อและวันที่กิจกรรม' });
    }

    const event = new Event({
      title,
      description,
      date,
      location,
      maxParticipants,
      status: status || 'active',
      createdBy: req.user._id,
    });

    await event.save();
    await event.populate('createdBy', 'name email');

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/events/:id - event detail
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมนี้' });
    }

    const approvedCount = await Registration.countDocuments({
      event: event._id,
      status: 'approved',
    });

    res.json({
      ...event.toObject(),
      approvedCount,
      availableSpots:
        event.maxParticipants != null
          ? event.maxParticipants - approvedCount
          : null,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/events/:id - update event
router.put('/:id', auth, checkPermission('manage_events'), async (req, res) => {
  try {
    const { title, description, date, location, maxParticipants, status } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมนี้' });
    }

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (date) event.date = date;
    if (location !== undefined) event.location = location;
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
    if (status) event.status = status;

    await event.save();
    await event.populate('createdBy', 'name email');

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/events/:id - delete event
router.delete('/:id', auth, checkPermission('manage_events'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมนี้' });
    }

    await Registration.deleteMany({ event: event._id });
    await event.deleteOne();

    res.json({ message: 'ลบกิจกรรมเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
