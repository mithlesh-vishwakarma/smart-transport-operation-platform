import { memo } from 'react'

const STATUS_STYLES = {
  Available: 'bg-status-available/20 text-status-available border-status-available/40',
  'On Trip': 'bg-status-ontrip/20 text-status-ontrip border-status-ontrip/40',
  Dispatched: 'bg-status-dispatched/20 text-status-dispatched border-status-dispatched/40',
  'In Shop': 'bg-status-shop/20 text-status-shop border-status-shop/40',
  Retired: 'bg-status-retired/20 text-status-retired border-status-retired/40',
  Draft: 'bg-status-draft/20 text-ink-300 border-status-draft/40',
  Completed: 'bg-status-completed/20 text-status-completed border-status-completed/40',
  Cancelled: 'bg-status-cancelled/20 text-status-cancelled border-status-cancelled/40',
  Suspended: 'bg-status-suspended/20 text-status-suspended border-status-suspended/40',
  'Off Duty': 'bg-status-offduty/20 text-ink-300 border-status-offduty/40',
  Active: 'bg-status-shop/20 text-status-shop border-status-shop/40',
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-surface-700 text-ink-200 border-surface-600'
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  )
}

export default memo(StatusBadge)
