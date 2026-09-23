// สีของสถานะ/ระดับ/ความสำคัญ ที่ใช้ซ้ำกันในหลายโมดูล (Task, Document, Letter, Risk)
const STATUS_COLORS = {
  // TASK_STATUSES
  'ยังไม่เริ่ม': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'กำลังดำเนินการ': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'รอตรวจสอบ': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'เสร็จสิ้น': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'ล่าช้า': { bg: 'bg-rose-100', text: 'text-rose-700' },
  'ยกเลิก': { bg: 'bg-gray-200', text: 'text-gray-500' },

  // TASK_PRIORITIES
  'ต่ำ': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'ปานกลาง': { bg: 'bg-sky-100', text: 'text-sky-700' },
  'สูง': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'เร่งด่วน': { bg: 'bg-rose-100', text: 'text-rose-700' },

  // DOCUMENT_APPROVAL_STATUSES
  'ร่างเอกสาร': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'ส่งกลับแก้ไข': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'รอผู้บริหารอนุมัติ': { bg: 'bg-purple-100', text: 'text-purple-700' },
  'อนุมัติแล้ว': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'ไม่อนุมัติ/ยกเลิก': { bg: 'bg-rose-100', text: 'text-rose-700' },

  // LETTER_STATUSES
  'ร่าง': { bg: 'bg-gray-100', text: 'text-gray-600' },
  'ส่งแล้ว': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'รอตอบรับ': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'ตอบรับแล้ว': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'ปิดเรื่อง': { bg: 'bg-gray-200', text: 'text-gray-500' },

  // RISK_ISSUE_STATUSES / TYPES / LEVELS
  'เปิด': { bg: 'bg-rose-100', text: 'text-rose-700' },
  'กำลังแก้ไข': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'แก้ไขแล้ว': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'ความเสี่ยง': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'ปัญหา': { bg: 'bg-rose-100', text: 'text-rose-700' },

  // MEMBER_WORK_STATUSES
  'ปฏิบัติงาน': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'ลาพัก': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'พ้นสภาพ': { bg: 'bg-gray-200', text: 'text-gray-500' },
}

const DEFAULT_STATUS_COLOR = { bg: 'bg-gray-100', text: 'text-gray-600' }

export const getStatusColor = (status) => STATUS_COLORS[status] || DEFAULT_STATUS_COLOR
