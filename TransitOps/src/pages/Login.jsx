import { memo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { clearAuthError, login, selectAuth, selectHomePath } from '../store/slices/authSlice'
import { ROLES } from '../utils/constants'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

const ROLE_ROUTES = [
  { role: ROLES.FLEET_MANAGER, access: 'Fleet, Maintenance' },
  { role: ROLES.DISPATCHER, access: 'Dashboard, Trips' },
  { role: ROLES.SAFETY_OFFICER, access: 'Drivers, Compliance' },
  { role: ROLES.FINANCIAL_ANALYST, access: 'Fuel & Expenses, Analytics' },
]

function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading, error } = useAppSelector(selectAuth)
  const homePath = useAppSelector(selectHomePath)

  const [form, setForm] = useState({
    email: 'test@gmail.com',
    password: '12345678',
    role: ROLES.DISPATCHER,
    remember: true,
  })

  if (isAuthenticated) {
    return <Navigate to={homePath} replace />
  }

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    if (error) dispatch(clearAuthError())
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(
      login({ email: form.email, password: form.password, role: form.role }),
    )
    if (login.fulfilled.match(result)) {
      navigate(result.payload.user.homePath || '/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen">
      <section className="relative hidden w-[42%] flex-col justify-between bg-[#e8eaed] px-10 py-10 text-surface-950 lg:flex">
        <div>
          <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">
            TO
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">TransitOps</h1>
          <p className="mt-2 text-sm text-surface-700">Smart Transport Operations Platform</p>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold text-surface-800">One login, four roles:</p>
          <ul className="space-y-3">
            {Object.values(ROLES).map((role) => (
              <li key={role} className="flex items-center gap-3 text-sm text-surface-800">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {role}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs uppercase tracking-wider text-surface-600">
          TransitOps © 2024 · RBAC Enabled
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-surface-950 px-6 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <h2 className="font-display text-3xl font-semibold text-ink-100">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-ink-300">Enter your credentials to continue</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="raven.k@transitops.in"
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
            />
            <Select
              label="Role (RBAC)"
              name="role"
              value={form.role}
              onChange={onChange}
              options={Object.values(ROLES)}
            />

            <div className="flex items-center justify-between pt-1 text-sm">
              <label className="flex items-center gap-2 text-ink-300">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={onChange}
                  className="accent-status-available"
                />
                Remember me
              </label>
              <button type="button" className="text-info hover:underline cursor-pointer">
                Forgot password?
              </button>
            </div>

            {error ? (
              <div className="rounded-lg border border-status-cancelled/60 bg-status-cancelled/10 px-3 py-2 text-sm text-status-cancelled">
                ✕ {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 space-y-2 border-t border-surface-700 pt-6 text-xs text-ink-400">
            {ROLE_ROUTES.map((item) => (
              <p key={item.role}>
                <span className="text-ink-200">{item.role}</span>
                <span className="mx-2 text-ink-400">→</span>
                {item.access}
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default memo(Login)
