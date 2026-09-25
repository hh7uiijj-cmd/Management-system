require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MasterTaskItem = require('../models/MasterTaskItem');

// เติมข้อมูล Master Task List ให้ฝ่ายธุรการและงานประเมิน (ลบของเดิมในฝ่ายนี้ก่อน แล้วใส่ใหม่ทั้งหมด — รันซ้ำได้ปลอดภัย)
const DEPARTMENT = 'ฝ่ายธุรการและงานประเมิน';

const NICK_EMAIL = {
  ชาคริต: 'u6711011553020@mail.dusit.ac.th',
  ครีม: 'u6711011553092@mail.dusit.ac.th',
  บีบี: 'u6711011553006@mail.dusit.ac.th',
  ลูกแก้ว: 'u6711011553031@mail.dusit.ac.th',
  ออยล์: 'u6711011553061@mail.dusit.ac.th',
  เต๋า: 'u6711011553034@mail.dusit.ac.th',
  เฟิน: 'u6711011553105@mail.dusit.ac.th',
  พริม: 'u6711011553066@mail.dusit.ac.th',
};

// [no, task, ผู้รับผิดชอบ(Owner), ผู้สนับสนุน(Support/Reviewer) หรือ 'ALL_DEPT']
const ROWS = [
  [1, 'จัดทำและควบคุมเอกสารโครงการ', ['ชาคริต', 'ครีม'], []],
  [2, 'หนังสือเชิญประธาน', ['บีบี'], []],
  [3, 'หนังสือเชิญคณาจารย์/บุคลากร/แขก', ['บีบี'], []],
  [4, 'หนังสือขอใช้สถานที่', ['บีบี'], []],
  [5, 'หนังสือขอใช้อุปกรณ์', ['ลูกแก้ว'], []],
  [6, 'เอกสารขออนุญาตอื่น ๆ', ['บีบี', 'ลูกแก้ว'], []],
  [7, 'จัดรูปแบบ/พิมพ์เอกสารพิธีการ', [], ['ลูกแก้ว']],
  [8, 'เอกสารขอ Sponsor', [], ['ลูกแก้ว', 'บีบี']],
  [9, 'หนังสือขอบคุณ Sponsor / เอกสาร Sponsor ที่เกี่ยวข้อง', [], ['ลูกแก้ว', 'บีบี']],
  [10, 'จัดพิมพ์/จัดชุดเอกสาร', ['ออยล์'], []],
  [11, 'ติดตามเอกสารระหว่างฝ่าย', ['ออยล์'], []],
  [12, 'รวบรวม Final Document ทุกฝ่าย', ['ออยล์', 'ครีม'], []],
  [13, 'จัดเก็บ/ควบคุม Version เอกสาร', ['ชาคริต', 'ครีม'], []],
  [14, 'สนับสนุนงานเกียรติบัตรด้านรายชื่อ/เอกสาร', [], ['ครีม', 'บีบี']],
  [15, 'ออกแบบระบบการประเมิน', ['เต๋า'], []],
  [16, 'จัดทำแบบประเมิน', ['เต๋า'], []],
  [17, 'เตรียม QR/ระบบเก็บแบบประเมินและช่องทางสำรอง', ['เต๋า'], []],
  [18, 'เก็บ/ติดตาม Response ในวันงาน', ['เต๋า'], []],
  [19, 'ตรวจและจัดข้อมูลประเมิน', ['เต๋า'], ['ออยล์']],
  [20, 'วิเคราะห์ผลการประเมิน', ['เต๋า'], ['พริม', 'ออยล์']],
  [21, 'สรุปผลเทียบตัวชี้วัดโครงการ', ['เต๋า'], []],
  [22, 'สรุปข้อเสนอแนะผู้เข้าร่วม', ['เต๋า'], []],
  [23, 'รวบรวมปัญหา/อุปสรรคจากทุกฝ่าย', ['ออยล์'], []],
  [24, 'รวบรวมวิธีแก้ไข/บทเรียนจากทุกฝ่าย', ['ออยล์'], []],
  [25, 'รวบรวมหลักฐานเพื่อทำเล่ม', ['ครีม', 'ออยล์'], []],
  [26, 'จัดทำรูปเล่มสรุปโครงการ (Support: ทุกคนในฝ่าย)', ['เฟิน'], 'ALL_DEPT'],
  [27, 'ตรวจความครบถ้วนของเล่ม (Reviewer: ชาคริต)', ['ครีม'], ['ชาคริต']],
  [28, 'จัดทำ Final PDF/ฉบับส่ง', ['ครีม', 'ลูกแก้ว'], []],
  [29, 'จัดเก็บเอกสารโครงการฉบับสมบูรณ์ (Reviewer: ชาคริต)', ['ครีม'], ['ชาคริต']],
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const userByNick = {};
  for (const [nick, email] of Object.entries(NICK_EMAIL)) {
    const u = await User.findOne({ email });
    if (!u) console.warn(`⚠ ไม่พบผู้ใช้สำหรับ "${nick}" (${email}) — ต้อง seed ผู้ใช้ก่อน`);
    userByNick[nick] = u;
  }

  const deptUsers = await User.find({ department: DEPARTMENT });
  const deptUserIds = deptUsers.map((u) => u._id);

  const admin = await User.findOne({ email: 'DaoCha@gmail.com' });
  if (!admin) throw new Error('ไม่พบบัญชีแอดมิน (DaoCha@gmail.com)');

  await MasterTaskItem.deleteMany({ department: DEPARTMENT });

  for (const [no, task, owners, supporters] of ROWS) {
    const responsible = owners.map((n) => userByNick[n]?._id).filter(Boolean);
    const supporterIds = supporters === 'ALL_DEPT'
      ? deptUserIds
      : supporters.map((n) => userByNick[n]?._id).filter(Boolean);

    await MasterTaskItem.create({
      department: DEPARTMENT,
      no,
      task,
      responsible,
      supporters: supporterIds,
      createdBy: admin._id,
    });
  }

  console.log(`เพิ่มรายการ Master Task List ฝ่ายธุรการและงานประเมินแล้ว ${ROWS.length} รายการ`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed master task list error:', err);
  process.exit(1);
});
