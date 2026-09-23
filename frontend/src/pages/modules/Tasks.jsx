import ModulePage from './ModulePage'
import { DEPARTMENTS, TASK_STATUSES, TASK_PRIORITIES, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)

const fields = [
  { name: 'title', label: 'ชื่องาน', required: true },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'mainAssignee', label: 'ผู้รับผิดชอบหลัก', type: 'ref', optionsEndpoint: '/api/users/directory', mapOption: (u) => ({ value: u._id, label: `${u.name} (${u.department || '-'})` }), required: true },
  { name: 'coAssignees', label: 'ผู้รับผิดชอบร่วม', type: 'multiref', optionsEndpoint: '/api/users/directory', mapOption: (u) => ({ value: u._id, label: u.name }) },
  { name: 'deadline', label: 'กำหนดส่ง', type: 'date', required: true },
  { name: 'status', label: 'สถานะ', type: 'select', options: toOptions(TASK_STATUSES) },
  { name: 'priority', label: 'ความสำคัญ', type: 'select', options: toOptions(TASK_PRIORITIES) },
  { name: 'description', label: 'รายละเอียด', type: 'textarea' },
]

const columns = [
  { key: 'title', label: 'ชื่องาน' },
  { key: 'department', label: 'ฝ่าย' },
  { key: 'mainAssignee', label: 'ผู้รับผิดชอบหลัก', render: (item) => item.mainAssignee?.name || '-' },
  { key: 'deadline', label: 'กำหนดส่ง', render: (item) => item.deadline ? new Date(item.deadline).toLocaleDateString('th-TH') : '-' },
  { key: 'status', label: 'สถานะ' },
  { key: 'priority', label: 'ความสำคัญ' },
]

const Tasks = () => (
  <ModulePage
    title="งาน (Task Master)"
    endpoint="/api/tasks"
    fields={fields}
    columns={columns}
  />
)

export default Tasks
