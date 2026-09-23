import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'

const INITIAL_FORM = {
  title: '', description: '', date: '', location: '', maxParticipants: '', status: 'active',
}

const EventManagement = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [exportingId, setExportingId] = useState(null)

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/api/events')
      setEvents(data)
    } catch (err) {
      console.error('Fetch events error:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditEvent(null)
    setForm(INITIAL_FORM)
    setShowModal(true)
  }

  const openEdit = (event) => {
    setEditEvent(event)
    setForm({
      title: event.title || '',
      description: event.description || '',
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      maxParticipants: event.maxParticipants != null ? String(event.maxParticipants) : '',
      status: event.status || 'active',
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        location: form.location,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
        status: form.status,
      }
      if (editEvent) {
        await api.put(`/api/events/${editEvent._id}`, payload)
        setMessage({ text: 'แก้ไขกิจกรรมสำเร็จ', type: 'success' })
      } else {
        await api.post('/api/events', payload)
        setMessage({ text: 'สร้างกิจกรรมสำเร็จ', type: 'success' })
      }
      setShowModal(false)
      fetchEvents()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบกิจกรรมนี้หรือไม่? การลบจะลบข้อมูลการลงทะเบียนทั้งหมดด้วย')) return
    setDeletingId(id)
    setMessage({ text: '', type: '' })
    try {
      await api.delete(`/api/events/${id}`)
      setMessage({ text: 'ลบกิจกรรมสำเร็จ', type: 'success' })
      fetchEvents()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = async (eventId, eventTitle) => {
    setExportingId(eventId)
    try {
      const { data } = await api.get(`/api/registrations/event/${eventId}/export`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `participants_${eventTitle}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setMessage({ text: 'ไม่สามารถส่งออก CSV ได้', type: 'error' })
    } finally {
      setExportingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const statusLabel = { active: 'เปิดรับสมัคร', closed: 'ปิดรับสมัคร', cancelled: 'ยกเลิก' }
  const statusClass = { active: 'badge-active', closed: 'badge-closed', cancelled: 'badge-cancelled' }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">จัดการกิจกรรม</h1>
              <p className="text-gray-500 mt-1">ทั้งหมด {events.length} กิจกรรม</p>
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>สร้างกิจกรรมใหม่</span>
            </button>
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
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อกิจกรรม</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานที่</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้เข้าร่วม</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">ยังไม่มีกิจกรรม</td>
                      </tr>
                    ) : events.map((event) => (
                      <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(event.date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{event.location || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {event.maxParticipants != null
                            ? `${event.approvedCount} / ${event.maxParticipants}`
                            : `${event.approvedCount} คน`}
                        </td>
                        <td className="px-6 py-4">
                          <span className={statusClass[event.status] || 'badge-closed'}>
                            {statusLabel[event.status] || event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEdit(event)}
                              className="text-xs px-2 py-1 border border-indigo-500 text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleExport(event._id, event.title)}
                              disabled={exportingId === event._id}
                              className="text-xs px-2 py-1 border border-green-500 text-green-600 rounded hover:bg-green-50 transition-colors"
                            >
                              {exportingId === event._id ? '...' : 'CSV'}
                            </button>
                            <button
                              onClick={() => handleDelete(event._id)}
                              disabled={deletingId === event._id}
                              className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded hover:bg-red-50 transition-colors"
                            >
                              {deletingId === event._id ? '...' : 'ลบ'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">
              {editEvent ? 'แก้ไขกิจกรรม' : 'สร้างกิจกรรมใหม่'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อกิจกรรม *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  required
                  placeholder="ชื่อกิจกรรม"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="รายละเอียดกิจกรรม"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่และเวลา *</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="input-field"
                  placeholder="สถานที่จัดกิจกรรม"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้เข้าร่วมสูงสุด</label>
                <input
                  type="number"
                  value={form.maxParticipants}
                  onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                  className="input-field"
                  min="1"
                  placeholder="ไม่จำกัด"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input-field"
                >
                  <option value="active">เปิดรับสมัคร</option>
                  <option value="closed">ปิดรับสมัคร</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>

              {message.text && showModal && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'กำลังบันทึก...' : editEvent ? 'บันทึกการแก้ไข' : 'สร้างกิจกรรม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventManagement
