import ModulePage from './ModulePage'
import { DEPARTMENTS, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)

const fields = [
  { name: 'relatedTask', label: 'งานที่เกี่ยวข้อง', type: 'ref', optionsEndpoint: '/api/tasks', mapOption: (t) => ({ value: t._id, label: t.title }), required: true },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'description', label: 'รายละเอียดหลักฐาน', type: 'textarea' },
  { name: 'fileUrl', label: 'ลิงก์ไฟล์หลักฐาน' },
]

const columns = [
  { key: 'relatedTask', label: 'งานที่เกี่ยวข้อง', render: (item) => item.relatedTask?.title || '-' },
  { key: 'department', label: 'ฝ่าย' },
  { key: 'description', label: 'รายละเอียด' },
  { key: 'uploadedBy', label: 'ผู้อัปโหลด', render: (item) => item.uploadedBy?.name || '-' },
]

const EvidencePage = () => (
  <ModulePage title="หลักฐาน (Evidence)" endpoint="/api/evidence" fields={fields} columns={columns} ownerField="uploadedBy" allowEdit={false} />
)

export default EvidencePage
