import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const EventDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [myReg, setMyReg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [eventRes, regsRes] = await Promise.all([
        api.get(`/api/events/${id}`),
        api.get('/api/registrations/my'),
      ])
      setEvent(eventRes.data)
      const reg = regsRes.data.find(r => (r.event._id || r.event) === id)
      setMyReg(reg || null)
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/events')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setRegistering(true)
    setMessage({ text: '', type: '' })
    try {
      await api.post('/api/registrations', { eventId: id })
      setMessage({ text: 'ลงทะเบียนสำเร็จ! รอการอนุมัติจากเจ้าหน้าที่', type: 'success' })
      fetchData()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setRegistering(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    })
  }

  const statusLabel = { active: 'เปิดรับสมัคร', closed: 'ปิดรับสมัคร', cancelled: 'ยกเลิก' }
  const statusClass = { active: 'badge-active', closed: 'badge-closed', cancelled: 'badge-cancelled' }
  const regStatusLabel = { pending: 'รอการอนุมัติ', approved: 'อนุมัติแล้ว', rejected: 'ถูกปฏิเสธ' }
  const regStatusClass = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </main>
        </div>
      </div>
    )
  }

  if (!event) return null

  const isFull = event.maxParticipants != null && event.availableSpots <= 0

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับไปหน้ากิจกรรม
          </button>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="card p-8 max-w-3xl">
            <div className="flex items-start justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800 flex-1">{event.title}</h1>
              <span className={`ml-4 ${statusClass[event.status] || 'badge-closed'}`}>
                {statusLabel[event.status] || event.status}
              </span>
            </div>

            {event.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{event.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">วันที่จัดกิจกรรม</p>
                  <p className="font-medium">{formatDate(event.date)}</p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">สถานที่</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              )}
              {event.maxParticipants != null && (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">ผู้เข้าร่วม</p>
                    <p className={`font-medium ${isFull ? 'text-red-600' : ''}`}>
                      {event.approvedCount} / {event.maxParticipants} คน
                      {isFull && ' (เต็มแล้ว)'}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-400">สร้างโดย</p>
                  <p className="font-medium">{event.createdBy?.name || '-'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              {myReg ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600 font-medium">สถานะการลงทะเบียน:</span>
                  <span className={regStatusClass[myReg.status] || ''}>
                    {regStatusLabel[myReg.status] || myReg.status}
                  </span>
                  {myReg.note && (
                    <span className="text-sm text-gray-500">หมายเหตุ: {myReg.note}</span>
                  )}
                </div>
              ) : event.status === 'active' && !isFull ? (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="btn-primary px-8"
                >
                  {registering ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเข้าร่วมกิจกรรม'}
                </button>
              ) : (
                <p className="text-gray-500 text-sm">
                  {isFull ? 'กิจกรรมนี้เต็มแล้ว ไม่สามารถลงทะเบียนได้' : 'กิจกรรมนี้ปิดรับสมัครแล้ว'}
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EventDetail
