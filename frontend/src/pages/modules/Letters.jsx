import ModulePage from './ModulePage'
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
  { name: 'fileUrl', label: 'ลิงก์ไฟล์หนังสือ' },
]

const columns = [
  { key: 'letterNumber', label: 'เลขที่หนังสือ' },
  { key: 'subject', label: 'เรื่อง' },
  { key: 'department', label: 'ฝ่าย' },
  { key: 'sentTo', label: 'ส่งถึง' },
  { key: 'status', label: 'สถานะ' },
  { key: 'dueDate', label: 'กำหนดตอบกลับ', render: (item) => item.dueDate ? new Date(item.dueDate).toLocaleDateString('th-TH') : '-' },
]

const Letters = () => (
  <ModulePage
    title="หนังสือราชการ (Letter Tracker)"
    endpoint="/api/letters"
    fields={fields}
    columns={columns}
    searchKeys={['letterNumber', 'subject', 'sentTo', 'department']}
    filters={[{ key: 'status', label: 'สถานะตอบกลับ', options: LETTER_STATUSES }]}
    sorts={[
      { key: 'dueDate', label: 'กำหนดตอบกลับ', defaultDir: 'asc' },
      { key: 'createdAt', label: 'วันที่หนังสือ', defaultDir: 'desc' },
    ]}
  />
)

export default Letters
