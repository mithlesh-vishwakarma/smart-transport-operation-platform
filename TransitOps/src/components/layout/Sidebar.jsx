import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
} from 'lucide-react'
import { NAV_ITEMS, ROLE_ACCESS } from '../../utils/constants'
import { useAppSelector } from '../../store/hooks'
import { selectUserRole } from '../../store/slices/authSlice'

const ICONS = {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
}

function Sidebar() {
  const role = useAppSelector(selectUserRole)
  const allowedPaths = ROLE_ACCESS[role] || []
  const visibleItems = NAV_ITEMS.filter((item) => allowedPaths.includes(item.path))

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-surface-700 bg-surface-900">
      <div className="border-b border-surface-700 px-5 py-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-100">
          TransitOps
        </h1>
        <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-400">
          Operations Platform
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleItems.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border border-accent bg-accent-muted text-accent'
                    : 'border border-transparent text-ink-300 hover:bg-surface-800 hover:text-ink-100'
                }`
              }
            >
              {Icon ? <Icon size={18} /> : null}
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default memo(Sidebar)
