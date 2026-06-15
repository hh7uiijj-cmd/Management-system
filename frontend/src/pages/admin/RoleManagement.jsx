import { useEffect, useState } from 'react';
import api from '../../api/axios';

const ALL_PERMISSIONS = [
  { key: 'manage_events', label: 'จัดการกิจกรรม' },
  { key: 'approve_registrations', label: 'อนุมัติการลงทะเบียน' },
  { key: 'manage_users', label: 'จัดการผู้ใช้งาน' },
  { key: 'manage_roles', label: 'จัดการ Role' },
  { key: 'export_csv', label: 'Export CSV' },
];

const emptyForm = { name: '', displayName: '', permissions: [] };

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = () =>
    api.get('/api/roles').then((res) => setRoles(res.data)).catch(console.error);

  useEffect(() => { fetchRoles(); }, []);

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (role) => {
    setForm({ name: role.name, displayName: role.displayName, permissions: [...role.permissions] });
    setModal(role._id);
  };

  const togglePerm = (perm) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await api.post('/api/roles', form);
      } else {
        await api.put(`/api/roles/${modal}`, { displayName: form.displayName, permissions: form.permissions });
      }
      await fetchRoles();
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบ Role นี้?')) return;
    try {
      await api.delete(`/api/roles/${id}`);
      setRoles((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">จัดการ Role</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + เพิ่ม Role ใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{role.displayName}</h3>
                <p className="text-gray-400 text-xs">{role.name}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(role)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2.5 py-1 rounded-lg">แก้ไข</button>
                <button onClick={() => handleDelete(role._id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1 rounded-lg">ลบ</button>
              </div>
            </div>
            <div className="space-y-1.5">
              {role.permissions.length === 0 ? (
                <p className="text-gray-400 text-xs">ไม่มีสิทธิ์พิเศษ</p>
              ) : (
                role.permissions.map((perm) => {
                  const p = ALL_PERMISSIONS.find((p) => p.key === perm);
                  return (
                    <span key={perm} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                      {p?.label || perm}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-800 mb-4">
              {modal === 'create' ? 'เพิ่ม Role ใหม่' : 'แก้ไข Role'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ Role (ภาษาอังกฤษ, ไม่มีช่องว่าง)</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น department_head"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อที่แสดงผล</label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น หัวหน้าฝ่าย"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สิทธิ์การใช้งาน</label>
                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(p.key)}
                        onChange={() => togglePerm(p.key)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
                  {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
