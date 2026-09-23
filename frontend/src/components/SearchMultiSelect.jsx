import { useState } from 'react'

// เลือกได้หลายรายการ พร้อมช่องค้นหากรองตัวเลือก และแสดง chip ของรายการที่เลือกไว้
const SearchMultiSelect = ({ options, value, onChange }) => {
  const [query, setQuery] = useState('')
  const selected = value || []

  const filtered = query.trim()
    ? options.filter((opt) => opt.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  const toggle = (optValue) => {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue))
    } else {
      onChange([...selected, optValue])
    }
  }

  const selectedOptions = options.filter((opt) => selected.includes(opt.value))

  return (
    <div>
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 bg-blue-50 text-indigo-700 text-xs px-2 py-1 rounded-full"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => toggle(opt.value)}
                className="hover:text-blue-900"
                aria-label={`เอา ${opt.label} ออก`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        className="input-field mb-2"
        placeholder="ค้นหาชื่อ..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">ไม่พบรายชื่อ</p>
        ) : (
          filtered.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

export default SearchMultiSelect
