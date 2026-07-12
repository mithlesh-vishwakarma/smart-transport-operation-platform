import { memo } from 'react'

function Input({ label, id, className = '', ...props }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-300">{label}</span>
      ) : null}
      <input
        id={id}
        className="w-full rounded-lg border border-surface-600 bg-surface-850 px-3 py-2.5 text-sm text-ink-100 outline-none transition placeholder:text-ink-400 focus:border-accent"
        {...props}
      />
    </label>
  )
}

export default memo(Input)
