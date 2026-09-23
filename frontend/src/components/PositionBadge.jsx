import { getPositionColor, getRoleTierColor } from '../utils/badgeColors'

// สำหรับข้อความตำแหน่งอิสระ เช่น Member.position ("หัวหน้า", "ประธานโครงการ")
export const PositionBadge = ({ position }) => {
  if (!position) return <span className="text-gray-400">-</span>
  const c = getPositionColor(position)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {position}
    </span>
  )
}

// สำหรับ role tier จริง (role.name / role.displayName)
export const RoleBadge = ({ roleName, label }) => {
  if (!roleName) return <span className="text-gray-400">-</span>
  const c = getRoleTierColor(roleName)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {label || roleName}
    </span>
  )
}

export default PositionBadge
