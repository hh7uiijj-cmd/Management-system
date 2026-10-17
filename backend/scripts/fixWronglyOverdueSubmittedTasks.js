require('dotenv').config();
const mongoose = require('mongoose');
const TaskMaster = require('../models/TaskMaster');

// แก้ไขงานที่ถูกตีสถานะเป็น "ล่าช้า" ทับ "รอตรวจสอบ" ไปอย่างผิดพลาด
// บั๊ก: autoMarkOverdue() เดิมไม่ได้ยกเว้นสถานะ "รอตรวจสอบ" ทำให้งานที่ส่งไปแล้วและกำลังรอผู้อนุมัติ
// ถ้าเลยกำหนดส่งไปก่อนมีคนอนุมัติ จะถูกเปลี่ยนสถานะเป็น "ล่าช้า" เงียบๆ ปุ่มอนุมัติเลยหายไป
// แก้เฉพาะงานที่: สถานะปัจจุบันเป็น "ล่าช้า" + มีการส่งงานแล้ว (submissions ไม่ว่าง) + ไม่มีเหตุผลตีกลับค้างอยู่
// (ถ้ามี rejectionReason แปลว่าเคยถูกตีกลับจริงแล้วยังไม่ส่งใหม่ ถือว่า "ล่าช้า" ถูกต้องอยู่แล้ว ไม่แตะ)
// รันซ้ำได้ปลอดภัย (หลังแก้แล้วจะไม่มีรายการให้แก้อีก)
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const affected = await TaskMaster.find({
    status: 'ล่าช้า',
    'submissions.0': { $exists: true },
    $or: [{ rejectionReason: { $exists: false } }, { rejectionReason: '' }],
  });

  if (!affected.length) {
    console.log('ไม่พบงานที่ได้รับผลกระทบจากบั๊กนี้');
  } else {
    for (const task of affected) {
      task.status = 'รอตรวจสอบ';
      await task.save();
      console.log(`+ คืนสถานะเป็น "รอตรวจสอบ": ${task.title}`);
    }
    console.log(`เสร็จสิ้น — แก้ไข ${affected.length} รายการ`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fix wrongly overdue submitted tasks error:', err);
  process.exit(1);
});
