import { memo } from 'react'

const BORDER_COLORS = {
  blue: 'border-l-info',
  green: 'border-l-status-available',
  orange: 'border-l-accent',
  purple: 'border-l-[#a78bfa]',
  cyan: 'border-l-status-dispatched',
  navy: 'border-l-role',
  lime: 'border-l-status-completed',
}

function KpiCard({ title, value, accent = 'blue' }) {
  return (
    <div
      className={`rounded-xl border border-surface-700 border-l-4 bg-surface-850 px-4 py-3 ${BORDER_COLORS[accent] || BORDER_COLORS.blue}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-300">{title}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink-100">{value}</p>
    </div>
  )
}

export default memo(KpiCard)
