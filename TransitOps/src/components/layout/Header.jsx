import { memo, useState } from 'react'
import { Search, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout, selectAuth } from '../../store/slices/authSlice'
import { initials } from '../../utils/format'

function Header() {
  const [query, setQuery] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector(selectAuth)

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-surface-700 bg-surface-900/80 px-6 py-3 backdrop-blur">
      <div className="relative max-w-md flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-full border border-surface-600 bg-surface-850 py-2 pl-9 pr-4 text-sm text-ink-100 outline-none placeholder:text-ink-400 focus:border-accent"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-ink-100">{user?.name || 'Raven K.'}</p>
          <p className="text-xs text-ink-400">{user?.role || 'Dispatcher'}</p>
        </div>
        <span className="rounded-full bg-role px-3 py-1 text-xs font-semibold text-white">
          {user?.role || 'Dispatcher'}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-role/30 text-sm font-bold text-role">
          {initials(user?.name || 'Raven K')}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-surface-600 p-2 text-ink-300 transition hover:border-accent hover:text-accent cursor-pointer"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}

export default memo(Header)
