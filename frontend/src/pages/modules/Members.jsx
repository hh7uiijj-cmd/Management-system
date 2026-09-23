import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import DepartmentBadge from '../../components/DepartmentBadge'
import { PositionBadge } from '../../components/PositionBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { DEPARTMENTS, MEMBER_WORK_STATUSES } from '../../constants'

// MEMBER (M) — ทะเบียนสมาชิก จัดการได้เฉพาะ admin/president/vice_president/head/เลขา
const Members = () => {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', nickname: '', department: '', position: '', phone: '', email: '', workStatus: MEMBER_WORK_STATUSES[0], note: '' })
  const [saving, setSaving] = useState(false)

  const isTopTier = ['admin', 'president', 'vice_president'].includes(user?.role?.name)
  const canManage = isTopTier || ['head', 'secretary'].includes(user?.role?.name)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/members')
      setMembers(data)
    } catch (err) {
      console.error('Fetch members error:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ name: '', nickname: '', department: isTopTier ? '' : user.department, position: '', phone: '', email: '', workStatus: MEMBER_WORK_STATUSES[0], note: '' })
    setShowForm(true)
    setMessage({ text: '', type: '' })
  }

  const openEdit = (m) => {
    setEditingId(m._id)
    setForm({ name: m.name, nickname: m.nickname, department: m.department, position: m.position, phone: m.phone, email: m.email, workStatus: m.workStatus, note: m.note })
    setShowForm(true)
    setMessage({ text: '', type: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      if (editingId) {
        await api.put(`/api/members/${editingId}`, form)
        setMessage({ text: 'บันทึกการแก้ไขสำเร็จ', type: 'success' })
      } else {
        await api.post('/api/members', form)
        setMessage({ text: 'เพิ่มสมาชิกสำเร็จ', type: 'success' })
      }
      setShowForm(false)
      fetchMembers()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบสมาชิกนี้หรือไม่?')) return
    try {
      await api.delete(`/api/members/${id}`)
      setMessage({ text: 'ลบสมาชิกสำเร็จ', type: 'success' })
      fetchMembers()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ทะเบียนสมาชิก (Member)</h1>
              <p className="text-gray-500 mt-1">ทั้งหมด {members.length} คน</p>
            </div>
            {canManage && <button onClick={openCreate} className="btn-primary">+ เพิ่มสมาชิก</button>}
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {showForm && (
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">{editingId ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-สกุล</label>
                  <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเล่น</label>
                  <input className="input-field" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ฝ่าย</label>
                  <select className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} disabled={!isTopTier} required>
                    <option value="">-- เลือกฝ่าย --</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                  <input className="input-field" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการทำงาน</label>
                  <select className="input-field" value={form.workStatus} onChange={(e) => setForm({ ...form, workStatus: e.target.value })}>
                    {MEMBER_WORK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                  <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <input className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                  <textarea className="input-field" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </div>
                <div className="md:col-span-2 flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ-สกุล</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อเล่น</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ฝ่าย</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ตำแหน่ง</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะ</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">ยังไม่มีข้อมูลสมาชิก</td></tr>
                    ) : members.map((m) => (
                      <tr key={m._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{m.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{m.nickname || '-'}</td>
                        <td className="px-6 py-4 text-sm"><DepartmentBadge department={m.department} /></td>
                        <td className="px-6 py-4 text-sm"><PositionBadge position={m.position} /></td>
                        <td className="px-6 py-4 text-sm text-gray-600">{m.workStatus}</td>
                        <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                          {canManage && (
                            <>
                              <button onClick={() => openEdit(m)} className="text-xs px-3 py-1.5 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50">แก้ไข</button>
                              <button onClick={() => handleDelete(m._id)} className="text-xs px-3 py-1.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50">ลบ</button>
                            </>
                          )}
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
    </div>
  )
}

export default Members
