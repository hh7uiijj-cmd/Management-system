import ModulePage from './ModulePage'

const canManage = (user) => ['admin', 'president', 'vice_president', 'head', 'secretary'].includes(user?.role?.name)

const userLabel = (u) => `${u.name}${u.nickname ? ` (${u.nickname})` : ''} · ${u.department || '-'}`

const fields = [
  { name: 'no', label: 'No.', type: 'number' },
  { name: 'task', label: 'งาน/รายงาน', required: true },
  { name: 'responsible', label: 'ผู้รับผิดชอบ', type: 'searchref', optionsEndpoint: '/api/users/directory?all=true', mapOption: (u) => ({ value: u._id, label: userLabel(u) }) },
]

const columns = [
  { key: 'no', label: 'No.', render: (item) => item.no ?? '-' },
  { key: 'task', label: 'งาน/รายงาน' },
  { key: 'responsible', label: 'ผู้รับผิดชอบ', render: (item) => item.responsible?.name || '-' },
]

const MasterTaskList = () => (
  <ModulePage
    title="Master Task List"
    endpoint="/api/master-task-list"
    fields={fields}
    columns={columns}
    canCreate={canManage}
    canEditItemFn={(item, user) => canManage(user)}
    canDeleteItemFn={(item, user) => canManage(user)}
    searchKeys={['task']}
    sorts={[{ key: 'no', label: 'No.', defaultDir: 'asc' }]}
  />
)

export default MasterTaskList
