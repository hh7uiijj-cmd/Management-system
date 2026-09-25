import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import Sidebar from '../../components/Sidebar'
import SearchMultiSelect from '../../components/SearchMultiSelect'
import SearchSelect from '../../components/SearchSelect'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

// หน้า CRUD กลางที่ใช้ config ขับเคลื่อน (list / create / edit / delete / approve)
// ใช้ร่วมกันสำหรับโมดูลใหม่ทั้งหมด (T/D/L/B/RI/E/M/A) เพื่อลดโค้ดซ้ำซ้อนระหว่าง 8 โมดูลที่มีรูปแบบเดียวกัน
// สิทธิ์จริงถูกบังคับที่ server เสมอ — ฝั่ง UI นี้แค่ซ่อน/แสดงปุ่มให้เหมาะสมเท่านั้น
const emptyFromFields = (fields) => {
  const obj = {}
  fields.forEach((f) => { obj[f.name] = f.default ?? '' })
  return obj
}

const getByPath = (obj, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), obj)

const ModulePage = ({ title, subtitle, showDeptScopeNote = false, deptScopedForNonTopTier = true, endpoint, fields, columns, ownerField = 'createdBy', canApprove, approveField, approveOptions, approveEndpointSuffix = 'approve', canApproveItem, approveMode = 'select', approveTriggerValue, approveTargetValue, approveButtonLabel = 'อนุมัติ', rejectTargetValue, rejectButtonLabel = 'ตีกลับแก้ไข', canEditItemFn, canDeleteItemFn, canCreate: canCreateProp = true, submitAction, allowEdit = true, searchKeys = [], filters = [], sorts = [] }) => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyFromFields(fields))
  const [saving, setSaving] = useState(false)

  const [submittingItem, setSubmittingItem] = useState(null)
  const [submitForm, setSubmitForm] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const [search, setSearch] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [sortKey, setSortKey] = useState(sorts[0]?.key || '')
  const [sortDir, setSortDir] = useState(sorts[0]?.defaultDir || 'desc')

  const isTopTier = ['admin', 'president', 'vice_president'].includes(user?.role?.name)
  const isDeptLead = ['head', 'secretary'].includes(user?.role?.name)
  const isMember = user?.role?.name === 'member'

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(endpoint)
      setItems(data)
    } catch (err) {
      console.error(`Fetch ${endpoint} error:`, err)
    } finally {
      setLoading(false)
    }
  }

  const resolveOptions = async (field) => {
    if (!field.optionsEndpoint) return field.options || []
    try {
      const endpoint = typeof field.optionsEndpoint === 'function' ? field.optionsEndpoint(user) : field.optionsEndpoint
      const { data } = await api.get(endpoint)
      return data.map(field.mapOption)
    } catch {
      return []
    }
  }

  const [dynamicOptions, setDynamicOptions] = useState({})
  useEffect(() => {
    fields.forEach(async (f) => {
      if (f.optionsEndpoint) {
        const opts = await resolveOptions(f)
        setDynamicOptions((prev) => ({ ...prev, [f.name]: opts }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyFromFields(fields))
    setShowForm(true)
    setMessage({ text: '', type: '' })
  }

  const openEdit = (item) => {
    setEditingId(item._id)
    const next = {}
    fields.forEach((f) => {
      const raw = item[f.name]
      if (f.type === 'ref' || f.type === 'searchref') next[f.name] = raw?._id || raw || ''
      else if (f.type === 'multiref') next[f.name] = (raw || []).map((r) => r?._id || r)
      else if (f.type === 'date' && raw) next[f.name] = new Date(raw).toISOString().slice(0, 10)
      else next[f.name] = raw ?? ''
    })
    setForm(next)
    setShowForm(true)
    setMessage({ text: '', type: '' })
  }

  const handleChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  const defaultCanEditItem = (item) => {
    if (isTopTier) return true
    if (isDeptLead) return item.department === user.department
    if (isMember) {
      const ownerId = item[ownerField]?._id || item[ownerField]
      return item.department === user.department && String(ownerId) === String(user._id)
    }
    return false
  }
  const canEditItem = (item) => (canEditItemFn ? canEditItemFn(item, user) : defaultCanEditItem(item))
  const canDeleteItem = (item) => (canDeleteItemFn ? canDeleteItemFn(item, user) : defaultCanEditItem(item))

  const canCreate = typeof canCreateProp === 'function' ? canCreateProp(user) : canCreateProp

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const payload = { ...form }
      if (!payload.department && !isTopTier) payload.department = user.department
      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload)
        setMessage({ text: 'บันทึกการแก้ไขสำเร็จ', type: 'success' })
      } else {
        await api.post(endpoint, payload)
        setMessage({ text: 'เพิ่มรายการสำเร็จ', type: 'success' })
      }
      setShowForm(false)
      fetchItems()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return
    try {
      await api.delete(`${endpoint}/${id}`)
      setMessage({ text: 'ลบรายการสำเร็จ', type: 'success' })
      fetchItems()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    }
  }

  const openSubmit = (item) => {
    const next = {}
    ;(submitAction?.fields || []).forEach((f) => { next[f.name] = item[f.name] ?? '' })
    setSubmittingItem(item)
    setSubmitForm(next)
    setMessage({ text: '', type: '' })
  }

  const handleSubmitAction = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ text: '', type: '' })
    try {
      await api.put(`${endpoint}/${submittingItem._id}/${submitAction.endpointSuffix}`, submitForm)
      setMessage({ text: submitAction.successMessage || 'ส่งข้อมูลสำเร็จ', type: 'success' })
      setSubmittingItem(null)
      fetchItems()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (id, status) => {
    try {
      await api.put(`${endpoint}/${id}/${approveEndpointSuffix}`, { status })
      setMessage({ text: 'อัปเดตสถานะสำเร็จ', type: 'success' })
      fetchItems()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'เกิดข้อผิดพลาด', type: 'error' })
    }
  }

  const renderInput = (f, values, onChange) => {
    const options = f.optionsEndpoint ? (dynamicOptions[f.name] || []) : (f.options || [])
    if (f.type === 'select' || f.type === 'ref') {
      return (
        <select
          className="input-field"
          value={values[f.name] || ''}
          onChange={(e) => onChange(f.name, e.target.value)}
          required={f.required}
        >
          <option value="">-- เลือก{f.label} --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }
    if (f.type === 'multiref') {
      return (
        <SearchMultiSelect
          options={options}
          value={values[f.name] || []}
          onChange={(next) => onChange(f.name, next)}
        />
      )
    }
    if (f.type === 'searchref') {
      return (
        <SearchSelect
          options={options}
          value={values[f.name] || ''}
          onChange={(next) => onChange(f.name, next)}
          placeholder={`-- เลือก${f.label} --`}
        />
      )
    }
    if (f.type === 'textarea') {
      return (
        <textarea
          className="input-field"
          rows={3}
          value={values[f.name] || ''}
          onChange={(e) => onChange(f.name, e.target.value)}
        />
      )
    }
    return (
      <input
        type={f.type || 'text'}
        className="input-field"
        value={values[f.name] || ''}
        onChange={(e) => onChange(f.name, e.target.value)}
        required={f.required}
      />
    )
  }
  const renderFieldInput = (f) => renderInput(f, form, handleChange)
  const renderSubmitFieldInput = (f) => renderInput(f, submitForm, (name, value) => setSubmitForm((prev) => ({ ...prev, [name]: value })))

  const resetFilters = () => {
    setSearch('')
    setFilterValues({})
    setSortKey(sorts[0]?.key || '')
    setSortDir(sorts[0]?.defaultDir || 'desc')
  }

  const visibleItems = items
    .filter((item) => {
      if (search.trim() && searchKeys.length) {
        const q = search.trim().toLowerCase()
        const hit = searchKeys.some((key) => String(getByPath(item, key) ?? '').toLowerCase().includes(q))
        if (!hit) return false
      }
      for (const f of filters) {
        const v = filterValues[f.key]
        if (v && String(getByPath(item, f.key) ?? '') !== v) return false
      }
      return true
    })
    .sort((a, b) => {
      if (!sortKey) return 0
      const av = getByPath(a, sortKey)
      const bv = getByPath(b, sortKey)
      const cmp = av == null && bv == null ? 0 : av == null ? -1 : bv == null ? 1 : av > bv ? 1 : av < bv ? -1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
              {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
              <p className="text-gray-500 mt-1">ทั้งหมด {items.length} รายการ</p>
              {showDeptScopeNote && (
                <p className="text-xs text-indigo-500 mt-0.5">
                  {!deptScopedForNonTopTier
                    ? 'ทุกฝ่ายเห็นรายการนี้เหมือนกันหมด'
                    : isTopTier
                      ? 'คุณเห็นข้อมูลทุกฝ่ายทั้งโครงการ'
                      : `แสดงเฉพาะข้อมูลของฝ่าย "${user?.department || '-'}"`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={fetchItems} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                โหลดใหม่
              </button>
              {canCreate && (
                <button onClick={openCreate} className="btn-primary">+ เพิ่มรายการ</button>
              )}
            </div>
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {(searchKeys.length > 0 || filters.length > 0 || sorts.length > 0) && (
            <div className="card p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                {searchKeys.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">ค้นหา</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="พิมพ์คำค้นหา..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                )}
                {filters.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                    <select
                      className="input-field"
                      value={filterValues[f.key] || ''}
                      onChange={(e) => setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    >
                      <option value="">ทั้งหมด</option>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {sorts.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">เรียงตาม</label>
                    <div className="flex gap-2">
                      <select
                        className="input-field"
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value)}
                      >
                        {sorts.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                      <select
                        className="input-field w-24"
                        value={sortDir}
                        onChange={(e) => setSortDir(e.target.value)}
                      >
                        <option value="desc">ใหม่→เก่า</option>
                        <option value="asc">เก่า→ใหม่</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">แสดง {visibleItems.length} รายการ จาก {items.length} รายการ</p>
                <button onClick={resetFilters} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                  ล้างตัวกรอง
                </button>
              </div>
            </div>
          )}

          {showForm && (
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">{editingId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.filter((f) => !f.visible || f.visible(user)).map((f) => (
                  <div key={f.name} className={['textarea', 'multiref'].includes(f.type) ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    {renderFieldInput(f)}
                  </div>
                ))}
                <div className="md:col-span-2 flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {submittingItem && (
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">{submitAction.formTitle || 'ส่งงาน'}: {submittingItem.title || ''}</h2>
              <form onSubmit={handleSubmitAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submitAction.fields.map((f) => (
                  <div key={f.name} className={['textarea', 'multiref'].includes(f.type) ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    {renderSubmitFieldInput(f)}
                  </div>
                ))}
                <div className="md:col-span-2 flex gap-2 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'กำลังส่ง...' : 'ส่งงาน'}
                  </button>
                  <button type="button" onClick={() => setSubmittingItem(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {columns.map((c) => (
                        <th key={c.key} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{c.label}</th>
                      ))}
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleItems.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-500">
                              {items.length === 0 ? 'ยังไม่มีข้อมูล' : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : visibleItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                        {columns.map((c) => (
                          <td key={c.key} className="px-6 py-4 text-sm text-gray-700">
                            {c.render ? c.render(item) : (item[c.key] ?? '-')}
                          </td>
                        ))}
                        <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                          {allowEdit && canEditItem(item) && (
                            <button onClick={() => openEdit(item)} className="text-xs px-3 py-1.5 border border-indigo-500 text-indigo-600 rounded-lg hover:bg-indigo-50">แก้ไข</button>
                          )}
                          {canDeleteItem(item) && (
                            <button onClick={() => handleDelete(item._id)} className="text-xs px-3 py-1.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50">ลบ</button>
                          )}
                          {submitAction && submitAction.visible(item, user) && (
                            <button onClick={() => openSubmit(item)} className="text-xs px-3 py-1.5 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50">
                              {submitAction.label || 'ส่งงาน'}
                            </button>
                          )}
                          {canApprove && (canApproveItem ? canApproveItem(item, user) : (isTopTier || isDeptLead)) && (
                            approveMode === 'button' ? (
                              item[approveField] === approveTriggerValue && (
                                <>
                                  <button
                                    onClick={() => handleApprove(item._id, approveTargetValue)}
                                    className="text-xs px-3 py-1.5 border border-green-500 text-green-600 rounded-lg hover:bg-green-50"
                                  >
                                    {approveButtonLabel}
                                  </button>
                                  {rejectTargetValue && (
                                    <button
                                      onClick={() => handleApprove(item._id, rejectTargetValue)}
                                      className="text-xs px-3 py-1.5 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50"
                                    >
                                      {rejectButtonLabel}
                                    </button>
                                  )}
                                </>
                              )
                            ) : (
                              <select
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                                value={item[approveField] || ''}
                                onChange={(e) => handleApprove(item._id, e.target.value)}
                              >
                                {approveOptions.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ModulePage
