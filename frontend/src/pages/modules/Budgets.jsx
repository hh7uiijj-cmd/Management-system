import ModulePage from './ModulePage'
import DepartmentBadge from '../../components/DepartmentBadge'
import { DEPARTMENTS, BUDGET_CATEGORIES, toOptions } from '../../constants'

const isTopTier = (user) => ['admin', 'president', 'vice_president'].includes(user?.role?.name)

const fields = [
  { name: 'item', label: 'รายการ', required: true },
  { name: 'category', label: 'หมวดหมู่', type: 'select', options: toOptions(BUDGET_CATEGORIES) },
  { name: 'department', label: 'ฝ่าย', type: 'select', options: toOptions(DEPARTMENTS), visible: isTopTier, required: true },
  { name: 'relatedTask', label: 'งานที่เกี่ยวข้อง', type: 'ref', optionsEndpoint: '/api/tasks', mapOption: (t) => ({ value: t._id, label: t.title }) },
  { name: 'initialBudget', label: 'งบตั้งต้น (บาท)', type: 'number' },
  { name: 'estimatedCost', label: 'ประมาณการ (บาท)', type: 'number' },
  { name: 'actualCost', label: 'ค่าใช้จ่ายจริง (บาท)', type: 'number' },
  { name: 'note', label: 'หมายเหตุ', type: 'textarea' },
]

const fmt = (n) => (n || 0).toLocaleString('th-TH')

const columns = [
  { key: 'item', label: 'รายการ' },
  { key: 'department', label: 'ฝ่าย', render: (item) => <DepartmentBadge department={item.department} /> },
  { key: 'initialBudget', label: 'งบตั้งต้น', render: (item) => fmt(item.initialBudget) },
  { key: 'estimatedCost', label: 'ประมาณการ', render: (item) => fmt(item.estimatedCost) },
  { key: 'actualCost', label: 'ค่าใช้จ่ายจริง', render: (item) => fmt(item.actualCost) },
]

const Budgets = () => (
  <ModulePage title="งบประมาณ (Budget)" endpoint="/api/budgets" fields={fields} columns={columns} />
)

export default Budgets
