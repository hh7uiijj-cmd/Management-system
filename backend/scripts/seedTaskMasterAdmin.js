require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const TaskMaster = require('../models/TaskMaster');

// นำเข้า Task Master จากไฟล์ "PROJECT PLAN Ver. 0.2" ของฝ่ายธุรการและงานประเมิน
// ไม่ลบรายการเดิม — เช็คชื่องานซ้ำในฝ่ายเดียวกันก่อน ถ้ามีอยู่แล้วจะข้าม (กันทับงานที่มีคนแก้ไข/ส่งงานไปแล้ว) รันซ้ำได้ปลอดภัย
const DEPARTMENT = 'ฝ่ายธุรการและงานประเมิน';

const emailOf = (code) => `u6711011553${code}@mail.dusit.ac.th`;

const CODE = {
  ชาคริต: '020',
  ครีม: '092',
  บีบี: '006',
  ลูกแก้ว: '031',
  ออยล์: '061',
  เต๋า: '034',
  เฟิน: '105',
  พริม: '066',
};
const ALL_NICKS = Object.keys(CODE);

const MONTH = { 'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };

// yearBE เป็นเลข 2 หลัก (69 = พ.ศ. 2569 = ค.ศ. 2026)
const thDate = (day, monthAbbr, yearBE) => {
  const yearCE = 2500 + yearBE - 543;
  return new Date(Date.UTC(yearCE, MONTH[monthAbbr] - 1, day));
};
const thLabel = (day, monthAbbr, yearBE) => `${day} ${monthAbbr} ${yearBE}`;

// [title, start|null, finishLabel|null, deadline, mainNicks[], supportNicks[]|'ALL', reviewerNick|null]
const ROWS = [
  ['ตั้งระบบโฟลเดอร์ / ชื่อไฟล์ / โครงสร้างเอกสาร', thDate(18, 'ก.ย.', 69), thLabel(22, 'ก.ย.', 69), thDate(24, 'ก.ย.', 69), ['ชาคริต'], ['ครีม'], 'ชาคริต'],
  ['จัดทำ Master Document Checklist', thDate(24, 'ก.ย.', 69), thLabel(30, 'ก.ย.', 69), thDate(3, 'ต.ค.', 69), ['ชาคริต'], ['ครีม'], 'ชาคริต'],
  ['จัดทำ Master Task / Document Tracker', thDate(24, 'ก.ย.', 69), thLabel(30, 'ก.ย.', 69), thDate(3, 'ต.ค.', 69), ['ชาคริต'], ['ครีม'], 'ชาคริต'],
  ['รวบรวมข้อมูลโครงการที่ยืนยันแล้ว', thDate(10, 'ต.ค.', 69), thLabel(27, 'ต.ค.', 69), thDate(31, 'ต.ค.', 69), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['สำรวจรายการหนังสือ / เอกสารที่ต้องดำเนินการ', thDate(5, 'ต.ค.', 69), thLabel(20, 'ต.ค.', 69), thDate(31, 'ต.ค.', 69), ['บีบี'], ['ลูกแก้ว'], 'ชาคริต'],
  ['รับ / รวบรวม Requirement สถานที่และอุปกรณ์จากฝ่ายสถานที่', thDate(10, 'ต.ค.', 69), thLabel(31, 'ต.ค.', 69), thDate(10, 'พ.ย.', 69), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['จัดทำหนังสือขอใช้สถานที่', thDate(6, 'ต.ค.', 69), thLabel(15, 'ต.ค.', 69), thDate(18, 'ต.ค.', 69), ['บีบี'], ['ลูกแก้ว'], 'ชาคริต'],
  ['จัดทำหนังสือขอใช้อุปกรณ์', thDate(5, 'ต.ค.', 69), thLabel(15, 'ต.ค.', 69), thDate(18, 'ต.ค.', 69), ['ลูกแก้ว'], ['บีบี'], 'ชาคริต'],
  ['แก้ไข / ติดตามเอกสารอนุญาต', thDate(19, 'ต.ค.', 69), thLabel(10, 'พ.ย.', 69), thDate(15, 'พ.ย.', 69), ['ออยล์'], ['บีบี', 'ลูกแก้ว'], 'ชาคริต'],
  ['เตรียม Template หนังสือเชิญ', thDate(19, 'ต.ค.', 69), thLabel(28, 'ต.ค.', 69), thDate(31, 'ต.ค.', 69), ['บีบี'], ['ลูกแก้ว'], 'ชาคริต'],
  ['รับรายชื่อ / ตำแหน่งประธาน คณาจารย์ และแขกที่ยืนยัน', thDate(5, 'พ.ย.', 69), thLabel(17, 'พ.ย.', 69), thDate(20, 'พ.ย.', 69), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['สนับสนุนการจัดทำหนังสือเชิญ จากฝ่ายพิธีการ', thDate(9, 'พ.ย.', 69), thLabel(19, 'พ.ย.', 69), thDate(22, 'พ.ย.', 69), ['บีบี'], ['ลูกแก้ว'], 'ชาคริต'],
  ['ติดตามสถานะหนังสือเชิญ', thDate(23, 'พ.ย.', 69), thLabel(15, 'ธ.ค.', 69), thDate(20, 'ธ.ค.', 69), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['สนับสนุนเอกสาร Sponsor ตาม Request ฝ่ายสวัสดิการ', thDate(1, 'ต.ค.', 69), 'ตามแผนฝ่ายสวัสดิการ', thDate(30, 'พ.ย.', 69), ['ลูกแก้ว'], ['บีบี', 'ออยล์'], 'ชาคริต'],
  ['จัดระบบรับ Final Document จากทุกฝ่าย', thDate(1, 'พ.ย.', 69), thLabel(20, 'พ.ย.', 69), thDate(25, 'พ.ย.', 69), ['ชาคริต'], ['ครีม', 'ออยล์'], 'ชาคริต'],
  ['วาง Evaluation Framework (กรอบการประเมินผล)', thDate(20, 'พ.ย.', 69), thLabel(28, 'พ.ย.', 69), thDate(1, 'ธ.ค.', 69), ['เต๋า'], ['ชาคริต'], 'ชาคริต'],
  ['กำหนดตัวชี้วัดและข้อมูลที่ต้องเก็บ', thDate(25, 'พ.ย.', 69), thLabel(7, 'ธ.ค.', 69), thDate(10, 'ธ.ค.', 69), ['เต๋า'], ['ชาคริต'], 'ชาคริต'],
  ['ร่างแบบประเมิน', thDate(25, 'พ.ย.', 69), thLabel(8, 'ธ.ค.', 69), thDate(10, 'ธ.ค.', 69), ['เต๋า'], ['ครีม'], 'ชาคริต'],
  ['ตรวจ / ทดลองแบบประเมิน', thDate(11, 'ธ.ค.', 69), thLabel(12, 'ธ.ค.', 69), thDate(13, 'ธ.ค.', 69), ['เต๋า'], ['ครีม'], 'ชาคริต'],
  ['สร้างแบบประเมิน Final + QR + ช่องทางสำรอง', thDate(14, 'ธ.ค.', 69), thLabel(18, 'ธ.ค.', 69), thDate(20, 'ธ.ค.', 69), ['เต๋า'], ['ครีม'], 'ชาคริต'],
  ['รับ Final Content คำกล่าว / คำปราศรัยจากฝ่ายพิธีการ', thDate(30, 'ธ.ค.', 69), thLabel(5, 'ม.ค.', 70), thDate(7, 'ม.ค.', 70), ['ออยล์'], ['ครีม'], null],
  ['จัดรูปแบบ / ตรวจข้อมูลพื้นฐาน / เตรียมพิมพ์คำกล่าว', null, thLabel(14, 'ม.ค.', 70), thDate(17, 'ม.ค.', 70), ['ลูกแก้ว'], ['บีบี'], 'ชาคริต'],
  ['สนับสนุนฝ่ายสวัสดิการในการจัดทำเกียรติบัตร', thDate(15, 'ม.ค.', 70), thLabel(20, 'ม.ค.', 70), thDate(23, 'ม.ค.', 70), ['ครีม', 'บีบี'], ['ลูกแก้ว'], 'ชาคริต'],
  ['ติดตาม Final Document ทุกฝ่าย รอบ 1', thDate(4, 'ม.ค.', 70), thLabel(9, 'ม.ค.', 70), thDate(10, 'ม.ค.', 70), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['ติดตาม Final Document ทุกฝ่าย รอบสุดท้าย', thDate(11, 'ม.ค.', 70), thLabel(13, 'ม.ค.', 70), thDate(15, 'ม.ค.', 70), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['จัดพิมพ์ / จัดชุดเอกสารที่ใช้วันงาน', thDate(15, 'ม.ค.', 70), thLabel(16, 'ม.ค.', 70), thDate(17, 'ม.ค.', 70), ['ออยล์'], ['ลูกแก้ว', 'บีบี', 'ครีม'], 'ชาคริต'],
  ['ตรวจเอกสารทั้งหมดก่อนงาน', thDate(18, 'ม.ค.', 70), thLabel(21, 'ม.ค.', 70), thDate(22, 'ม.ค.', 70), ['บีบี'], ['ครีม', 'ลูกแก้ว'], 'ชาคริต'],
  ['Final Audit / Go-No-Go Check', thDate(23, 'ม.ค.', 70), thLabel(24, 'ม.ค.', 70), thDate(25, 'ม.ค.', 70), ['ชาคริต'], 'ALL', 'ชาคริต'],
  ['เตรียม QR / Backup / ชุดเอกสารสำรอง', thDate(24, 'ม.ค.', 70), thLabel(25, 'ม.ค.', 70), thDate(25, 'ม.ค.', 70), ['เต๋า'], ['ครีม', 'ลูกแก้ว'], 'ชาคริต'],
  ['ดำเนินงานวันจริง + Document Control + เก็บข้อมูลประเมิน', thDate(26, 'ม.ค.', 70), thLabel(26, 'ม.ค.', 70), thDate(26, 'ม.ค.', 70), ['ชาคริต'], 'ALL', null],
  ['ตรวจและ Backup ข้อมูลหลังงาน', thDate(26, 'ม.ค.', 70), thLabel(26, 'ม.ค.', 70), thDate(26, 'ม.ค.', 70), ['เต๋า'], ['ครีม'], 'ชาคริต'],
  ['รวบรวม Final Evidence / เอกสารจากทุกฝ่าย', thDate(27, 'ม.ค.', 70), thLabel(31, 'ม.ค.', 70), thDate(3, 'ก.พ.', 70), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['Clean ข้อมูลแบบประเมิน', thDate(27, 'ม.ค.', 70), thLabel(29, 'ม.ค.', 70), thDate(2, 'ก.พ.', 70), ['เต๋า'], ['พริม', 'ออยล์'], 'ชาคริต'],
  ['วิเคราะห์ผลประเมิน', thDate(3, 'ก.พ.', 70), thLabel(9, 'ก.พ.', 70), thDate(10, 'ก.พ.', 70), ['เต๋า'], ['พริม', 'ออยล์'], 'ชาคริต'],
  ['เทียบผลกับตัวชี้วัดโครงการ', thDate(10, 'ก.พ.', 70), thLabel(11, 'ก.พ.', 70), thDate(12, 'ก.พ.', 70), ['เต๋า'], ['ครีม'], 'ชาคริต'],
  ['สรุปข้อเสนอแนะผู้เข้าร่วม', thDate(8, 'ก.พ.', 70), thLabel(11, 'ก.พ.', 70), thDate(12, 'ก.พ.', 70), ['เต๋า'], ['ครีม'], 'ชาคริต'],
  ['รวบรวมปัญหา / อุปสรรค / วิธีแก้จากทุกฝ่าย', thDate(2, 'ก.พ.', 70), thLabel(10, 'ก.พ.', 70), thDate(12, 'ก.พ.', 70), ['ออยล์'], ['ครีม'], 'ชาคริต'],
  ['จัดทำรายงานผลการประเมิน', thDate(11, 'ก.พ.', 70), thLabel(16, 'ก.พ.', 70), thDate(17, 'ก.พ.', 70), ['เต๋า'], ['พริม', 'ครีม'], 'ชาคริต'],
  ['รวบรวมเนื้อหาและหลักฐานเข้าเล่ม', thDate(2, 'ก.พ.', 70), thLabel(12, 'ก.พ.', 70), thDate(14, 'ก.พ.', 70), ['ครีม', 'ออยล์'], ['เฟิน', 'ลูกแก้ว'], 'ชาคริต'],
  ['จัดทำ Draft เล่มสรุปโครงการ', thDate(8, 'ก.พ.', 70), thLabel(19, 'ก.พ.', 70), thDate(21, 'ก.พ.', 70), ['เฟิน'], 'ALL', 'ชาคริต'],
  ['ตรวจความครบถ้วน / ตรวจเล่มรอบ 1', thDate(22, 'ก.พ.', 70), thLabel(24, 'ก.พ.', 70), thDate(25, 'ก.พ.', 70), ['ครีม'], ['บีบี', 'เต๋า', 'พริม'], 'ชาคริต'],
  ['แก้ไขเล่มตามผลตรวจ / ข้อเสนอแนะ', thDate(26, 'ก.พ.', 70), thLabel(2, 'มี.ค.', 70), thDate(4, 'มี.ค.', 70), ['เฟิน'], ['ลูกแก้ว', 'บีบี'], 'ชาคริต'],
  ['Final Check เล่ม', thDate(5, 'มี.ค.', 70), thLabel(7, 'มี.ค.', 70), thDate(7, 'มี.ค.', 70), ['ชาคริต'], ['ครีม', 'เฟิน', 'บีบี', 'เต๋า', 'พริม'], null],
  ['Export / จัดส่งเล่มฉบับสมบูรณ์', thDate(8, 'มี.ค.', 70), thLabel(9, 'มี.ค.', 70), thDate(10, 'มี.ค.', 70), ['ครีม', 'ลูกแก้ว'], ['เฟิน'], 'ชาคริต'],
  ['Archive เอกสารโครงการทั้งหมด', thDate(10, 'มี.ค.', 70), thLabel(13, 'มี.ค.', 70), thDate(14, 'มี.ค.', 70), ['ครีม'], ['ชาคริต', 'ลูกแก้ว', 'เฟิน'], 'ชาคริต'],
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const userByNick = {};
  for (const nick of ALL_NICKS) {
    const u = await User.findOne({ email: emailOf(CODE[nick]) });
    if (!u) console.warn(`⚠ ไม่พบผู้ใช้สำหรับ "${nick}" (${emailOf(CODE[nick])})`);
    userByNick[nick] = u;
  }

  const creator = userByNick['ชาคริต'];
  if (!creator) throw new Error('ไม่พบผู้ใช้ "ชาคริต" สำหรับระบุเป็นผู้มอบหมาย');

  let created = 0;
  let skipped = 0;

  for (const [title, start, finishLabel, deadline, mainNicks, supportNicksOrAll, reviewerNick] of ROWS) {
    const existing = await TaskMaster.findOne({ department: DEPARTMENT, title });
    if (existing) {
      console.log(`- ข้าม (มีอยู่แล้ว): ${title}`);
      skipped += 1;
      continue;
    }

    const mainAssigneeNick = mainNicks[0];
    const mainAssignee = userByNick[mainAssigneeNick]?._id;
    if (!mainAssignee) {
      console.warn(`⚠ ข้าม "${title}" เพราะไม่พบผู้รับผิดชอบหลัก "${mainAssigneeNick}"`);
      continue;
    }

    const supportNicks = supportNicksOrAll === 'ALL' ? ALL_NICKS : supportNicksOrAll;
    const extraMainNicks = mainNicks.slice(1);
    const coAssigneeNicks = [...new Set([...extraMainNicks, ...supportNicks])].filter((n) => n !== mainAssigneeNick);
    const coAssignees = coAssigneeNicks.map((n) => userByNick[n]?._id).filter(Boolean);

    const reviewers = reviewerNick ? [userByNick[reviewerNick]?._id].filter(Boolean) : [];

    const task = new TaskMaster({
      title,
      description: finishLabel ? `คาดว่าจะแล้วเสร็จ: ${finishLabel}` : '',
      department: DEPARTMENT,
      mainAssignee,
      coAssignees,
      reviewers,
      startDate: start,
      deadline,
      createdBy: creator._id,
    });
    await task.save();
    created += 1;
    console.log(`+ เพิ่ม: ${title}`);
  }

  console.log(`เสร็จสิ้น — เพิ่มใหม่ ${created} รายการ, ข้าม (มีอยู่แล้ว) ${skipped} รายการ`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed task master error:', err);
  process.exit(1);
});
