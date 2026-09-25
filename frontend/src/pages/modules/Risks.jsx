import ModulePage from './ModulePage'
import DepartmentBadge from '../../components/DepartmentBadge'
import StatusBadge from '../../components/StatusBadge'
import { DEPARTMENTS, RISK_ISSUE_TYPES, IMPACT_LEVELS, LIKELIHOOD_LEVELS, RISK_ISSUE_STATUSES, toOptions, shortPersonLabel } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)
const userLabel = (u) => `${u.name}${u.nickname ? ` (${u.nickname})` : ''} · ${u.department || '-'}`

const fields = [
  { name: 'title', label: 'หัวข้อ', required: true },
  { name: 'type', label: 'ประเภท', type: 'select', options: toOptions(RISK_ISSUE_TYPES) },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'relatedTask', label: 'งานที่เกี่ยวข้อง', type: 'ref', optionsEndpoint: '/api/tasks', mapOption: (t) => ({ value: t._id, label: t.title }) },
  { name: 'impactLevel', label: 'ระดับผลกระทบ', type: 'select', options: toOptions(IMPACT_LEVELS) },
  { name: 'likelihoodLevel', label: 'ระดับโอกาสเกิด', type: 'select', options: toOptions(LIKELIHOOD_LEVELS) },
  { name: 'status', label: 'สถานะ', type: 'select', options: toOptions(RISK_ISSUE_STATUSES) },
  { name: 'owner', label: 'ผู้รับผิดชอบ', type: 'multiref', optionsEndpoint: '/api/users/directory?all=true', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
  { name: 'mitigation', label: 'แนวทางแก้ไข/ป้องกัน', type: 'textarea' },
]

const columns = [
  { key: 'title', label: 'หัวข้อ' },
  { key: 'type', label: 'ประเภท', render: (item) => <StatusBadge status={item.type} /> },
  { key: 'department', label: 'ฝ่าย', render: (item) => <DepartmentBadge department={item.department} /> },
  { key: 'impactLevel', label: 'ผลกระทบ', render: (item) => <StatusBadge status={item.impactLevel} /> },
  { key: 'likelihoodLevel', label: 'โอกาสเกิด', render: (item) => <StatusBadge status={item.likelihoodLevel} /> },
  { key: 'status', label: 'สถานะ', render: (item) => <StatusBadge status={item.status} /> },
  {
    key: 'owner',
    label: 'ผู้รับผิดชอบ',
    render: (item) =>
      item.owner?.length ? (
        <div className="flex flex-col gap-0.5">
          {item.owner.map((o) => <span key={o._id} className="text-sm whitespace-nowrap">{shortPersonLabel(o)}</span>)}
        </div>
      ) : '-',
  },
  { key: 'createdBy', label: 'ผู้สร้างรายการ', render: (item) => item.createdBy?.name || '-' },
]

const Risks = () => (
  <ModulePage
    title="ความเสี่ยง/ปัญหา (Risk & Issue)"
    showDeptScopeNote
    endpoint="/api/risks"
    fields={fields}
    columns={columns}
    searchKeys={['title', 'department']}
    filters={[
      { key: 'department', label: 'ฝ่าย', options: DEPARTMENTS },
      { key: 'type', label: 'ประเภท', options: RISK_ISSUE_TYPES },
      { key: 'status', label: 'สถานะ', options: RISK_ISSUE_STATUSES },
    ]}
    sorts={[{ key: 'createdAt', label: 'วันที่สร้าง', defaultDir: 'desc' }]}
  />
)

export default Risks
