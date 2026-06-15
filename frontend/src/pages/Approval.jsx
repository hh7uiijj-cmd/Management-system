import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import api from '../api/axios'

const Approval = () => {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/api/registrations/pending')
      setRegistrations(data)
    } catch (err) {
      console.error('Fetch pending error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    setActionId(id)
    setMessage({ text: '', type: '' })
    try {
      await api.put(`/api/registrations/${id}/approve`)
      setMessage({ text: 'อนุมัติการลงทะเบียนเรียบร้อยแล้ว', type: 'success' })
      fetchPending()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setActionId(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    setActionId(rejectTarget)
    setMessage({ text: '', type: '' })
    try {
      await api.put(`/api/registrations/${rejectTarget}/reject`, { note: rejectNote })
      setMessage({ text: 'ปฏิเสธการลงทะเบียนเรียบร้อยแล้ว', type: 'success' })
      setRejectTarget(null)
      setRejectNote('')
      fetchPending()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setActionId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">อนุมัติการลงทะเบียน</h1>
            <p className="text-gray-500 mt-1">รายการรอการอนุมัติ {registrations.length} รายการ</p>
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="card p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">ไม่มีรายการรอการอนุมัติ</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้ลงทะเบียน</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">กิจกรรม</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่กิจกรรม</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่ลงทะเบียน</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{reg.user?.name}</div>
                          <div className="text-sm text-gray-500">{reg.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{reg.event?.title}</div>
                          <div className="text-sm text-gray-500">{reg.event?.location || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(reg.event?.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(reg.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApprove(reg._id)}
                              disabled={actionId === reg._id}
                              className="btn-success py-1.5 px-3 text-sm"
                            >
                              {actionId === reg._id ? '...' : 'อนุมัติ'}
                            </button>
                            <button
                              onClick={() => { setRejectTarget(reg._id); setRejectNote('') }}
                              disabled={actionId === reg._id}
                              className="btn-danger py-1.5 px-3 text-sm"
                            >
                              ปฏิเสธ
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

          {/* Reject Modal */}
          {rejectTarget && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">ยืนยันการปฏิเสธ</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ (ไม่บังคับ)
                  </label>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="ระบุเหตุผลในการปฏิเสธ..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => { setRejectTarget(null); setRejectNote('') }}
                    className="btn-secondary flex-1"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleRejectConfirm}
                    disabled={actionId === rejectTarget}
                    className="btn-danger flex-1"
                  >
                    {actionId === rejectTarget ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Approval
