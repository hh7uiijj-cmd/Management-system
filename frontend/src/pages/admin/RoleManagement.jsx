import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import api from '../../api/axios'

const ALL_PERMISSIONS = [
  { key: 'manage_events', label: 'จัดการกิจกรรม' },
  { key: 'approve_registrations', label: 'อนุมัติการลงทะเบียน' },
  { key: 'manage_users', label: 'จัดการผู้ใช้' },
  { key: 'manage_roles', label: 'จัดการ Role' },
  { key: 'export_csv', label: 'ส่งออก CSV' },
]

const INITIAL_FORM = { name: '', displayName: '', permissions: [] }

const RoleManagement = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editRole, setEditRole] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => { fetchRoles() }, [])

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/api/roles')
      setRoles(data)
    } catch (err) {
      console.error('Fetch roles error:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditRole(null)
    setForm(INITIAL_FORM)
    setMessage({ text: '', type: '' })
    setShowModal(true)
  }

  const openEdit = (role) => {
    setEditRole(role)
    setForm({
      name: role.name,
      displayName: role.displayName,
      permissions: [...(role.permissions || [])],
    })
    setMessage({ text: '', type: '' })
    setShowModal(true)
  }

  const togglePermission = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      if (editRole) {
        await api.put(`/api/roles/${editRole._id}`, form)
        setMessage({ text: 'แก้ไข Role สำเร็จ', type: 'success' })
      } else {
        await api.post('/api/roles', form)
        setMessage({ text: 'สร้าง Role สำเร็จ', type: 'success' })
      }
      setShowModal(false)
      fetchRoles()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบ Role นี้หรือไม่?')) return
    setDeletingId(id)
    setMessage({ text: '', type: '' })
    try {
      await api.delete(`/api/roles/${id}`)
      setMessage({ text: 'ลบ Role สำเร็จ', type: 'success' })
      fetchRoles()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const permLabel = Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, p.label]))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">จัดการ Role</h1>
              <p className="text-gray-500 mt-1">ทั้งหมด {roles.length} Role</p>
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>สร้าง Role ใหม่</span>
            </button>
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
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อแสดง</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">สิทธิ์การใช้งาน</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">ยังไม่มี Role</td>
                      </tr>
                    ) : roles.map((role) => (
                      <tr key={role._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{role.name}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">{role.displayName}</td>
                        <td className="px-6 py-4">
                          {role.permissions?.length === 0 ? (
                            <span className="text-sm text-gray-400">ไม่มีสิทธิ์พิเศษ</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {role.permissions?.map((perm) => (
                                <span key={perm} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                                  {permLabel[perm] || perm}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEdit(role)}
                              className="text-xs px-2 py-1 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDelete(role._id)}
                              disabled={deletingId === role._id}
                              className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded hover:bg-red-50 transition-colors"
                            >
                              {deletingId === role._id ? '...' : 'ลบ'}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">
              {editRole ? 'แก้ไข Role' : 'สร้าง Role ใหม่'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ Role (ภาษาอังกฤษ) *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="input-field"
                  required
                  placeholder="เช่น department_head"
                  disabled={!!editRole}
                />
                {editRole && <p className="text-xs text-gray-400 mt-1">ไม่สามารถเปลี่ยนชื่อ Role ได้</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแสดง *</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="input-field"
                  required
                  placeholder="เช่น หัวหน้าฝ่าย"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สิทธิ์การใช้งาน</label>
                <div className="space-y-2 border border-gray-200 rounded-lg p-4">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label key={perm.key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                        <span className="text-xs text-gray-400 ml-2">({perm.key})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {message.text && (
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
                  {saving ? 'กำลังบันทึก...' : editRole ? 'บันทึกการแก้ไข' : 'สร้าง Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleManagement
