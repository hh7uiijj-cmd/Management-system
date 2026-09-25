import ModulePage from './ModulePage'
import DepartmentBadge from '../../components/DepartmentBadge'
import { DEPARTMENTS, toOptions, shortPersonLabel } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)
const isDeptLead = (user) => ['head', 'secretary'].includes(user?.role?.name)
const canManage = (user) => isTopTier(user) || isDeptLead(user)

const userLabel = (u) => `${u.name}${u.nickname ? ` (${u.nickname})` : ''} · ${u.department || '-'}`

const fields = [
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'no', label: 'No.', type: 'number' },
  { name: 'task', label: 'งาน/รายงาน', required: true },
  { name: 'responsible', label: 'ผู้รับผิดชอบ', type: 'multiref', optionsEndpoint: '/api/users/directory?all=true', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
  { name: 'supporters', label: 'ผู้สนับสนุน', type: 'multiref', optionsEndpoint: '/api/users/directory?all=true', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
]

const PeopleList = ({ list }) =>
  !list?.length ? (
    <span className="text-gray-400">-</span>
  ) : (
    <div className="flex flex-col gap-0.5">
      {list.map((u) => (
        <span key={u._id} className="text-sm whitespace-nowrap">{shortPersonLabel(u)}</span>
      ))}
    </div>
  )

const columns = [
  { key: 'no', label: 'No.', render: (item) => item.no ?? '-' },
  { key: 'department', label: 'ฝ่าย', render: (item) => <DepartmentBadge department={item.department} /> },
  { key: 'task', label: 'งาน/รายงาน' },
  { key: 'responsible', label: 'ผู้รับผิดชอบ', render: (item) => <PeopleList list={item.responsible} /> },
  { key: 'supporters', label: 'ผู้สนับสนุน', render: (item) => <PeopleList list={item.supporters} /> },
]

// หัวหน้า/เลขา/สมาชิก เห็นเฉพาะฝ่ายตัวเองอยู่แล้ว (server กรองมาให้) — ประธาน/รองประธาน/แอดมิน เห็นทุกฝ่าย
// จึงใส่ตัวกรองฝ่ายไว้ให้เลือกดูทีละฝ่ายได้
const MasterTaskList = () => (
  <ModulePage
    title="Master Task List"
    subtitle="ลิสต์งาน/รายงานภาพรวมของฝ่าย แบบสรุปสั้นๆ ไม่มีกำหนดส่ง/สถานะละเอียดแบบ Task Master"
    endpoint="/api/master-task-list"
    fields={fields}
    columns={columns}
    canCreate={canManage}
    canEditItemFn={(item, user) => isTopTier(user) || (isDeptLead(user) && item.department === user.department)}
    canDeleteItemFn={(item, user) => isTopTier(user) || (isDeptLead(user) && item.department === user.department)}
    searchKeys={['task']}
    filters={[{ key: 'department', label: 'ฝ่าย', options: DEPARTMENTS }]}
    sorts={[{ key: 'no', label: 'No.', defaultDir: 'asc' }]}
  />
)

export default MasterTaskList
