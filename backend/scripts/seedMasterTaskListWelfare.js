require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MasterTaskItem = require('../models/MasterTaskItem');

// เติมข้อมูล Master Task List ให้ฝ่ายสวัสดิการและงานบริการ (ลบของเดิมในฝ่ายนี้ก่อน แล้วใส่ใหม่ทั้งหมด — รันซ้ำได้ปลอดภัย)
const DEPARTMENT = 'ฝ่ายสวัสดิการและงานบริการ';

const emailOf = (code) => `u6711011553${code}@mail.dusit.ac.th`;

// [no, task, รหัสผู้รับผิดชอบ (Owner)]
const ROWS = [
  [1, 'จัดหาและจัดเตรียมของเบรก', ['008', '023', '033', '070']],
  [2, 'จัดซื้อของเพิ่มเติมระหว่างงาน', ['025', '027']],
  [3, 'ดูแลและจัดเตรียมกล่องจับรางวัล', ['032']],
  [4, 'จัดหาของรางวัลให้ผู้เข้าแข่งขัน ผู้โชคดี และรางวัลการแต่งกาย', ['038', '084', '087']],
  [5, 'จัดทำแบบฟอร์มสำหรับผู้แพ้อาหาร', ['039']],
  [6, 'ติดต่อและประสานงานกับสปอนเซอร์', ['041', '052']],
  [7, 'เชิญรางวัล', ['043']],
  [8, 'จัดหาโล่หรือถ้วยรางวัลสำหรับผู้เข้าแข่งขัน', ['045', '101']],
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ email: 'DaoCha@gmail.com' });
  if (!admin) throw new Error('ไม่พบบัญชีแอดมิน (DaoCha@gmail.com)');

  const allCodes = [...new Set(ROWS.flatMap(([, , codes]) => codes))];
  const users = await User.find({ email: { $in: allCodes.map(emailOf) } });
  const userByCode = {};
  for (const code of allCodes) {
    const u = users.find((x) => x.email === emailOf(code));
    if (!u) console.warn(`⚠ ไม่พบผู้ใช้รหัส "${code}" (${emailOf(code)})`);
    userByCode[code] = u;
  }

  await MasterTaskItem.deleteMany({ department: DEPARTMENT });

  for (const [no, task, codes] of ROWS) {
    const responsible = codes.map((c) => userByCode[c]?._id).filter(Boolean);

    await MasterTaskItem.create({
      department: DEPARTMENT,
      no,
      task,
      responsible,
      supporters: [],
      createdBy: admin._id,
    });
  }

  console.log(`เพิ่มรายการ Master Task List ฝ่ายสวัสดิการและงานบริการแล้ว ${ROWS.length} รายการ`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed master task list error:', err);
  process.exit(1);
});
