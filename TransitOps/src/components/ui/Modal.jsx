import { memo, useEffect } from 'react'
import { X } from 'lucide-react'

function Modal({ open, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className={`w-full rounded-xl border border-surface-600 bg-surface-900 shadow-2xl ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-300 hover:bg-surface-800 hover:text-ink-100 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export default memo(Modal)
