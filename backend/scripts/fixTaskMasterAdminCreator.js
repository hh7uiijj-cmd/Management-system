require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const TaskMaster = require('../models/TaskMaster');

// แก้ไข "ผู้มอบหมาย" (createdBy) ของงาน Task Master ฝ่ายธุรการฯ ที่นำเข้าไปก่อนหน้านี้
// จากเดิมที่ตั้งเป็นบัญชีแอดมิน ให้เปลี่ยนเป็นชาคริต (020) ตามที่ควรจะเป็น รันซ้ำได้ปลอดภัย
const DEPARTMENT = 'ฝ่ายธุรการและงานประเมิน';
const CHAKRIT_EMAIL = 'u671101155320@mail.dusit.ac.th';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ email: 'DaoCha@gmail.com' });
  const chakrit = await User.findOne({ email: CHAKRIT_EMAIL });
  if (!admin) throw new Error('ไม่พบบัญชีแอดมิน (DaoCha@gmail.com)');
  if (!chakrit) throw new Error('ไม่พบผู้ใช้ชาคริต (020)');

  const result = await TaskMaster.updateMany(
    { department: DEPARTMENT, createdBy: admin._id },
    { $set: { createdBy: chakrit._id } }
  );

  console.log(`เสร็จสิ้น — แก้ไขผู้มอบหมายเป็นชาคริต ${result.modifiedCount} รายการ`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Fix task master creator error:', err);
  process.exit(1);
});
