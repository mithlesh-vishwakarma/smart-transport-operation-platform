import { memo, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  clearSaveMessage,
  loadSettings,
  saveSettings,
  selectRbac,
  selectSettings,
} from '../store/slices/appDataSlice'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

const RbacRow = memo(function RbacRow({ row }) {
  return (
    <tr className="border-b border-surface-700/80 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-ink-100">{row.role}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{row.fleet}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{row.drivers}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{row.trips}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{row.fuel}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{row.analytics}</td>
    </tr>
  )
})

function SettingsPage() {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const rbac = useAppSelector(selectRbac)
  const saveMessage = useAppSelector((s) => s.appData.saveMessage)
  const [form, setForm] = useState(settings)

  useEffect(() => {
    dispatch(loadSettings())
  }, [dispatch])

  useEffect(() => {
    setForm(settings)
  }, [settings])

  useEffect(() => {
    if (!saveMessage) return undefined
    const timer = setTimeout(() => dispatch(clearSaveMessage()), 2500)
    return () => clearTimeout(timer)
  }, [saveMessage, dispatch])

  const onSubmit = (e) => {
    e.preventDefault()
    dispatch(saveSettings(form))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
          General
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Depot Name"
            value={form.depotName}
            onChange={(e) => setForm({ ...form, depotName: e.target.value })}
          />
          <Select
            label="Currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={['INR (Rs)', 'USD ($)', 'EUR (€)']}
          />
          <Select
            label="Distance Unit"
            value={form.distanceUnit}
            onChange={(e) => setForm({ ...form, distanceUnit: e.target.value })}
            options={['Kilometers', 'Miles']}
          />
          <Button type="submit" variant="info">
            Save changes
          </Button>
          {saveMessage ? <p className="text-sm text-status-available">{saveMessage}</p> : null}
        </form>
      </section>

      <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
          Role-Based Access (RBAC)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Fleet</th>
                <th className="px-3 py-2 font-medium">Drivers</th>
                <th className="px-3 py-2 font-medium">Trips</th>
                <th className="px-3 py-2 font-medium">Fuel/Exp.</th>
                <th className="px-3 py-2 font-medium">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {rbac.map((row) => (
                <RbacRow key={row.role} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default memo(SettingsPage)
