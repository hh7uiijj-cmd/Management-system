import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm shadow-indigo-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-800 hidden sm:block">ระบบจัดการกิจกรรม</span>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              disabled
              placeholder="ค้นหา..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm text-gray-500 placeholder:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
            {initials(user?.name) || '?'}
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</div>
            <div className="text-xs text-gray-400 leading-tight">{user?.role?.displayName}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden lg:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
