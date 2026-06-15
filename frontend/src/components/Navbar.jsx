import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <svg className="w-7 h-7 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xl font-bold">ระบบจัดการกิจกรรม</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs text-blue-200">{user?.role?.displayName}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-blue-800 hover:bg-blue-900 px-3 py-1.5 rounded-lg text-sm transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
