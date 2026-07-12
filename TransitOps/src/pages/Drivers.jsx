import { memo, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addDriver,
  loadDrivers,
  selectFilteredDrivers,
  setDriverSearch,
  setDriverStatusFilter,
} from '../store/slices/driversSlice'
import { DRIVER_STATUS } from '../utils/constants'
import { formatDate, isLicenseExpired } from '../utils/format'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/ui/StatusBadge'

const DriverRow = memo(function DriverRow({ driver }) {
  const expired = isLicenseExpired(driver.expiry)
  return (
    <tr className="border-b border-surface-700/80 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-ink-100">{driver.name}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{driver.licenseNo}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{driver.category}</td>
      <td className="px-3 py-3 text-sm">
        <span className={expired ? 'text-status-cancelled' : 'text-ink-200'}>
          {formatDate(driver.expiry)}
          {expired ? ' EXPIRED' : ''}
        </span>
      </td>
      <td className="px-3 py-3 text-sm text-ink-200">{driver.contact}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{driver.tripCompletion}%</td>
      <td className="px-3 py-3">
        <StatusBadge status={driver.safety} />
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={driver.status} />
      </td>
    </tr>
  )
})

const emptyForm = {
  name: '',
  licenseNo: '',
  category: 'LMV',
  expiry: '',
  contact: '',
  safety: DRIVER_STATUS.AVAILABLE,
  status: DRIVER_STATUS.AVAILABLE,
  safetyScore: 85,
  tripCompletion: 0,
}

function Drivers() {
  const dispatch = useAppDispatch()
  const drivers = useAppSelector(selectFilteredDrivers)
  const statusFilter = useAppSelector((s) => s.drivers.statusFilter)
  const search = useAppSelector((s) => s.drivers.search)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    dispatch(loadDrivers())
  }, [dispatch])

  const onSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(addDriver(form))
    if (addDriver.fulfilled.match(result)) {
      setOpen(false)
      setForm(emptyForm)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search drivers..."
          value={search}
          onChange={(e) => dispatch(setDriverSearch(e.target.value))}
          className="max-w-xs"
        />
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add Driver
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-700 bg-surface-900">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
              <th className="px-3 py-3 font-medium">Driver</th>
              <th className="px-3 py-3 font-medium">License No.</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Expiry</th>
              <th className="px-3 py-3 font-medium">Contact</th>
              <th className="px-3 py-3 font-medium">Trip Compl.</th>
              <th className="px-3 py-3 font-medium">Safety</th>
              <th className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <DriverRow key={driver.id} driver={driver} />
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
          Toggle Status
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'All' ? 'primary' : 'secondary'}
            onClick={() => dispatch(setDriverStatusFilter('All'))}
          >
            All
          </Button>
          {Object.values(DRIVER_STATUS).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => dispatch(setDriverStatusFilter(status))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                statusFilter === status
                  ? 'ring-2 ring-accent'
                  : ''
              }`}
            >
              <StatusBadge status={status} />
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-accent">
        Rule: Expired license or Suspended status → blocked from trip assignment
      </p>

      <Modal open={open} title="Add Driver" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="License Number"
            value={form.licenseNo}
            onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={['LMV', 'HMV']}
            />
            <Input
              label="Expiry"
              type="date"
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              required
            />
          </div>
          <Input
            label="Contact"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Driver</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default memo(Drivers)
