// รายการคงที่ฝั่ง frontend ให้ตรงกับ backend/config/constants.js
export const DEPARTMENTS = [
  'ฝ่ายอำนวยการ/ประธานโครงการ',
  'ฝ่ายพิธีการและงานลงทะเบียน',
  'ฝ่ายนิทรรศการและสื่อ Infographic',
  'ฝ่ายสถานที่ และประชาสัมพันธ์สื่อดิจิทัล',
  'ฝ่ายธุรการและงานประเมิน',
  'ฝ่ายสวัสดิการและงานบริการ',
  'ฝ่ายวิชาการและการทดสอบ',
]

export const ROLE_TIER_LABELS = {
  admin: 'ผู้ดูแลระบบ',
  president: 'ประธาน',
  vice_president: 'รองประธาน',
  head: 'หัวหน้าฝ่าย',
  secretary: 'เลขาฝ่าย',
  member: 'สมาชิก',
}

export const DOCUMENT_CATEGORIES = [
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
]

export const DOCUMENT_APPROVAL_STATUSES = [
  'ร่างเอกสาร',
  'รอตรวจสอบ',
  'ส่งกลับแก้ไข',
  'รอผู้บริหารอนุมัติ',
  'อนุมัติแล้ว',
  'ไม่อนุมัติ/ยกเลิก',
]

export const TASK_STATUSES = ['ยังไม่เริ่ม', 'กำลังดำเนินการ', 'รอตรวจสอบ', 'เสร็จสิ้น', 'ล่าช้า', 'ยกเลิก']
export const TASK_PRIORITIES = ['ต่ำ', 'ปานกลาง', 'สูง', 'เร่งด่วน']
export const LETTER_STATUSES = ['ร่าง', 'ส่งแล้ว', 'รอตอบรับ', 'ตอบรับแล้ว', 'ปิดเรื่อง']
export const BUDGET_CATEGORIES = ['ค่าใช้จ่ายทั่วไป', 'ค่าวัสดุอุปกรณ์', 'ค่าอาหารและเครื่องดื่ม', 'ค่าตอบแทนวิทยากร', 'ค่าสถานที่', 'ค่าประชาสัมพันธ์', 'อื่นๆ']
export const RISK_ISSUE_TYPES = ['ความเสี่ยง', 'ปัญหา']
export const IMPACT_LEVELS = ['ต่ำ', 'ปานกลาง', 'สูง']
export const LIKELIHOOD_LEVELS = ['ต่ำ', 'ปานกลาง', 'สูง']
export const RISK_ISSUE_STATUSES = ['เปิด', 'กำลังแก้ไข', 'แก้ไขแล้ว', 'ปิดเรื่อง']
export const MEMBER_WORK_STATUSES = ['ปฏิบัติงาน', 'ลาพัก', 'พ้นสภาพ']

export const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }))
