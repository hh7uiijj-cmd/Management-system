import ModulePage from './ModulePage'
import DepartmentBadge from '../../components/DepartmentBadge'
import StatusBadge from '../../components/StatusBadge'
import { DEPARTMENTS, TASK_STATUSES, TASK_PRIORITIES, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)

const userLabel = (u) => `${u.name}${u.nickname ? ` (${u.nickname})` : ''} · ${u.department || '-'}`

const fields = [
  { name: 'title', label: 'ชื่องาน', required: true },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'mainAssignee', label: 'ผู้รับผิดชอบหลัก', type: 'searchref', optionsEndpoint: '/api/users/directory', mapOption: (u) => ({ value: u._id, label: userLabel(u) }), required: true },
  { name: 'coAssignees', label: 'ผู้รับผิดชอบร่วม', type: 'multiref', optionsEndpoint: '/api/users/directory', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
  { name: 'reviewers', label: 'ผู้อนุมัติ (Reviewer)', type: 'multiref', optionsEndpoint: '/api/users/directory?all=true', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
  { name: 'startDate', label: 'วันที่เริ่ม (Start)', type: 'date' },
  { name: 'deadline', label: 'กำหนดส่ง', type: 'date', required: true },
  { name: 'status', label: 'สถานะ', type: 'select', options: toOptions(TASK_STATUSES) },
  { name: 'priority', label: 'ความสำคัญ', type: 'select', options: toOptions(TASK_PRIORITIES) },
  { name: 'description', label: 'รายละเอียด', type: 'textarea' },
]

const columns = [
  { key: 'title', label: 'ชื่องาน' },
  { key: 'department', label: 'ฝ่าย', render: (item) => <DepartmentBadge department={item.department} /> },
  { key: 'mainAssignee', label: 'ผู้รับผิดชอบหลัก', render: (item) => item.mainAssignee?.name || '-' },
  { key: 'reviewers', label: 'ผู้อนุมัติ', render: (item) => (item.reviewers?.length ? item.reviewers.map((r) => r.name).join(', ') : '-') },
  { key: 'startDate', label: 'วันที่เริ่ม', render: (item) => item.startDate ? new Date(item.startDate).toLocaleDateString('th-TH') : '-' },
  { key: 'deadline', label: 'กำหนดส่ง', render: (item) => item.deadline ? new Date(item.deadline).toLocaleDateString('th-TH') : '-' },
  { key: 'status', label: 'สถานะ', render: (item) => <StatusBadge status={item.status} /> },
  { key: 'priority', label: 'ความสำคัญ', render: (item) => <StatusBadge status={item.priority} /> },
]

const isReviewer = (item, user) =>
  (item.reviewers || []).some((r) => String(r?._id || r) === String(user?._id))

const Tasks = () => (
  <ModulePage
    title="งาน (Task Master)"
    endpoint="/api/tasks"
    fields={fields}
    columns={columns}
    canApprove
    approveField="status"
    approveMode="button"
    approveTriggerValue="รอตรวจสอบ"
    approveTargetValue="เสร็จสิ้น"
    approveButtonLabel="อนุมัติงาน"
    canApproveItem={(item, user) => isTopTier(user) || isReviewer(item, user)}
  />
)

export default Tasks
