import { memo } from 'react'

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover disabled:bg-surface-700 disabled:text-ink-400',
  secondary:
    'bg-surface-800 text-ink-100 border border-surface-600 hover:border-ink-400 disabled:opacity-50',
  danger: 'bg-transparent text-status-cancelled border border-status-cancelled/50 hover:bg-status-cancelled/10',
  ghost: 'bg-transparent text-ink-200 hover:text-ink-100 hover:bg-surface-800',
  info: 'bg-role text-white hover:brightness-110',
}

function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default memo(Button)
