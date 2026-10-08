require('dotenv').config();
const mongoose = require('mongoose');
const TaskMaster = require('../models/TaskMaster');

// กู้คืนข้อมูล "งานที่ส่ง" ของงานเก่า ที่ยังเก็บอยู่ในฟิลด์แบบเดิม (submissionLink/submissionText/submittedBy/submittedAt)
// ก่อนที่ระบบจะเปลี่ยนไปใช้ submissions[] (ส่งได้หลายคนแยกกัน) — ข้อมูลเดิมไม่ได้หาย แค่ scheme ใหม่ไม่ได้อ่านฟิลด์เก่าแล้ว
// สคริปต์นี้จะย้ายข้อมูลจากฟิลด์เก่าเข้า submissions[] แล้วลบฟิลด์เก่าทิ้ง รันซ้ำได้ปลอดภัย (ข้ามรายการที่ย้ายไปแล้ว)
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ใช้ raw collection เพราะ schema ปัจจุบันไม่มีฟิลด์เก่าแล้ว ต้องอ่านข้าม schema
  const coll = TaskMaster.collection;
  const cursor = coll.find({
    $or: [
      { submissionLink: { $exists: true } },
      { submissionText: { $exists: true } },
      { submittedBy: { $exists: true } },
    ],
  });

  let migrated = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    const hasContent = (doc.submissionLink && doc.submissionLink.trim()) || (doc.submissionText && doc.submissionText.trim());
    if (!hasContent || !doc.submittedBy) {
      // ไม่มีเนื้อหาจริง แค่ลบฟิลด์เก่าทิ้งเฉยๆ
      await coll.updateOne({ _id: doc._id }, { $unset: { submissionLink: '', submissionText: '', submittedBy: '', submittedAt: '' } });
      skipped += 1;
      continue;
    }

    const entry = {
      link: doc.submissionLink || '',
      text: doc.submissionText || '',
      submittedBy: doc.submittedBy,
      submittedAt: doc.submittedAt || doc.updatedAt || new Date(),
    };

    await coll.updateOne(
      { _id: doc._id },
      {
        $push: { submissions: entry },
        $unset: { submissionLink: '', submissionText: '', submittedBy: '', submittedAt: '' },
      }
    );
    migrated += 1;
    console.log(`+ กู้คืนงานที่ส่ง: ${doc.title}`);
  }

  console.log(`เสร็จสิ้น — กู้คืนข้อมูลงานที่ส่ง ${migrated} รายการ, ข้าม (ไม่มีเนื้อหา) ${skipped} รายการ`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migrate task submissions error:', err);
  process.exit(1);
});
