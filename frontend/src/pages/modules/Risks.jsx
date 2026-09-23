import ModulePage from './ModulePage'
import { DEPARTMENTS, RISK_ISSUE_TYPES, IMPACT_LEVELS, LIKELIHOOD_LEVELS, RISK_ISSUE_STATUSES, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)

const fields = [
  { name: 'title', label: 'หัวข้อ', required: true },
  { name: 'type', label: 'ประเภท', type: 'select', options: toOptions(RISK_ISSUE_TYPES) },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'relatedTask', label: 'งานที่เกี่ยวข้อง', type: 'ref', optionsEndpoint: '/api/tasks', mapOption: (t) => ({ value: t._id, label: t.title }) },
  { name: 'impactLevel', label: 'ระดับผลกระทบ', type: 'select', options: toOptions(IMPACT_LEVELS) },
  { name: 'likelihoodLevel', label: 'ระดับโอกาสเกิด', type: 'select', options: toOptions(LIKELIHOOD_LEVELS) },
  { name: 'status', label: 'สถานะ', type: 'select', options: toOptions(RISK_ISSUE_STATUSES) },
  { name: 'owner', label: 'ผู้รับผิดชอบ', type: 'ref', optionsEndpoint: '/api/users/directory', mapOption: (u) => ({ value: u._id, label: u.name }) },
  { name: 'mitigation', label: 'แนวทางแก้ไข/ป้องกัน', type: 'textarea' },
]

const columns = [
  { key: 'title', label: 'หัวข้อ' },
  { key: 'type', label: 'ประเภท' },
  { key: 'department', label: 'ฝ่าย' },
  { key: 'impactLevel', label: 'ผลกระทบ' },
  { key: 'likelihoodLevel', label: 'โอกาสเกิด' },
  { key: 'status', label: 'สถานะ' },
]

const Risks = () => (
  <ModulePage title="ความเสี่ยง/ปัญหา (Risk & Issue)" endpoint="/api/risks" fields={fields} columns={columns} />
)

export default Risks
