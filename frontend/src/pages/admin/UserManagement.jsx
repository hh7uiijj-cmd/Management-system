import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/users'), api.get('/api/roles')])
      .then(([usersRes, rolesRes]) => {
        setUsers(usersRes.data);
        setRoles(rolesRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, roleId) => {
    try {
      const res = await api.put(`/api/users/${userId}/role`, { roleId });
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: res.data.role } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('ต้องการลบผู้ใช้นี้?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500">กำลังโหลด...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">จัดการผู้ใช้งาน</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-600">ผู้ใช้งาน</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">วันที่สมัคร</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-gray-400 text-xs">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.role?._id || ''}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    disabled={u._id === currentUser?._id}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                  >
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>{role.displayName}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(u.createdAt).toLocaleDateString('th-TH')}
                </td>
                <td className="px-6 py-4">
                  {u._id !== currentUser?._id && (
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg"
                    >
                      ลบ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
