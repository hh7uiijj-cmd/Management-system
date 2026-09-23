// ฝ่ายงานทั้งหมดของกิจกรรม "แฟนพันธุ์แท้จิตวิทยา ครั้งที่ 20"
const DEPARTMENTS = [
  'ฝ่ายอำนวยการ/ประธานโครงการ',
  'ฝ่ายพิธีการและงานลงทะเบียน',
  'ฝ่ายนิทรรศการและสื่อ Infographic',
  'ฝ่ายสถานที่ และประชาสัมพันธ์สื่อดิจิทัล',
  'ฝ่ายธุรการและงานประเมิน',
  'ฝ่ายสวัสดิการและงานบริการ',
  'ฝ่ายวิชาการและการทดสอบ',
];

// ระดับสิทธิ์ของผู้ใช้งาน (fixed role tiers, server-side enforced)
// ADMIN, PRESIDENT, VICE_PRESIDENT ไม่จำเป็นต้องสังกัดฝ่ายใดฝ่ายหนึ่ง (มองเห็นทุกฝ่าย)
const ROLE_TIERS = ['admin', 'president', 'vice_president', 'head', 'secretary', 'member'];

const ROLE_TIER_LABELS = {
  admin: 'ผู้ดูแลระบบ',
  president: 'ประธาน',
  vice_president: 'รองประธาน',
  head: 'หัวหน้าฝ่าย',
  secretary: 'เลขาฝ่าย',
  member: 'สมาชิก',
};

const DOCUMENT_CATEGORIES = [
  'หนังสือราชการ',
  'แผนงาน/โครงการ',
  'รายงานการประชุม',
  'เอกสารงบประมาณ',
  'เอกสารประชาสัมพันธ์/สื่อ',
  'แบบฟอร์มลงทะเบียน',
  'เอกสารวิชาการ/ข้อสอบ',
  'หลักฐานการดำเนินงาน',
  'สรุปผลการดำเนินงาน',
  'อื่นๆ',
];

// สถานะอนุมัติเอกสาร 6 ขั้น เรียงตามลำดับ workflow
const DOCUMENT_APPROVAL_STATUSES = [
  'ร่างเอกสาร',
  'รอตรวจสอบ',
  'ส่งกลับแก้ไข',
  'รอผู้บริหารอนุมัติ',
  'อนุมัติแล้ว',
  'ไม่อนุมัติ/ยกเลิก',
];

const TASK_STATUSES = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'รอตรวจสอบ', 'เสร็จสิ้น', 'ล่าช้า', 'ยกเลิก'];
const TASK_PRIORITIES = ['ต่ำ', 'ปานกลาง', 'สูง', 'เร่งด่วน'];

const LETTER_STATUSES = ['ร่าง', 'ส่งแล้ว', 'รอตอบรับ', 'ตอบรับแล้ว', 'ปิดเรื่อง'];

const BUDGET_CATEGORIES = ['ค่าใช้จ่ายทั่วไป', 'ค่าวัสดุอุปกรณ์', 'ค่าอาหารและเครื่องดื่ม', 'ค่าตอบแทนวิทยากร', 'ค่าสถานที่', 'ค่าประชาสัมพันธ์', 'อื่นๆ'];

const RISK_ISSUE_TYPES = ['ความเสี่ยง', 'ปัญหา'];
const IMPACT_LEVELS = ['ต่ำ', 'ปานกลาง', 'สูง'];
const LIKELIHOOD_LEVELS = ['ต่ำ', 'ปานกลาง', 'สูง'];
const RISK_ISSUE_STATUSES = ['เปิด', 'กำลังแก้ไข', 'แก้ไขแล้ว', 'ปิดเรื่อง'];

const MEMBER_WORK_STATUSES = ['ปฏิบัติงาน', 'ลาพัก', 'พ้นสภาพ'];

module.exports = {
  DEPARTMENTS,
  ROLE_TIERS,
  ROLE_TIER_LABELS,
  DOCUMENT_CATEGORIES,
  DOCUMENT_APPROVAL_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  LETTER_STATUSES,
  BUDGET_CATEGORIES,
  RISK_ISSUE_TYPES,
  IMPACT_LEVELS,
  LIKELIHOOD_LEVELS,
  RISK_ISSUE_STATUSES,
  MEMBER_WORK_STATUSES,
};
