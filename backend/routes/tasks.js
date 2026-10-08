const express = require('express');
const router = express.Router();
const TaskMaster = require('../models/TaskMaster');
const auth = require('../middleware/auth');
const { moduleAccess } = require('../middleware/moduleAccess');
const { logAudit } = require('../utils/audit');
const { TASK_STATUSES } = require('../config/constants');

const POPULATE = [
  { path: 'mainAssignee', select: 'name email department member', populate: { path: 'member', select: 'nickname' } },
  { path: 'coAssignees', select: 'name email department member', populate: { path: 'member', select: 'nickname' } },
  { path: 'reviewers', select: 'name email department member', populate: { path: 'member', select: 'nickname' } },
  { path: 'createdBy', select: 'name email department member', populate: { path: 'member', select: 'nickname' } },
  { path: 'submissions.submittedBy', select: 'name email department member', populate: { path: 'member', select: 'nickname' } },
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
// ผู้ที่ถูกมอบหมายเป็นผู้รับผิดชอบหลัก/ร่วม/ผู้อนุมัติ ต้องเห็นและจัดการงานนั้นได้เสมอ
// แม้งานจะอยู่คนละฝ่ายกับตัวเอง (เพราะตอนนี้เลือกผู้ร่วมงาน/ผู้อนุมัติข้ามฝ่ายได้แล้ว)
const idStr = (v) => String(v?._id || v);
const isAssignedToTask = (req, task) => {
  const uid = String(req.user._id);
  return (
    idStr(task.mainAssignee) === uid ||
    task.coAssignees.some((id) => idStr(id) === uid) ||
    task.reviewers.some((id) => idStr(id) === uid)
  );
};

const taskViewFilter = (req) =>
  canViewAllTasks(req)
    ? {}
    : { $or: [{ department: req.user.department }, { mainAssignee: req.user._id }, { coAssignees: req.user._id }, { reviewers: req.user._id }] };

const canViewTask = (req, task) => canViewAllTasks(req) || task.department === req.user.department || isAssignedToTask(req, task);

const canEditTask = (req, task) => {
  const role = req.user.role?.name;
  if (role === 'admin' || ['president', 'vice_president'].includes(role)) return true;
  if (['head', 'secretary'].includes(role) && task.department === req.user.department) return true;
  if (String(task.createdBy) === String(req.user._id)) return true;
  return isAssignedToTask(req, task);
};

const canDeleteTask = (req, task) => {
  const role = req.user.role?.name;
  if (role === 'admin' || ['president', 'vice_president'].includes(role)) return true;
  if (['head', 'secretary'].includes(role) && task.department === req.user.department) return true;
  return String(task.createdBy) === String(req.user._id);
};

// ตรวจจับงานที่เลยกำหนดส่งแล้วแต่ยังไม่ถูกตีสถานะ "ล่าช้า" — เช็คทุกครั้งที่มีการดึงรายการงาน (lazy, ไม่ต้องมี cron job แยก)
// deadline ถูกเก็บเป็นเที่ยงคืน UTC ของวันนั้น ดังนั้นยังไม่ถือว่าล่าช้าจนกว่าจะข้ามวันถัดไป (เช่น กำหนดส่งวันที่ 13 ยังไม่ล่าช้าจนกว่าจะถึงวันที่ 14)
const startOfTodayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
const autoMarkOverdue = async (filter = {}) => {
  await TaskMaster.updateMany(
    { ...filter, deadline: { $lt: startOfTodayUTC() }, status: { $nin: ['เสร็จสิ้น', 'ยกเลิก', 'ล่าช้า'] } },
    { $set: { status: 'ล่าช้า' } }
  );
};

// GET /api/tasks
router.get('/', auth, moduleAccess('view'), async (req, res) => {
  try {
    await autoMarkOverdue();
    const tasks = await TaskMaster.find(taskViewFilter(req))
      .populate(POPULATE)
      .sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/tasks/recent-completed — งานที่เสร็จล่าสุด ให้ทุกฝ่ายเห็นได้ (ไม่กรองตามฝ่าย) สำหรับ Dashboard
router.get('/recent-completed', auth, async (req, res) => {
  try {
    const tasks = await TaskMaster.find({ status: 'เสร็จสิ้น' })
      .populate(POPULATE)
      .sort({ updatedAt: -1 })
      .limit(8);
    res.json(tasks);
  } catch (error) {
    console.error('Get recent completed tasks error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, moduleAccess('view'), async (req, res) => {
  try {
    await autoMarkOverdue({ _id: req.params.id });
    const task = await TaskMaster.findById(req.params.id).populate(POPULATE);
    if (!task) return res.status(404).json({ message: 'ไม่พบงานนี้' });
    if (!canViewTask(req, task)) {
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
    if (!canEditTask(req, task)) {
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

// PUT /api/tasks/:id/submit — ผู้รับผิดชอบหลัก/ร่วมแต่ละคนส่งงานของตัวเองแยกกัน (ไม่ทับกัน) แล้วเปลี่ยนสถานะเป็น "รอตรวจสอบ" ให้ผู้อนุมัติ
router.put('/:id/submit', auth, async (req, res) => {
  try {
    const { submissionLink, submissionText } = req.body;
    if (!submissionLink?.trim() && !submissionText?.trim()) {
      return res.status(400).json({ message: 'กรุณาใส่ลิงก์หรือข้อความอย่างน้อย 1 อย่าง' });
    }

    const task = await TaskMaster.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'ไม่พบงานนี้' });

    const role = req.user.role?.name;
    const isTopTier = role === 'admin' || ['president', 'vice_president'].includes(role);
    const isDeptLead = ['head', 'secretary'].includes(role) && task.department === req.user.department;
    if (!isTopTier && !isDeptLead && !isAssignedToTask(req, task)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ส่งงานนี้' });
    }

    // ถ้าเคยส่งไปแล้ว การส่งซ้ำจะแก้ไขทับเฉพาะรายการของตัวเอง ไม่ไปทับของคนอื่น
    const uid = String(req.user._id);
    task.submissions = (task.submissions || []).filter((s) => String(s.submittedBy) !== uid);
    task.submissions.push({
      link: submissionLink || '',
      text: submissionText || '',
      submittedBy: req.user._id,
      submittedAt: new Date(),
    });
    task.status = 'รอตรวจสอบ';
    // ส่งงานใหม่แล้ว ถือว่าข้อที่เคยถูกตีกลับได้รับการแก้ไขแล้ว เคลียร์หมายเหตุเก่าทิ้ง
    task.rejectionReason = '';
    task.rejectedAt = null;
    await task.save();
    await task.populate(POPULATE);

    await logAudit({ req, module: 'TASK_MASTER', action: 'submit', entityId: task._id, department: task.department, summary: `ส่งงาน: ${task.title}` });

    res.json(task);
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// PUT /api/tasks/:id/approve — ผู้อนุมัติ (reviewers) หรือ admin/ประธาน/รองประธาน/หัวหน้า-เลขาฝ่ายเจ้าของงาน กดอนุมัติเพื่ออัปเดตสถานะ
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!status || !TASK_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    const task = await TaskMaster.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'ไม่พบงานนี้' });

    const role = req.user.role?.name;
    const isTopTier = role === 'admin' || ['president', 'vice_president'].includes(role);
    const isDeptLead = ['head', 'secretary'].includes(role) && task.department === req.user.department;
    const isReviewer = task.reviewers.some((r) => String(r) === String(req.user._id));
    if (!isTopTier && !isDeptLead && !isReviewer) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์อนุมัติงานนี้' });
    }

    // ป้องกันอนุมัติงาน "เสร็จสิ้น" ทั้งที่ยังไม่มีการส่งงานจริง (เช่น สถานะถูกตั้งเป็น "รอตรวจสอบ" ทางอื่นโดยไม่ได้กดส่งงาน)
    if (status === 'เสร็จสิ้น' && !(task.submissions || []).length) {
      return res.status(400).json({ message: 'ยังไม่มีการส่งงานสำหรับงานนี้ ไม่สามารถอนุมัติเป็น "เสร็จสิ้น" ได้' });
    }

    // ตีกลับงานที่กำลังรอตรวจสอบ ต้องระบุเหตุผล ไม่ให้ตีกลับลอยๆ โดยผู้รับผิดชอบไม่รู้ว่าต้องแก้อะไร
    if (task.status === 'รอตรวจสอบ' && status !== 'เสร็จสิ้น' && !rejectionReason?.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุเหตุผล/สิ่งที่ต้องแก้ไข ก่อนตีกลับงาน' });
    }

    task.status = status;
    // ตีกลับแก้ไข: บันทึกเหตุผลไว้ให้ผู้รับผิดชอบเห็นว่าต้องแก้อะไร / อนุมัติผ่าน: เคลียร์หมายเหตุเก่าทิ้ง
    if (rejectionReason !== undefined) {
      task.rejectionReason = rejectionReason;
      task.rejectedAt = rejectionReason.trim() ? new Date() : null;
    } else if (status === 'เสร็จสิ้น') {
      task.rejectionReason = '';
      task.rejectedAt = null;
    }
    await task.save();
    await task.populate(POPULATE);

    await logAudit({ req, module: 'TASK_MASTER', action: 'approve', entityId: task._id, department: task.department, summary: `อนุมัติงาน "${task.title}" เป็นสถานะ ${status}` });

    res.json(task);
  } catch (error) {
    console.error('Approve task error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, moduleAccess('delete'), async (req, res) => {
  try {
    const task = await TaskMaster.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'ไม่พบงานนี้' });
    if (!canDeleteTask(req, task)) {
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
