import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const { data } = await api.get('/api/registrations/my')
        setRegistrations(data)
      } catch (err) {
        console.error('Fetch my registrations error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRegistrations()
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const statusConfig = {
    pending: { label: 'รอการอนุมัติ', class: 'badge-pending' },
    approved: { label: 'อนุมัติแล้ว', class: 'badge-approved' },
    rejected: { label: 'ถูกปฏิเสธ', class: 'badge-rejected' },
  }

  const eventStatusConfig = {
    active: { label: 'เปิดรับสมัคร', class: 'badge-active' },
    closed: { label: 'ปิดรับสมัคร', class: 'badge-closed' },
    cancelled: { label: 'ยกเลิก', class: 'badge-cancelled' },
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">การลงทะเบียนของฉัน</h1>
            <p className="text-gray-500 mt-1">ทั้งหมด {registrations.length} รายการ</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 mb-4">ยังไม่มีการลงทะเบียน</p>
              <Link to="/events" className="btn-primary inline-block">
                ดูกิจกรรมทั้งหมด
              </Link>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">กิจกรรม</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่กิจกรรม</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานที่</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่ลงทะเบียน</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrations.map((reg) => {
                      const sc = statusConfig[reg.status] || { label: reg.status, class: '' }
                      const ec = eventStatusConfig[reg.event?.status] || { label: reg.event?.status, class: 'badge-closed' }
                      return (
                        <tr key={reg._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <Link
                                to={`/events/${reg.event?._id}`}
                                className="font-medium text-indigo-600 hover:text-indigo-700"
                              >
                                {reg.event?.title || 'กิจกรรมที่ถูกลบ'}
                              </Link>
                              <span className={`ml-2 ${ec.class}`}>{ec.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(reg.event?.date)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {reg.event?.location || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(reg.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={sc.class}>{sc.label}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {reg.note || '-'}
                          </td>
                        </tr>
                      )
                    })}
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

export default MyRegistrations
