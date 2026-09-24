import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import DepartmentBadge from '../../components/DepartmentBadge'
import { RoleBadge } from '../../components/PositionBadge'
import api from '../../api/axios'

// AUDIT_LOG (A) — อ่านอย่างเดียว
const AuditLog = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/audit-logs')
      .then(({ data }) => setLogs(data))
      .catch((err) => console.error('Fetch audit logs error:', err))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">ประวัติการแก้ไข (Audit Log)</h1>
            <p className="text-gray-500 mt-1">ทั้งหมด {logs.length} รายการ (500 รายการล่าสุด)</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">เวลา</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">โมดูล</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">การกระทำ</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ฝ่าย</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">โดย</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ยศ / ฝ่าย</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">ยังไม่มีประวัติ</td></tr>
                    ) : logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{log.module}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{log.action}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.department || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.performedBy?.name || '-'}</td>
                        <td className="px-6 py-4 text-sm space-x-1 whitespace-nowrap">
                          <RoleBadge roleName={log.performedBy?.role?.name} label={log.performedBy?.role?.displayName} />
                          {log.performedBy?.department && <DepartmentBadge department={log.performedBy.department} />}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AuditLog
