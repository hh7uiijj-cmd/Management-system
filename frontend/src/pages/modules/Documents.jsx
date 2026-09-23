import ModulePage from './ModulePage'
import { DEPARTMENTS, DOCUMENT_CATEGORIES, DOCUMENT_APPROVAL_STATUSES, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)

const fields = [
  { name: 'title', label: 'ชื่อเอกสาร', required: true },
  { name: 'category', label: 'หมวดหมู่', type: 'select', options: toOptions(DOCUMENT_CATEGORIES), required: true },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'relatedTask', label: 'งานที่เกี่ยวข้อง', type: 'ref', optionsEndpoint: '/api/tasks', mapOption: (t) => ({ value: t._id, label: t.title }) },
  { name: 'fileUrl', label: 'ลิงก์ไฟล์เอกสาร' },
]

const columns = [
  { key: 'title', label: 'ชื่อเอกสาร' },
  { key: 'category', label: 'หมวดหมู่' },
  { key: 'department', label: 'ฝ่าย' },
  { key: 'approvalStatus', label: 'สถานะอนุมัติ' },
  { key: 'uploadedBy', label: 'ผู้อัปโหลด', render: (item) => item.uploadedBy?.name || '-' },
]

const Documents = () => (
  <ModulePage
    title="เอกสาร (Document)"
    endpoint="/api/documents"
    fields={fields}
    columns={columns}
    ownerField="uploadedBy"
    canApprove
    approveField="approvalStatus"
    approveOptions={DOCUMENT_APPROVAL_STATUSES}
    searchKeys={['title', 'department']}
    filters={[
      { key: 'category', label: 'หมวดหมู่', options: DOCUMENT_CATEGORIES },
      { key: 'approvalStatus', label: 'สถานะ', options: DOCUMENT_APPROVAL_STATUSES },
    ]}
    sorts={[
      { key: 'createdAt', label: 'วันที่สร้าง', defaultDir: 'desc' },
      { key: 'title', label: 'ชื่อเอกสาร', defaultDir: 'asc' },
    ]}
  />
)

export default Documents
