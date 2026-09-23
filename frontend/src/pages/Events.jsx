import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const Events = () => {
  const [events, setEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState({})
  const [loading, setLoading] = useState(true)
  const [registeringId, setRegisteringId] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        api.get('/api/events'),
        api.get('/api/registrations/my'),
      ])
      setEvents(eventsRes.data)
      const regsMap = {}
      regsRes.data.forEach((r) => {
        regsMap[r.event._id || r.event] = r
      })
      setMyRegistrations(regsMap)
    } catch (err) {
      console.error('Fetch events error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId)
    setMessage({ text: '', type: '' })
    try {
      await api.post('/api/registrations', { eventId })
      setMessage({ text: 'ลงทะเบียนสำเร็จ! รอการอนุมัติจากเจ้าหน้าที่', type: 'success' })
      fetchData()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setRegisteringId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  const statusBadge = (status) => {
    const map = {
      pending: <span className="badge-pending">รอการอนุมัติ</span>,
      approved: <span className="badge-approved">อนุมัติแล้ว</span>,
      rejected: <span className="badge-rejected">ถูกปฏิเสธ</span>,
    }
    return map[status] || null
  }

  const activeEvents = events.filter(e => e.status === 'active')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">กิจกรรมทั้งหมด</h1>
            <p className="text-gray-500 mt-1">กิจกรรมที่เปิดรับสมัคร {activeEvents.length} กิจกรรม</p>
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">ยังไม่มีกิจกรรมที่เปิดรับสมัคร</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEvents.map((event) => {
                const myReg = myRegistrations[event._id]
                const isFull = event.maxParticipants != null && event.availableSpots <= 0
                return (
                  <div key={event._id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-800 text-lg leading-tight">
                          {event.title}
                        </h3>
                        {myReg && statusBadge(myReg.status)}
                      </div>
                      {event.description && (
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                      )}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(event.date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.location}
                          </div>
                        )}
                        {event.maxParticipants != null && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className={isFull ? 'text-red-600 font-medium' : ''}>
                              {isFull ? 'เต็มแล้ว' : `ที่นั่งว่าง ${event.availableSpots} / ${event.maxParticipants}`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/events/${event._id}`}
                          className="flex-1 text-center py-2 px-3 text-sm border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                        >
                          ดูรายละเอียด
                        </Link>
                        {!myReg && !isFull && (
                          <button
                            onClick={() => handleRegister(event._id)}
                            disabled={registeringId === event._id}
                            className="flex-1 btn-primary py-2 text-sm"
                          >
                            {registeringId === event._id ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Events
