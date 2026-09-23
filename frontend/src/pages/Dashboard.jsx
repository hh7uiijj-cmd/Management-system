import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import CircularProgress from '../components/CircularProgress'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const MiniStat = ({ label, value, sub, color = 'text-gray-800' }) => (
  <div className="card p-4">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
)

const EmptyRow = ({ children }) => (
  <p className="text-gray-500 text-sm text-center py-8">{children}</p>
)

const formatMoney = (n) =>
  (n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [tasks, setTasks] = useState([])
  const [documents, setDocuments] = useState([])
  const [letters, setLetters] = useState([])
  const [budgets, setBudgets] = useState([])
  const [risks, setRisks] = useState([])
  const [evidence, setEvidence] = useState([])
  const [registrationStats, setRegistrationStats] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empty = { data: [] }
        const [
          eventsRes,
          tasksRes,
          documentsRes,
          lettersRes,
          budgetsRes,
          risksRes,
          evidenceRes,
          regStatsRes,
        ] = await Promise.all([
          api.get('/api/events').catch(() => empty),
          api.get('/api/tasks').catch(() => empty),
          api.get('/api/documents').catch(() => empty),
          api.get('/api/letters').catch(() => empty),
          api.get('/api/budgets').catch(() => empty),
          api.get('/api/risks').catch(() => empty),
          api.get('/api/evidence').catch(() => empty),
          api.get('/api/registrations/stats').catch(() => ({ data: null })),
        ])

        setRecentEvents(eventsRes.data.slice(0, 5))
        setTasks(tasksRes.data)
        setDocuments(documentsRes.data)
        setLetters(lettersRes.data)
        setBudgets(budgetsRes.data)
        setRisks(risksRes.data)
        setEvidence(evidenceRes.data)
        setRegistrationStats(regStatsRes.data)
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

  const totalTasks = tasks.length
  const inProgressTasks = tasks.filter((t) => t.status === 'กำลังดำเนินการ').length
  const overdueTasks = tasks.filter(isOverdue).length
  const upcomingTasks = tasks.filter(isUpcoming3d)
  const completedTasks = tasks.filter(isDone).length

  const evidenceTaskIds = new Set(
    evidence.map((e) => (typeof e.relatedTask === 'object' ? e.relatedTask?._id : e.relatedTask))
  )
  const tasksMissingEvidence = tasks.filter((t) => isDone(t) && !evidenceTaskIds.has(t._id)).length

  const pendingDocuments = documents.filter((d) =>
    ['รอตรวจสอบ', 'รอผู้บริหารอนุมัติ'].includes(d.approvalStatus)
  )
  const pendingLetters = letters.filter((l) => l.status === 'รอตอบรับ')
  const openRisks = risks.filter((r) => r.status !== 'ปิดเรื่อง')

  const totalInitialBudget = budgets.reduce((sum, b) => sum + (b.initialBudget || 0), 0)
  const totalActualCost = budgets.reduce((sum, b) => sum + (b.actualCost || 0), 0)

  const urgentTasks = [...upcomingTasks, ...tasks.filter(isOverdue)]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5)

  const teamStatus = Object.values(
    tasks.reduce((acc, t) => {
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

  const statusLabel = { active: 'เปิดรับสมัคร', closed: 'ปิดรับสมัคร', cancelled: 'ยกเลิก' }
  const statusClass = { active: 'badge-active', closed: 'badge-closed', cancelled: 'badge-cancelled' }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ด</h1>
            <p className="text-gray-500 mt-1">ยินดีต้อนรับ, {user?.name}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* PROJECT OVERVIEW */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <MiniStat label="งานทั้งหมด" value={totalTasks} />
                <MiniStat label="กำลังดำเนินการ" value={inProgressTasks} color="text-blue-600" />
                <MiniStat label="ล่าช้า / เลยกำหนด" value={overdueTasks} color="text-red-600" />
                <MiniStat label="ใกล้ถึงกำหนด 0-3 วัน" value={upcomingTasks.length} color="text-orange-600" />
                <MiniStat label="งานเสร็จสิ้น" value={completedTasks} color="text-green-600" />
                <MiniStat label="เอกสารรออนุมัติ" value={pendingDocuments.length} color="text-purple-600" />
                <MiniStat label="หนังสือรอตอบรับ" value={pendingLetters.length} color="text-purple-600" />
                <MiniStat label="ปัญหา/ความเสี่ยงค้าง" value={openRisks.length} color="text-red-600" />
                <MiniStat label="งานเสร็จแต่ขาดหลักฐาน" value={tasksMissingEvidence} color="text-yellow-600" />
                <MiniStat
                  label="งบประมาณตั้งต้นรวม"
                  value={`${formatMoney(totalInitialBudget)} บาท`}
                  color="text-blue-600"
                />
                <MiniStat
                  label="ค่าใช้จ่ายจริงรวม"
                  value={`${formatMoney(totalActualCost)} บาท`}
                  color="text-red-600"
                />
                {registrationStats && (
                  <>
                    <MiniStat label="ผู้ลงทะเบียนรวม" value={registrationStats.total} color="text-blue-600" />
                    <MiniStat label="เช็คอินแล้ว" value={registrationStats.checkedIn} color="text-green-600" />
                  </>
                )}
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
                            <p className="text-sm text-gray-500">{task.department}</p>
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
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
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
                            <p className="text-sm text-gray-500">{doc.department}</p>
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
                            <p className="text-sm text-gray-500">{risk.department} · ผลกระทบ {risk.impactLevel}</p>
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
                            <td className="py-3 pr-4 font-medium text-gray-800">{row.department}</td>
                            <td className="py-3 px-4">{row.total}</td>
                            <td className="py-3 px-4 text-blue-600">{row.inProgress}</td>
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

              {/* กิจกรรมล่าสุด */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">กิจกรรมล่าสุด</h2>
                  <Link to="/events" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    ดูทั้งหมด →
                  </Link>
                </div>
                {recentEvents.length === 0 ? (
                  <EmptyRow>ยังไม่มีกิจกรรม</EmptyRow>
                ) : (
                  <div className="space-y-3">
                    {recentEvents.map((event) => (
                      <Link
                        key={event._id}
                        to={`/events/${event._id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{event.title}</p>
                          <p className="text-sm text-gray-500">{formatDate(event.date)} · {event.location || 'ไม่ระบุสถานที่'}</p>
                        </div>
                        <span className={statusClass[event.status] || 'badge-closed'}>
                          {statusLabel[event.status] || event.status}
                        </span>
                      </Link>
                    ))}
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
