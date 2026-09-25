import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSidebar } from '../context/SidebarContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const idOf = (v) => String(v?._id || v)

const Navbar = () => {
  const { user, logout } = useAuth()
  const { toggle } = useSidebar()
  const navigate = useNavigate()

  const [attentionCount, setAttentionCount] = useState(0)

  useEffect(() => {
    if (!user) return
    api.get('/api/tasks')
      .then(({ data }) => {
        const uid = String(user._id)
        const now = new Date()
        const isMine = (t) =>
          idOf(t.mainAssignee) === uid || (t.coAssignees || []).some((c) => idOf(c) === uid)
        const isMyReviewPending = (t) =>
          (t.reviewers || []).some((r) => idOf(r) === uid) && t.status === 'รอตรวจสอบ'
        const isOverdue = (t) => !['เสร็จสิ้น', 'ยกเลิก'].includes(t.status) && t.deadline && new Date(t.deadline) < now
        const count = data.filter((t) => (isMine(t) && isOverdue(t)) || isMyReviewPending(t)).length
        setAttentionCount(count)
      })
      .catch(() => {})
  }, [user])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const timer = setTimeout(() => {
      api.get(`/api/search?q=${encodeURIComponent(q)}`)
        .then(({ data }) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const goToResult = (r) => {
    setShowResults(false)
    setQuery('')
    navigate(r.link)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={toggle}
            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-50 rounded-lg"
            aria-label="เปิด/ปิดเมนู"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex flex-col items-center justify-center shadow-sm shadow-indigo-200 leading-none flex-shrink-0">
            <span className="text-[10px] font-bold text-white/80">FT</span>
            <span className="text-base font-extrabold text-white -mt-0.5">20</span>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-lg font-extrabold text-gray-800">FT20 CONTROL CENTER</p>
            <p className="text-xs text-gray-400">ระบบบริหารโครงการแฟนพันธุ์แท้</p>
          </div>
        </div>

        <div className="flex-1 max-w-md hidden md:block relative" ref={boxRef}>
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              placeholder="ค้นหางาน, เอกสาร, หนังสือราชการ, สมาชิก..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            />
          </div>
          {showResults && query.trim().length >= 2 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto z-30">
              {searching ? (
                <p className="text-sm text-gray-400 px-4 py-3">กำลังค้นหา...</p>
              ) : results.length === 0 ? (
                <p className="text-sm text-gray-400 px-4 py-3">ไม่พบผลลัพธ์</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => goToResult(r)}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-gray-800 truncate">{r.label}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{r.typeLabel}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/tasks')}
            className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
            title="งานที่ต้องติดตาม (ล่าช้า / รออนุมัติจากคุณ)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {attentionCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {attentionCount > 9 ? '9+' : attentionCount}
              </span>
            )}
          </button>
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
