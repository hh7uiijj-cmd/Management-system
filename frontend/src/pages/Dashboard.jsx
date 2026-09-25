import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import CircularProgress from '../components/CircularProgress'
import DepartmentBadge from '../components/DepartmentBadge'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { DEPARTMENTS } from '../constants'

const TONES = {
  purple: { bg: 'bg-gradient-to-br from-indigo-50 to-purple-50', iconBg: 'bg-indigo-500', text: 'text-indigo-700' },
  blue: { bg: 'bg-gradient-to-br from-sky-50 to-blue-50', iconBg: 'bg-blue-500', text: 'text-blue-700' },
  green: { bg: 'bg-gradient-to-br from-emerald-50 to-green-50', iconBg: 'bg-emerald-500', text: 'text-emerald-700' },
  amber: { bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', iconBg: 'bg-amber-500', text: 'text-amber-700' },
  rose: { bg: 'bg-gradient-to-br from-rose-50 to-pink-50', iconBg: 'bg-rose-500', text: 'text-rose-700' },
  gray: { bg: 'bg-white', iconBg: 'bg-gray-400', text: 'text-gray-800' },
}

const MiniStat = ({ label, value, sub, tone = 'gray', icon }) => {
  const t = TONES[tone] || TONES.gray
  return (
    <div className={`card p-4 ${t.bg} border-0`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className={`text-xl font-bold mt-1 break-words ${t.text}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-xl ${t.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

const iconClass = 'w-4.5 h-4.5 text-white'
const Icons = {
  list: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  clock: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  flag: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V4a1 1 0 011-1h11l-1 5 1 5H5a1 1 0 01-1-1z" />
    </svg>
  ),
  check: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  bell: (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
}

const EmptyRow = ({ children }) => (
  <p className="text-gray-500 text-sm text-center py-8">{children}</p>
)

const formatMoney = (n) => (n || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const Dashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [tasks, setTasks] = useState([])
  const [documents, setDocuments] = useState([])
  const [letters, setLetters] = useState([])
  const [budgets, setBudgets] = useState([])
  const [risks, setRisks] = useState([])
  const [evidence, setEvidence] = useState([])
  const [masterTaskList, setMasterTaskList] = useState([])
  const [recentCompletedTasks, setRecentCompletedTasks] = useState([])
  const [selectedDept, setSelectedDept] = useState('all')

  const isTopTier = ['admin', 'president', 'vice_president'].includes(user?.role?.name)
  const filterByDept = (arr) => (selectedDept === 'all' ? arr : arr.filter((x) => x.department === selectedDept))

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empty = { data: [] }
        const [
          tasksRes,
          documentsRes,
          lettersRes,
          budgetsRes,
          risksRes,
          evidenceRes,
          masterTaskListRes,
          recentCompletedRes,
        ] = await Promise.all([
          api.get('/api/tasks').catch(() => empty),
          api.get('/api/documents').catch(() => empty),
          api.get('/api/letters').catch(() => empty),
          api.get('/api/budgets').catch(() => empty),
          api.get('/api/risks').catch(() => empty),
          api.get('/api/evidence').catch(() => empty),
          api.get('/api/master-task-list').catch(() => empty),
          api.get('/api/tasks/recent-completed').catch(() => empty),
        ])

        setTasks(tasksRes.data)
        setDocuments(documentsRes.data)
        setLetters(lettersRes.data)
        setBudgets(budgetsRes.data)
        setRisks(risksRes.data)
        setEvidence(evidenceRes.data)
        setMasterTaskList(masterTaskListRes.data)
        setRecentCompletedTasks(recentCompletedRes.data)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const isDone = (t) => t.status === 'เสร็จสิ้น'
  const isCancelled = (t) => t.status === 'ยกเลิก'
  const isOverdue = (t) =>
    !isDone(t) && !isCancelled(t) && t.deadline && new Date(t.deadline) < now
  const isUpcoming3d = (t) =>
    !isDone(t) && !isCancelled(t) && !isOverdue(t) && t.deadline && new Date(t.deadline) <= in3Days

  const tasks_ = filterByDept(tasks)
  const documents_ = filterByDept(documents)
  const letters_ = filterByDept(letters)
  const budgets_ = filterByDept(budgets)
  const risks_ = filterByDept(risks)
  const evidence_ = filterByDept(evidence)
  const masterTaskList_ = filterByDept(masterTaskList)
  const recentCompletedTasks_ = filterByDept(recentCompletedTasks)

  const totalTasks = tasks_.length
  const inProgressTasks = tasks_.filter((t) => t.status === 'กำลังดำเนินการ').length
  const overdueTasks = tasks_.filter(isOverdue).length
  const upcomingTasks = tasks_.filter(isUpcoming3d)
  const completedTasks = tasks_.filter(isDone).length

  const evidenceTaskIds = new Set(
    evidence_.map((e) => (typeof e.relatedTask === 'object' ? e.relatedTask?._id : e.relatedTask))
  )
  const tasksMissingEvidence = tasks_.filter((t) => isDone(t) && !evidenceTaskIds.has(t._id)).length

  const pendingDocuments = documents_.filter((d) =>
    ['รอตรวจสอบ', 'รอผู้บริหารอนุมัติ'].includes(d.approvalStatus)
  )
  const pendingLetters = letters_.filter((l) => l.status === 'รอตอบรับ')
  const openRisks = risks_.filter((r) => r.status !== 'ปิดเรื่อง')

  const totalInitialBudget = budgets_.reduce((sum, b) => sum + (b.initialBudget || 0), 0)
  const totalActualCost = budgets_.reduce((sum, b) => sum + (b.actualCost || 0), 0)

  const masterTaskListMissingOwner = masterTaskList_.filter((m) => !m.responsible?.length).length

  const urgentTasks = [...upcomingTasks, ...tasks_.filter(isOverdue)]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)

  const teamStatus = Object.values(
    tasks_.reduce((acc, t) => {
      const dept = t.department || 'ไม่ระบุฝ่าย'
      if (!acc[dept]) {
        acc[dept] = { department: dept, total: 0, inProgress: 0, completed: 0, overdue: 0 }
      }
      acc[dept].total += 1
      if (t.status === 'กำลังดำเนินการ') acc[dept].inProgress += 1
      if (isDone(t)) acc[dept].completed += 1
      if (isOverdue(t)) acc[dept].overdue += 1
      return acc
    }, {})
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ด</h1>
              <p className="text-gray-500 mt-1">ยินดีต้อนรับ, {user?.name}</p>
              <p className="text-xs text-indigo-500 mt-1">
                {!isTopTier
                  ? `ตัวเลขสรุปด้านล่างนับเฉพาะ "${user?.department || 'ฝ่ายของคุณ'}" ยกเว้นการ์ด "งานที่เสร็จล่าสุด" ที่แสดงทุกฝ่ายเสมอ`
                  : selectedDept === 'all'
                    ? 'กำลังดูข้อมูลรวมทั้งโครงการ (ทุกฝ่าย)'
                    : `กำลังดูข้อมูลเฉพาะ "${selectedDept}" (การ์ด "งานที่เสร็จล่าสุด" ก็กรองตามนี้ด้วย)`}
              </p>
            </div>
            {isTopTier && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">มุมมองแดชบอร์ด</label>
                <select
                  className="input-field"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="all">รวมทั้งโครงการ</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>แยกฝ่าย: {d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* PROJECT OVERVIEW */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <MiniStat label="งานทั้งหมด" value={totalTasks} tone="purple" icon={Icons.list} />
                <MiniStat label="กำลังดำเนินการ" value={inProgressTasks} tone="blue" icon={Icons.clock} />
                <MiniStat label="ล่าช้า / เลยกำหนด" value={overdueTasks} tone="rose" icon={Icons.flag} />
                <MiniStat label="ใกล้ถึงกำหนด 0-3 วัน" value={upcomingTasks.length} tone="amber" icon={Icons.bell} />
                <MiniStat label="งานเสร็จสิ้น" value={completedTasks} tone="green" icon={Icons.check} />
                <MiniStat label="เอกสารรออนุมัติ" value={pendingDocuments.length} sub={!isTopTier ? 'ทุกฝ่าย' : undefined} tone="purple" />
                <MiniStat label="หนังสือรอตอบรับ" value={pendingLetters.length} tone="purple" />
                <MiniStat label="ปัญหา/ความเสี่ยงค้าง" value={openRisks.length} tone="rose" />
                <MiniStat label="งานเสร็จแต่ขาดหลักฐาน" value={tasksMissingEvidence} tone="amber" />
                <MiniStat
                  label="งบประมาณตั้งต้นรวม"
                  value={`${formatMoney(totalInitialBudget)} บาท`}
                  tone="blue"
                />
                <MiniStat
                  label="ค่าใช้จ่ายจริงรวม"
                  value={`${formatMoney(totalActualCost)} บาท`}
                  tone="rose"
                />
                <MiniStat label="Master Task List ยังไม่มีผู้รับผิดชอบ" value={masterTaskListMissingOwner} tone="amber" />
              </div>

              {/* PRIORITY + PROGRESS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">งานเร่งด่วน</h2>
                  <p className="text-sm text-gray-500 mb-4">งานที่ล่าช้าหรือใกล้ถึงกำหนดภายใน 3 วัน</p>
                  {urgentTasks.length === 0 ? (
                    <EmptyRow>ไม่มีงานเร่งด่วน</EmptyRow>
                  ) : (
                    <div className="space-y-2">
                      {urgentTasks.map((task) => (
                        <Link
                          key={task._id}
                          to="/tasks"
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{task.title}</p>
                            <div className="mt-1"><DepartmentBadge department={task.department} /></div>
                          </div>
                          <span className={`text-sm font-medium ${isOverdue(task) ? 'text-red-600' : 'text-orange-600'}`}>
                            {formatDate(task.deadline)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6 flex flex-col items-center justify-center">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 self-start">อัตราความสำเร็จของงาน</h2>
                  <CircularProgress percent={totalTasks ? (completedTasks / totalTasks) * 100 : 0} />
                  <div className="w-full mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">งานเสร็จสิ้น</span>
                      <span className="font-semibold text-gray-800">{completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">งานทั้งหมด</span>
                      <span className="font-semibold text-gray-800">{totalTasks}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* งานที่เสร็จล่าสุด — ทุกฝ่ายเห็นได้ ไม่จำกัดเฉพาะฝ่ายตัวเอง */}
              <div className="card p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">งานที่เสร็จล่าสุด</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {selectedDept === 'all' ? 'งานที่เพิ่งเสร็จสิ้นล่าสุดจากทุกฝ่าย' : `งานที่เพิ่งเสร็จสิ้นล่าสุดของ "${selectedDept}"`}
                </p>
                {recentCompletedTasks_.length === 0 ? (
                  <EmptyRow>ยังไม่มีงานที่เสร็จสิ้น</EmptyRow>
                ) : (
                  <div className="space-y-2">
                    {recentCompletedTasks_.map((task) => (
                      <Link
                        key={task._id}
                        to="/tasks"
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{task.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <DepartmentBadge department={task.department} />
                            <span className="text-xs text-gray-400">โดย {task.mainAssignee?.name || '-'}</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-green-600">{formatDate(task.updatedAt)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* DOCUMENTS + RISK CONTROL */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">เอกสารที่ต้องติดตาม</h2>
                  <p className="text-sm text-gray-500 mb-4">เอกสารที่รอตรวจสอบ/รอผู้บริหารอนุมัติ</p>
                  {pendingDocuments.length === 0 ? (
                    <EmptyRow>ไม่มีเอกสารที่ต้องติดตาม</EmptyRow>
                  ) : (
                    <div className="space-y-2">
                      {pendingDocuments.slice(0, 5).map((doc) => (
                        <Link
                          key={doc._id}
                          to="/documents"
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{doc.title}</p>
                            <div className="mt-1"><DepartmentBadge department={doc.department} /></div>
                          </div>
                          <span className="text-sm font-medium text-purple-600">{doc.approvalStatus}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">ความเสี่ยง / ประเด็นที่ต้องติดตาม</h2>
                  <p className="text-sm text-gray-500 mb-4">รายการที่ยังไม่ปิดเรื่อง</p>
                  {openRisks.length === 0 ? (
                    <EmptyRow>ไม่มีปัญหาหรือความเสี่ยงค้างที่คุณมีสิทธิ์มองเห็น</EmptyRow>
                  ) : (
                    <div className="space-y-2">
                      {openRisks.slice(0, 5).map((risk) => (
                        <Link
                          key={risk._id}
                          to="/risks"
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{risk.title}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <DepartmentBadge department={risk.department} />
                              <span className="text-xs text-gray-400">ผลกระทบ {risk.impactLevel}</span>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-red-600">{risk.status}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TEAM STATUS */}
              <div className="card p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">สรุปภาระงานตามฝ่าย</h2>
                <p className="text-sm text-gray-500 mb-4">เฉพาะฝ่ายที่คุณมีสิทธิ์มองเห็น</p>
                {teamStatus.length === 0 ? (
                  <EmptyRow>ยังไม่มีข้อมูลงาน</EmptyRow>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-100">
                          <th className="py-2 pr-4 font-medium">ฝ่าย</th>
                          <th className="py-2 px-4 font-medium">งานทั้งหมด</th>
                          <th className="py-2 px-4 font-medium">กำลังดำเนินการ</th>
                          <th className="py-2 px-4 font-medium">เสร็จสิ้น</th>
                          <th className="py-2 px-4 font-medium">ล่าช้า</th>
                          <th className="py-2 pl-4 font-medium">% สำเร็จ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamStatus.map((row) => (
                          <tr key={row.department} className="border-b border-gray-50 last:border-0">
                            <td className="py-3 pr-4"><DepartmentBadge department={row.department} /></td>
                            <td className="py-3 px-4">{row.total}</td>
                            <td className="py-3 px-4 text-indigo-600">{row.inProgress}</td>
                            <td className="py-3 px-4 text-green-600">{row.completed}</td>
                            <td className="py-3 px-4 text-red-600">{row.overdue}</td>
                            <td className="py-3 pl-4">
                              {row.total ? ((row.completed / row.total) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
