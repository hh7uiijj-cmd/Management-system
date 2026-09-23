import { getStatusColor } from '../utils/statusColors'

const StatusBadge = ({ status }) => {
  if (!status) return <span className="text-gray-400">-</span>
  const c = getStatusColor(status)
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {status}
    </span>
  )
}

export default StatusBadge
