import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <span className="w-5 h-5 flex-shrink-0">{icon}</span>
    <span>{label}</span>
  </NavLink>
)

const Sidebar = () => {
  const { hasPermission } = useAuth()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-1">
        <NavItem
          to="/"
          label="แดชบอร์ด"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />
        <NavItem
          to="/events"
          label="กิจกรรมทั้งหมด"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <NavItem
          to="/my-registrations"
          label="การลงทะเบียนของฉัน"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        {hasPermission('approve_registrations') && (
          <NavItem
            to="/approval"
            label="อนุมัติการลงทะเบียน"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        )}
        {hasPermission('manage_events') && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">การจัดการ</p>
            </div>
            <NavItem
              to="/admin/events"
              label="จัดการกิจกรรม"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            />
          </>
        )}
        {hasPermission('manage_users') && (
          <NavItem
            to="/admin/users"
            label="จัดการผู้ใช้"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        )}
        {hasPermission('manage_roles') && (
          <NavItem
            to="/admin/roles"
            label="จัดการ Role"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
