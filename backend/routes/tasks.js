const express = require('express');
const router = express.Router();
const TaskMaster = require('../models/TaskMaster');
const auth = require('../middleware/auth');
const { moduleAccess, canAccessDoc } = require('../middleware/moduleAccess');
const { logAudit } = require('../utils/audit');

const POPULATE = [
  { path: 'mainAssignee', select: 'name email department' },
  { path: 'coAssignees', select: 'name email department' },
  { path: 'reviewers', select: 'name email department' },
  { path: 'createdBy', select: 'name email' },
];

// หัวหน้า/เลขาฝ่ายธุรการและงานประเมิน ดูงานได้ทุกฝ่ายเหมือนประธาน (เพื่องานติดตาม/ประเมินผลรวมทั้งโครงการ)
// สิทธิ์ create/edit/delete ยังจำกัดเฉพาะฝ่ายตัวเองตามปกติ — ขยายแค่สิทธิ์ "ดู" เท่านั้น
const ADMIN_DEPARTMENT = 'ฝ่ายธุรการและงานประเมิน';
const canViewAllTasks = (req) => {
  const role = req.user.role?.name;
  if (role === 'admin' || ['president', 'vice_president'].includes(role)) return true;
  if (['head', 'secretary'].includes(role) && req.user.department === ADMIN_DEPARTMENT) return true;
  return false;
};
const taskViewFilter = (req) => (canViewAllTasks(req) ? {} : { department: req.user.department });

// GET /api/tasks
router.get('/', auth, moduleAccess('view'), async (req, res) => {
  try {
    const tasks = await TaskMaster.find(taskViewFilter(req))
      .populate(POPULATE)
      .sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, moduleAccess('view'), async (req, res) => {
  try {
    const task = await TaskMaster.findById(req.params.id).populate(POPULATE);
    if (!task) return res.status(404).json({ message: 'ไม่พบงานนี้' });
    if (!canViewAllTasks(req) && !canAccessDoc(req, task, { action: 'view' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ดูงานนี้' });
    }
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// POST /api/tasks
router.post('/', auth, moduleAccess('create'), async (req, res) => {
  try {
    const { title, description, department, mainAssignee, coAssignees, reviewers, startDate, deadline, status, priority } = req.body;

    if (!title || !department || !mainAssignee || !deadline) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const role = req.user.role?.name;
    if (role !== 'admin' && !['president', 'vice_president'].includes(role) && department !== req.user.department) {
      return res.status(403).json({ message: 'คุณสามารถสร้างงานได้เฉพาะในฝ่ายของตัวเองเท่านั้น' });
    }

    const task = new TaskMaster({
      title,
      description,
      department,
      mainAssignee,
      coAssignees: coAssignees || [],
      reviewers: reviewers || [],
      startDate: startDate || null,
      deadline,
      status,
      priority,
      createdBy: req.user._id,
    });

    await task.save();
    await task.populate(POPULATE);

    await logAudit({ req, module: 'TASK_MASTER', action: 'create', entityId: task._id, department: task.department, summary: `สร้างงาน: ${task.title}` });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', auth, moduleAccess('edit'), async (req, res) => {
  try {
    const task = await TaskMaster.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'ไม่พบงานนี้' });
    if (!canAccessDoc(req, task, { action: 'edit' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขงานนี้' });
    }

    const { title, description, mainAssignee, coAssignees, reviewers, startDate, deadline, status, priority } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (mainAssignee) task.mainAssignee = mainAssignee;
    if (coAssignees !== undefined) task.coAssignees = coAssignees;
    if (reviewers !== undefined) task.reviewers = reviewers;
    if (startDate !== undefined) task.startDate = startDate || null;
    if (deadline) task.deadline = deadline;
    if (status) task.status = status;
    if (priority) task.priority = priority;

    await task.save();
    await task.populate(POPULATE);

    await logAudit({ req, module: 'TASK_MASTER', action: 'update', entityId: task._id, department: task.department, summary: `แก้ไขงาน: ${task.title}` });

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, moduleAccess('delete'), async (req, res) => {
  try {
    const task = await TaskMaster.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'ไม่พบงานนี้' });
    if (!canAccessDoc(req, task, { action: 'delete' })) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบงานนี้' });
    }

    await task.deleteOne();

    await logAudit({ req, module: 'TASK_MASTER', action: 'delete', entityId: task._id, department: task.department, summary: `ลบงาน: ${task.title}` });

    res.json({ message: 'ลบงานเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

module.exports = router;
