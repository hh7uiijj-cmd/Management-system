require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MasterTaskItem = require('../models/MasterTaskItem');

// เติมข้อมูล Master Task List ให้ฝ่ายนิทรรศการและสื่อ Infographic (ลบของเดิมในฝ่ายนี้ก่อน แล้วใส่ใหม่ทั้งหมด — รันซ้ำได้ปลอดภัย)
const DEPARTMENT = 'ฝ่ายนิทรรศการและสื่อ Infographic';

const emailOf = (code) => `u6711011553${code}@mail.dusit.ac.th`;

// [no, task, รหัสผู้รับผิดชอบ (Owner)]
const ROWS = [
  [1, 'จัดทำซุ้มนิทรรศการ', ['003', '013', '021', '048', '063', '065', '078', '082', '083', '094']],
  [2, 'จัดทำซุ้มประตู', ['002', '056', '076']],
  [3, 'จัดทำซุ้มสปอนเซอร์', ['069', '075', '093']],
  [4, 'ทำ Infographic', ['028', '060']],
  [5, 'ตั๋ว', ['035']],
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

  console.log(`เพิ่มรายการ Master Task List ฝ่ายนิทรรศการและสื่อ Infographic แล้ว ${ROWS.length} รายการ`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed master task list error:', err);
  process.exit(1);
});
