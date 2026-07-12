import { memo } from 'react'

function Select({ label, id, options = [], className = '', ...props }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-300">{label}</span>
      ) : null}
      <select
        id={id}
        className="w-full rounded-lg border border-surface-600 bg-surface-850 px-3 py-2.5 text-sm text-ink-100 outline-none transition focus:border-accent"
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value
          const text = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={value} value={value}>
              {text}
            </option>
          )
        })}
      </select>
    </label>
  )
}

export default memo(Select)
