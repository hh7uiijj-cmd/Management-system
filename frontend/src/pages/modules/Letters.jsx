import ModulePage from './ModulePage'
import DepartmentBadge from '../../components/DepartmentBadge'
import StatusBadge from '../../components/StatusBadge'
import { DEPARTMENTS, LETTER_STATUSES, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)

const fields = [
  { name: 'letterNumber', label: 'เลขที่หนังสือ', required: true },
  { name: 'subject', label: 'เรื่อง', required: true },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'sentTo', label: 'เรียน/ส่งถึง' },
  { name: 'sentDate', label: 'วันที่ส่ง', type: 'date' },
  { name: 'dueDate', label: 'กำหนดตอบกลับ', type: 'date' },
  { name: 'relatedTask', label: 'งานที่เกี่ยวข้อง', type: 'ref', optionsEndpoint: '/api/tasks', mapOption: (t) => ({ value: t._id, label: t.title }) },
  { name: 'status', label: 'สถานะ', type: 'select', options: toOptions(LETTER_STATUSES) },
  { name: 'fileUrl', label: 'ลิงก์ไฟล์หนังสือ', type: 'url' },
]

const columns = [
  { key: 'letterNumber', label: 'เลขที่หนังสือ' },
  { key: 'subject', label: 'เรื่อง' },
  { key: 'department', label: 'ฝ่าย', render: (item) => <DepartmentBadge department={item.department} /> },
  { key: 'sentTo', label: 'ส่งถึง' },
  { key: 'status', label: 'สถานะ', render: (item) => <StatusBadge status={item.status} /> },
  { key: 'dueDate', label: 'กำหนดตอบกลับ', render: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString('th-TH') : '-' },
  { key: 'createdBy', label: 'ผู้สร้างรายการ', render: (item) => item.createdBy?.name || '-' },
  {
    key: 'fileUrl',
    label: 'ไฟล์หนังสือ',
    render: (item) =>
      item.fileUrl?.trim() ? (
        <a
          href={item.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2.5 py-1 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 whitespace-nowrap inline-block"
        >
          เปิดไฟล์ ↗
        </a>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
]

const Letters = () => (
  <ModulePage
    title="หนังสือราชการ (Letter Tracker)"
    showDeptScopeNote
    deptScopedForNonTopTier={false}
    endpoint="/api/letters"
    fields={fields}
    columns={columns}
    searchKeys={['letterNumber', 'subject', 'sentTo', 'department']}
    filters={[
      { key: 'department', label: 'ฝ่าย', options: DEPARTMENTS },
      { key: 'status', label: 'สถานะตอบกลับ', options: LETTER_STATUSES },
    ]}
    sorts={[
      { key: 'dueDate', label: 'กำหนดตอบกลับ', defaultDir: 'asc' },
      { key: 'createdAt', label: 'วันที่หนังสือ', defaultDir: 'desc' },
    ]}
  />
)

export default Letters
