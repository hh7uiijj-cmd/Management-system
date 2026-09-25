import ModulePage from './ModulePage'
import DepartmentBadge from '../../components/DepartmentBadge'
import StatusBadge from '../../components/StatusBadge'
import { DEPARTMENTS, TASK_STATUSES, TASK_PRIORITIES, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)
const isDeptLead = (user) => ['head', 'secretary'].includes(user?.role?.name)

const userLabel = (u) => `${u.name}${u.nickname ? ` (${u.nickname})` : ''} · ${u.department || '-'}`

// หัวหน้า/เลขา (และระดับบริหาร) เลือกผู้รับผิดชอบร่วมได้ทุกฝ่าย ส่วนสมาชิกทั่วไปเลือกได้เฉพาะฝ่ายตัวเอง
const coAssigneesEndpoint = (user) =>
  isTopTier(user) || isDeptLead(user) ? '/api/users/directory?all=true' : '/api/users/directory'

const fields = [
  { name: 'title', label: 'ชื่องาน', required: true },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'mainAssignee', label: 'ผู้รับผิดชอบหลัก', type: 'searchref', optionsEndpoint: '/api/users/directory', mapOption: (u) => ({ value: u._id, label: userLabel(u) }), required: true },
  { name: 'coAssignees', label: 'ผู้รับผิดชอบร่วม', type: 'multiref', optionsEndpoint: coAssigneesEndpoint, mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
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
  {
    key: 'submission',
    label: 'งานที่ส่ง',
    render: (item) =>
      !item.submissionLink && !item.submissionText ? (
        <span className="text-gray-400">-</span>
      ) : (
        <div className="space-y-0.5 max-w-xs">
          {item.submissionLink && (
            <a
              href={item.submissionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium underline block truncate"
            >
              เปิดลิงก์งาน ↗
            </a>
          )}
          {item.submissionText && (
            <p className="text-xs text-gray-500 truncate" title={item.submissionText}>{item.submissionText}</p>
          )}
        </div>
      ),
  },
]

const idOf = (v) => String(v?._id || v)
const isReviewer = (item, user) => (item.reviewers || []).some((r) => idOf(r) === String(user?._id))
const isAssignedToTask = (item, user) => {
  const uid = String(user?._id)
  return (
    idOf(item.mainAssignee) === uid ||
    (item.coAssignees || []).some((c) => idOf(c) === uid) ||
    isReviewer(item, user)
  )
}

// ผู้รับผิดชอบหลัก/ร่วม/ผู้อนุมัติ ต้องแก้ไข (เช่น อัปเดตสถานะ) งานที่ตัวเองถูกมอบหมายได้เสมอ แม้คนละฝ่าย
const canEditTaskItem = (item, user) => {
  if (isTopTier(user)) return true
  if (isDeptLead(user) && item.department === user.department) return true
  if (idOf(item.createdBy) === String(user?._id)) return true
  return isAssignedToTask(item, user)
}

// ลบงานยังจำกัดเฉพาะผู้สร้าง/หัวหน้า-เลขาฝ่ายเจ้าของงาน/ระดับบริหารเท่านั้น
const canDeleteTaskItem = (item, user) => {
  if (isTopTier(user)) return true
  if (isDeptLead(user) && item.department === user.department) return true
  return idOf(item.createdBy) === String(user?._id)
}

const Tasks = () => (
  <ModulePage
    title="งาน (Task Master)"
    subtitle="ติดตามงานแต่ละชิ้นแบบละเอียด มีกำหนดส่ง สถานะ การส่งงาน และอนุมัติงานได้"
    endpoint="/api/tasks"
    fields={fields}
    columns={columns}
    canEditItemFn={canEditTaskItem}
    canDeleteItemFn={canDeleteTaskItem}
    canApprove
    approveField="status"
    approveMode="button"
    approveTriggerValue="รอตรวจสอบ"
    approveTargetValue="เสร็จสิ้น"
    approveButtonLabel="อนุมัติงาน"
    rejectTargetValue="กำลังดำเนินการ"
    rejectButtonLabel="ตีกลับแก้ไข"
    canApproveItem={(item, user) => isTopTier(user) || isReviewer(item, user)}
    submitAction={{
      label: 'ส่งงาน',
      formTitle: 'ส่งงาน',
      endpointSuffix: 'submit',
      successMessage: 'ส่งงานสำเร็จ รอผู้อนุมัติตรวจสอบ',
      visible: (item, user) => isTopTier(user) || isDeptLead(user) || isAssignedToTask(item, user),
      fields: [
        { name: 'submissionLink', label: 'ลิงก์ผลงาน (ถ้ามี)', type: 'url' },
        { name: 'submissionText', label: 'ข้อความ/รายละเอียดที่ส่ง', type: 'textarea' },
      ],
    }}
    searchKeys={['title', 'department', 'mainAssignee.name']}
    filters={[
      { key: 'department', label: 'ฝ่าย', options: DEPARTMENTS },
      { key: 'status', label: 'สถานะ', options: TASK_STATUSES },
      { key: 'priority', label: 'ความสำคัญ', options: TASK_PRIORITIES },
    ]}
    sorts={[
      { key: 'deadline', label: 'กำหนดส่ง', defaultDir: 'asc' },
      { key: 'title', label: 'ชื่องาน', defaultDir: 'asc' },
      { key: 'priority', label: 'ความสำคัญ', defaultDir: 'desc' },
    ]}
  />
)

export default Tasks
