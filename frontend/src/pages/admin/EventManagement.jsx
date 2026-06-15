import { useEffect, useState } from 'react';
import api from '../../api/axios';

const emptyForm = { title: '', description: '', date: '', location: '', maxParticipants: '', status: 'active' };

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  const fetchEvents = () =>
    api.get('/api/events').then((res) => setEvents(res.data)).catch(console.error);

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (event) => {
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date ? new Date(event.date).toISOString().slice(0, 10) : '',
      location: event.location || '',
      maxParticipants: event.maxParticipants || '',
      status: event.status,
    });
    setModal(event._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = { ...form, maxParticipants: form.maxParticipants || undefined };
      if (modal === 'create') {
        await api.post('/api/events', body);
      } else {
        await api.put(`/api/events/${modal}`, body);
      }
      await fetchEvents();
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบกิจกรรมนี้?')) return;
    try {
      await api.delete(`/api/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleExport = async (eventId, title) => {
    setExportingId(eventId);
    try {
      const res = await api.get(`/api/registrations/event/${eventId}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}_participants.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('ไม่สามารถ export ได้');
    } finally {
      setExportingId(null);
    }
  };

  const statusLabel = { active: 'เปิดรับสมัคร', closed: 'ปิดรับสมัคร', cancelled: 'ยกเลิก' };
  const statusColor = { active: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-600' };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">จัดการกิจกรรม</h2>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + สร้างกิจกรรม
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-600">กิจกรรม</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">วันที่</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">สถานที่</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {events.map((event) => (
              <tr key={event._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{event.title}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(event.date).toLocaleDateString('th-TH')}</td>
                <td className="px-6 py-4 text-gray-600">{event.location}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[event.status]}`}>
                    {statusLabel[event.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(event)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg">แก้ไข</button>
                    <button onClick={() => handleExport(event._id, event.title)} disabled={exportingId === event._id} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg disabled:opacity-50">
                      {exportingId === event._id ? '...' : 'Export CSV'}
                    </button>
                    <button onClick={() => handleDelete(event._id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg">ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4">
              {modal === 'create' ? 'สร้างกิจกรรมใหม่' : 'แก้ไขกิจกรรม'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'title', label: 'ชื่อกิจกรรม', type: 'text', required: true },
                { key: 'location', label: 'สถานที่', type: 'text', required: true },
                { key: 'date', label: 'วันที่จัดกิจกรรม', type: 'date', required: true },
                { key: 'maxParticipants', label: 'จำนวนผู้เข้าร่วมสูงสุด', type: 'number' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">เปิดรับสมัคร</option>
                  <option value="closed">ปิดรับสมัคร</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
