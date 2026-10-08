import { useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

// ย่อขนาดรูปด้วย canvas ก่อนแปลงเป็น base64 ส่งขึ้นเซิร์ฟเวอร์ (ไม่มีที่เก็บไฟล์แยก จึงเก็บรูปเล็กๆ ไว้ใน MongoDB โดยตรง)
const resizeImageToDataUrl = (file, maxSize = 400, quality = 0.85) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const fileRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น', type: 'error' })
      return
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setAvatarPreview(dataUrl)
      setMessage({ text: '', type: '' })
    } catch {
      setMessage({ text: 'ไม่สามารถอ่านไฟล์รูปภาพนี้ได้', type: 'error' })
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const { data } = await api.put('/api/auth/me', { avatar: avatarPreview, phone, bio })
      updateUser({ ...user, ...data })
      setMessage({ text: 'บันทึกโปรไฟล์สำเร็จ', type: 'success' })
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">โปรไฟล์ของฉัน</h1>
            <p className="text-gray-500 mt-1">แก้ไขรูปโปรไฟล์และข้อมูลส่วนตัวของคุณ</p>
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="card p-6 space-y-6">
            <div className="flex items-center gap-5">
              {avatarPreview ? (
                <img src={avatarPreview} alt="รูปโปรไฟล์" className="w-24 h-24 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-semibold">
                  {initials(user?.name) || '?'}
                </div>
              )}
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm">
                  เปลี่ยนรูปโปรไฟล์
                </button>
                {avatarPreview && (
                  <button type="button" onClick={() => setAvatarPreview('')} className="ml-2 px-4 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 text-sm">
                    ลบรูป
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-2">รองรับไฟล์ JPG/PNG ระบบจะย่อขนาดให้อัตโนมัติ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อ-นามสกุล</label>
                <p className="text-gray-700">{user?.name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">อีเมล</label>
                <p className="text-gray-700">{user?.email || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ตำแหน่ง/สิทธิ์</label>
                <p className="text-gray-700">{user?.role?.displayName || '-'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ฝ่าย</label>
                <p className="text-gray-700">{user?.department || '-'}</p>
              </div>
              <p className="md:col-span-2 text-xs text-gray-400">
                ชื่อ/อีเมล/ฝ่าย/สิทธิ์ แก้ไขได้โดยผู้ดูแลระบบเท่านั้น (หน้า "จัดการผู้ใช้")
              </p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
                <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แนะนำตัว / หมายเหตุ</label>
                <textarea className="input-field" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="เขียนแนะนำตัวสั้นๆ (ไม่บังคับ)" />
              </div>
              <div>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Profile
