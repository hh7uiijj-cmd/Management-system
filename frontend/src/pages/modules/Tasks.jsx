import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ModulePage from './ModulePage'
import DepartmentBadge from '../../components/DepartmentBadge'
import StatusBadge from '../../components/StatusBadge'
import { DEPARTMENTS, TASK_STATUSES, TASK_PRIORITIES, toOptions, shortPersonLabel } from '../../constants'

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

const formatDateTime = (d) => d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'

// แสดงรายการงานที่แต่ละคนส่งแยกกัน (ไม่ทับกัน) พร้อมชื่อผู้ส่งและเวลา — กดเพื่อดูรายละเอียดทั้งหมดเป็น modal กลางจอ
const SubmissionsCell = ({ submissions }) => {
  const [open, setOpen] = useState(false)
  if (!submissions?.length) return <span className="text-gray-400">-</span>
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 whitespace-nowrap"
      >
        ดูงานที่ส่ง ({submissions.length})
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md p-4 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">งานที่ส่งแล้ว ({submissions.length})</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            {submissions.map((s, i) => (
              <div key={i} className="text-xs border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                <p className="font-medium text-gray-700">{shortPersonLabel(s.submittedBy)}</p>
                <p className="text-gray-400">{formatDateTime(s.submittedAt)}</p>
                {s.link && (
                  <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline block truncate">
                    เปิดลิงก์งาน ↗
                  </a>
                )}
                {s.text && <p className="text-gray-600 mt-0.5 whitespace-pre-wrap">{s.text}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

const columns = [
  { key: 'title', label: 'ชื่องาน' },
  { key: 'department', label: 'ฝ่าย', render: (item) => <DepartmentBadge department={item.department} /> },
  { key: 'mainAssignee', label: 'ผู้รับผิดชอบหลัก', render: (item) => shortPersonLabel(item.mainAssignee) },
  { key: 'createdBy', label: 'ผู้มอบหมาย', render: (item) => <span className="text-xs text-gray-400">{shortPersonLabel(item.createdBy)}</span> },
  {
    key: 'reviewers',
    label: 'ผู้อนุมัติ',
    render: (item) =>
      item.reviewers?.length ? (
        <div className="flex flex-col gap-0.5">
          {item.reviewers.map((r) => <span key={r._id} className="text-sm whitespace-nowrap">{shortPersonLabel(r)}</span>)}
        </div>
      ) : '-',
  },
  { key: 'startDate', label: 'วันที่เริ่ม', render: (item) => item.startDate ? new Date(item.startDate).toLocaleDateString('th-TH') : '-' },
  { key: 'deadline', label: 'กำหนดส่ง', render: (item) => item.deadline ? new Date(item.deadline).toLocaleDateString('th-TH') : '-' },
  { key: 'status', label: 'สถานะ', render: (item) => <StatusBadge status={item.status} /> },
  { key: 'priority', label: 'ความสำคัญ', render: (item) => <StatusBadge status={item.priority} /> },
  { key: 'submissions', label: 'งานที่ส่ง', render: (item) => <SubmissionsCell submissions={item.submissions} /> },
  {
    key: 'rejectionReason',
    label: 'ตีกลับแก้ไข',
    render: (item) =>
      item.rejectionReason?.trim() ? (
        <div className="max-w-xs">
          <p className="text-xs font-medium text-amber-600">ต้องแก้ไข:</p>
          <p className="text-xs text-amber-700 whitespace-pre-wrap">{item.rejectionReason}</p>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
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
const myPendingApproval = (item, user) => isReviewer(item, user) && item.status === 'รอตรวจสอบ'
const isOverdue = (item) => !['เสร็จสิ้น', 'ยกเลิก'].includes(item.status) && item.deadline && new Date(item.deadline) < new Date()
// แจ้งเตือนเฉพาะผู้รับผิดชอบหลัก/ร่วม (คนที่ต้องแก้ไขงานจริง) ไม่รวมผู้อนุมัติที่เป็นคนตีกลับเอง
const isResponsibleFor = (item, user) => {
  const uid = String(user?._id)
  return idOf(item.mainAssignee) === uid || (item.coAssignees || []).some((c) => idOf(c) === uid)
}
const needsRevision = (item, user) => isResponsibleFor(item, user) && !!item.rejectionReason?.trim()
const needsMyAttention = (item, user) =>
  (isAssignedToTask(item, user) && isOverdue(item)) || myPendingApproval(item, user) || needsRevision(item, user)

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

const Tasks = () => {
  const [searchParams] = useSearchParams()
  const attentionOnly = searchParams.get('attention') === '1'

  return (
    <ModulePage
      title="งาน (Task Master)"
      subtitle={
        attentionOnly
          ? 'แสดงเฉพาะงานที่ต้องติดตาม: ล่าช้าและมอบหมายให้คุณ หรือรอการอนุมัติจากคุณ'
          : 'ติดตามงานแต่ละชิ้นแบบละเอียด มีกำหนดส่ง สถานะ การส่งงาน และอนุมัติงานได้'
      }
      endpoint="/api/tasks"
      fields={fields}
      columns={columns}
      canEditItemFn={canEditTaskItem}
      canDeleteItemFn={canDeleteTaskItem}
      enableCardView
      extraFilterFn={attentionOnly ? needsMyAttention : undefined}
      canApprove
      approveField="status"
      approveMode="button"
      approveTriggerValue="รอตรวจสอบ"
      approveTargetValue="เสร็จสิ้น"
      approveButtonLabel="อนุมัติงาน"
      approveGateFn={(item) => item.submissions?.length > 0}
      rejectTargetValue="กำลังดำเนินการ"
      rejectButtonLabel="ตีกลับแก้ไข"
      rejectReasonField="rejectionReason"
      canApproveItem={(item, user) => isTopTier(user) || isReviewer(item, user) || (isDeptLead(user) && item.department === user.department)}
      submitAction={{
        label: 'ส่งงาน',
        formTitle: 'ส่งงาน',
        endpointSuffix: 'submit',
        successMessage: 'ส่งงานสำเร็จ รอผู้อนุมัติตรวจสอบ',
        visible: (item, user) => isTopTier(user) || isDeptLead(user) || isAssignedToTask(item, user),
        getInitialValues: (item, user) => {
          const mine = (item.submissions || []).find((s) => idOf(s.submittedBy) === String(user?._id))
          return { submissionLink: mine?.link || '', submissionText: mine?.text || '' }
        },
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
        { key: 'mainAssignee', label: 'ผู้รับผิดชอบหลัก', searchable: true, optionsEndpoint: '/api/users/directory?all=true', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
        { key: 'coAssignees', label: 'ผู้รับผิดชอบร่วม', searchable: true, optionsEndpoint: '/api/users/directory?all=true', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
      ]}
      sorts={[
        { key: 'deadline', label: 'กำหนดส่ง', defaultDir: 'asc' },
        { key: 'title', label: 'ชื่องาน', defaultDir: 'asc' },
        { key: 'priority', label: 'ความสำคัญ', defaultDir: 'desc' },
      ]}
    />
  )
}

export default Tasks
