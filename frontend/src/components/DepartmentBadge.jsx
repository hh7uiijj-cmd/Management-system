import { getDepartmentColor } from '../utils/badgeColors'

const DepartmentBadge = ({ department }) => {
  if (!department) return <span className="text-gray-400">-</span>
  const c = getDepartmentColor(department)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {department}
    </span>
  )
}

export default DepartmentBadge
