import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import { RoleBadge } from '../../components/PositionBadge'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

const UserManagement = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/roles'),
      ])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
    } catch (err) {
      console.error('Fetch data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, roleId) => {
    setUpdatingId(userId)
    setMessage({ text: '', type: '' })
    try {
      await api.put(`/api/users/${userId}/role`, { roleId })
      setMessage({ text: 'อัพเดต Role สำเร็จ', type: 'success' })
      fetchData()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('ต้องการลบผู้ใช้นี้หรือไม่?')) return
    setDeletingId(userId)
    setMessage({ text: '', type: '' })
    try {
      await api.delete(`/api/users/${userId}`)
      setMessage({ text: 'ลบผู้ใช้สำเร็จ', type: 'success' })
      fetchData()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>
            <p className="text-gray-500 mt-1">ทั้งหมด {users.length} คน</p>
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
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อ</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">อีเมล</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่สมัคร</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">ยังไม่มีผู้ใช้</td>
                      </tr>
                    ) : users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{user.name}</div>
                          {user._id === currentUser?._id && (
                            <span className="text-xs text-indigo-500">(บัญชีของคุณ)</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <RoleBadge roleName={user.role?.name} label={user.role?.displayName} />
                            <select
                              value={user.role?._id || ''}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              disabled={updatingId === user._id || user._id === currentUser?._id}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {roles.map((role) => (
                                <option key={role._id} value={role._id}>
                                  {role.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          {updatingId === user._id && (
                            <span className="ml-2 text-xs text-indigo-500">กำลังอัพเดต...</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4">
                          {user._id !== currentUser?._id && (
                            <button
                              onClick={() => handleDelete(user._id)}
                              disabled={deletingId === user._id}
                              className="text-xs px-3 py-1.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {deletingId === user._id ? 'กำลังลบ...' : 'ลบ'}
                            </button>
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

export default UserManagement
