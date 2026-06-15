import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const StatCard = ({ label, value, color, icon }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
        {icon}
      </div>
    </div>
  </div>
)

const Dashboard = () => {
  const { user, hasPermission } = useAuth()
  const [stats, setStats] = useState({ totalEvents: 0, myRegistrations: 0, pendingApprovals: 0 })
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, myRegsRes] = await Promise.all([
          api.get('/api/events'),
          api.get('/api/registrations/my'),
        ])

        const events = eventsRes.data
        const myRegs = myRegsRes.data

        let pendingCount = 0
        if (hasPermission('approve_registrations')) {
          try {
            const pendingRes = await api.get('/api/registrations/pending')
            pendingCount = pendingRes.data.length
          } catch {}
        }

        setStats({
          totalEvents: events.filter(e => e.status === 'active').length,
          myRegistrations: myRegs.length,
          pendingApprovals: pendingCount,
        })
        setRecentEvents(events.slice(0, 5))
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [hasPermission])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const statusLabel = { active: 'เปิดรับสมัคร', closed: 'ปิดรับสมัคร', cancelled: 'ยกเลิก' }
  const statusClass = { active: 'badge-active', closed: 'badge-closed', cancelled: 'badge-cancelled' }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ด</h1>
            <p className="text-gray-500 mt-1">ยินดีต้อนรับ, {user?.name}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                  label="กิจกรรมที่เปิดอยู่"
                  value={stats.totalEvents}
                  color="text-blue-600"
                  icon={
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
                <StatCard
                  label="การลงทะเบียนของฉัน"
                  value={stats.myRegistrations}
                  color="text-green-600"
                  icon={
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                />
                {hasPermission('approve_registrations') && (
                  <StatCard
                    label="รอการอนุมัติ"
                    value={stats.pendingApprovals}
                    color="text-yellow-600"
                    icon={
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">กิจกรรมล่าสุด</h2>
                  <Link to="/events" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    ดูทั้งหมด →
                  </Link>
                </div>
                {recentEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">ยังไม่มีกิจกรรม</p>
                ) : (
                  <div className="space-y-3">
                    {recentEvents.map((event) => (
                      <Link
                        key={event._id}
                        to={`/events/${event._id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{event.title}</p>
                          <p className="text-sm text-gray-500">{formatDate(event.date)} · {event.location || 'ไม่ระบุสถานที่'}</p>
                        </div>
                        <span className={statusClass[event.status] || 'badge-closed'}>
                          {statusLabel[event.status] || event.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
