import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import loginBg from '../assets/login-bg.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-4 leading-none shadow-sm shadow-indigo-200">
            <span className="text-xs font-bold text-white/80">FT</span>
            <span className="text-xl font-extrabold text-white -mt-1">20</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">FT20 CONTROL CENTER</h1>
          <p className="text-sm text-gray-500 mt-0.5">ระบบบริหารโครงการแฟนพันธุ์แท้</p>
          <p className="text-gray-500 mt-1 text-sm">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้ / อีเมล</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="กรอกชื่อผู้ใช้หรืออีเมลของคุณ"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="กรอกรหัสผ่านของคุณ"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>กำลังเข้าสู่ระบบ...</span>
              </span>
            ) : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">วิธีเข้าสู่ระบบ</p>
          <p>สมาชิกโครงการ: ใช้ <code className="bg-gray-100 px-1 rounded">u6711011553&lt;รหัส 3 หลัก&gt;@mail.dusit.ac.th</code> เป็นอีเมล และรหัส 3 หลักเดียวกันเป็นรหัสผ่าน</p>
          <p>เช่น รหัส 052 → อีเมล <code className="bg-gray-100 px-1 rounded">u6711011553052@mail.dusit.ac.th</code> รหัสผ่าน <code className="bg-gray-100 px-1 rounded">052</code></p>
        </div>
      </div>
    </div>
  )
}

export default Login
