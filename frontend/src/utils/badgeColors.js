// สีประจำฝ่าย/ตำแหน่ง ใช้ให้สอดคล้องกันทุกหน้าที่แสดงฝ่ายหรือบทบาท

export const DEPARTMENT_COLORS = {
  'ฝ่ายอำนวยการ/ประธานโครงการ': { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  'ฝ่ายพิธีการและงานลงทะเบียน': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  'ฝ่ายนิทรรศการและสื่อ Infographic': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  'ฝ่ายสถานที่ และประชาสัมพันธ์สื่อดิจิทัล': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'ฝ่ายธุรการและงานประเมิน': { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  'ฝ่ายสวัสดิการและงานบริการ': { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  'ฝ่ายวิชาการและการทดสอบ': { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
}
const DEFAULT_DEPARTMENT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }

export const getDepartmentColor = (dept) => DEPARTMENT_COLORS[dept] || DEFAULT_DEPARTMENT_COLOR

// สีตามระดับตำแหน่ง (role tier) — ใช้กับ role.name จริง (admin/president/vice_president/head/secretary/member)
export const ROLE_TIER_COLORS = {
  admin: { bg: 'bg-slate-800', text: 'text-white' },
  president: { bg: 'bg-red-600', text: 'text-white' },
  vice_president: { bg: 'bg-amber-800', text: 'text-white' },
  head: { bg: 'bg-pink-100', text: 'text-pink-700' },
  secretary: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  member: { bg: 'bg-blue-100', text: 'text-blue-700' },
}
const DEFAULT_ROLE_COLOR = { bg: 'bg-gray-100', text: 'text-gray-600' }

export const getRoleTierColor = (roleName) => ROLE_TIER_COLORS[roleName] || DEFAULT_ROLE_COLOR

// สีตามตำแหน่ง/บทบาทที่เป็นข้อความอิสระ (Member.position เช่น "ประธานโครงการ", "หัวหน้า")
const POSITION_KEYWORD_COLORS = [
  { test: (p) => p.includes('ประธานโครงการ') && !p.includes('รอง'), ...ROLE_TIER_COLORS.president },
  { test: (p) => p.includes('รองประธาน'), ...ROLE_TIER_COLORS.vice_president },
  { test: (p) => p.includes('หัวหน้า'), ...ROLE_TIER_COLORS.head },
  { test: (p) => p.includes('เลขา'), ...ROLE_TIER_COLORS.secretary },
  { test: (p) => p.includes('สมาชิก'), ...ROLE_TIER_COLORS.member },
]

export const getPositionColor = (position) => {
  const p = (position || '').trim()
  const match = POSITION_KEYWORD_COLORS.find((k) => k.test(p))
  return match ? { bg: match.bg, text: match.text } : DEFAULT_ROLE_COLOR
}
