require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('../models/User');
require('../models/Member');
const TaskMaster = require('../models/TaskMaster');

// ส่งออกข้อมูล Task Master ปัจจุบันของฝ่ายธุรการและงานประเมินเป็นไฟล์ JSON
// ใช้ตอนต้องการเทียบข้อมูลปัจจุบัน (ที่มีการแก้ไข/เพิ่มเติมไปแล้วในเว็บ) กับแผนต้นฉบับ
// ไม่แก้ไขข้อมูลใดๆ ในฐานข้อมูล อ่านอย่างเดียว ปลอดภัย รันซ้ำได้
const DEPARTMENT = 'ฝ่ายธุรการและงานประเมิน';

const POPULATE = [
  { path: 'mainAssignee', select: 'name email member', populate: { path: 'member', select: 'nickname' } },
  { path: 'coAssignees', select: 'name email member', populate: { path: 'member', select: 'nickname' } },
  { path: 'reviewers', select: 'name email member', populate: { path: 'member', select: 'nickname' } },
  { path: 'createdBy', select: 'name email member', populate: { path: 'member', select: 'nickname' } },
];

const nameOf = (u) => {
  if (!u) return '';
  const nickname = u.member?.nickname;
  const code = /(\d{3})@/.exec(u.email || '')?.[1];
  if (nickname) return code ? `${nickname} (${code})` : nickname;
  return u.name || '';
};

const dateOf = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const tasks = await TaskMaster.find({ department: DEPARTMENT }).populate(POPULATE).sort({ deadline: 1 });

  const rows = tasks.map((t) => ({
    title: t.title,
    description: t.description || '',
    mainAssignee: nameOf(t.mainAssignee),
    coAssignees: (t.coAssignees || []).map(nameOf),
    reviewers: (t.reviewers || []).map(nameOf),
    startDate: dateOf(t.startDate),
    deadline: dateOf(t.deadline),
    status: t.status,
    priority: t.priority,
    createdBy: nameOf(t.createdBy),
    submissionsCount: (t.submissions || []).length,
  }));

  const outPath = path.join(__dirname, `taskmaster-admin-export-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8');

  console.log(`เสร็จสิ้น — ส่งออก ${rows.length} รายการ`);
  console.log(`ไฟล์: ${outPath}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Export task master admin error:', err);
  process.exit(1);
});
