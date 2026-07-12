import { memo } from 'react'

function ProgressBar({ label, value, max = 100, color = '#22c55e' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-200">{label}</span>
        <span className="text-ink-300">{value}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-700">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default memo(ProgressBar)
