import { memo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addMaintenance, closeMaintenance, selectMaintenance } from '../store/slices/maintenanceSlice'
import { selectVehicles } from '../store/slices/vehiclesSlice'
import { MAINTENANCE_STATUS } from '../utils/constants'
import { formatCurrency, formatDate } from '../utils/format'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'

const ServiceRow = memo(function ServiceRow({ record, onClose }) {
  return (
    <tr className="border-b border-surface-700/80 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-ink-100">{record.vehicleName}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{record.serviceType}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{formatCurrency(record.cost)}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={record.status === 'Active' ? 'In Shop' : record.status} />
          {record.status !== MAINTENANCE_STATUS.COMPLETED ? (
            <button
              type="button"
              onClick={() => onClose(record)}
              className="text-xs text-info hover:underline cursor-pointer"
            >
              Close
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  )
})

function Maintenance() {
  const dispatch = useAppDispatch()
  const records = useAppSelector(selectMaintenance)
  const vehicles = useAppSelector(selectVehicles)

  const [form, setForm] = useState({
    vehicleId: '',
    serviceType: 'Oil Change',
    cost: '',
    date: new Date().toISOString().slice(0, 10),
    status: MAINTENANCE_STATUS.IN_SHOP,
  })

  const vehicleOptions = [
    { value: '', label: 'Select vehicle' },
    ...vehicles
      .filter((v) => v.status !== 'Retired')
      .map((v) => ({ value: v.id, label: v.nameModel })),
  ]

  const onSubmit = async (e) => {
    e.preventDefault()
    const vehicle = vehicles.find((v) => v.id === form.vehicleId)
    if (!vehicle) return
    await dispatch(
      addMaintenance({
        vehicleId: vehicle.id,
        vehicleName: vehicle.nameModel,
        serviceType: form.serviceType,
        cost: Number(form.cost) || 0,
        date: form.date,
        status: form.status === 'Active' ? MAINTENANCE_STATUS.IN_SHOP : form.status,
      }),
    )
    setForm((prev) => ({ ...prev, vehicleId: '', cost: '' }))
  }

  const onClose = (record) => {
    dispatch(closeMaintenance({ id: record.id, vehicleId: record.vehicleId }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
          Log Service Record
        </h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <Select
            label="Vehicle"
            value={form.vehicleId}
            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            options={vehicleOptions}
            required
          />
          <Input
            label="Service Type"
            value={form.serviceType}
            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            required
          />
          <Input
            label="Cost"
            type="number"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[MAINTENANCE_STATUS.IN_SHOP, MAINTENANCE_STATUS.ACTIVE, MAINTENANCE_STATUS.COMPLETED]}
          />
          <Button type="submit" className="w-full py-3">
            Save
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-sm text-ink-300">
          <p>
            Available <span className="text-accent">→</span> In Shop
            <span className="ml-2 text-ink-400">(creating active record)</span>
          </p>
          <p>
            In Shop <span className="text-accent">→</span> Available
            <span className="ml-2 text-ink-400">(closing record)</span>
          </p>
          <p className="pt-2 text-accent">
            Note: In Shop vehicles are removed from the dispatch pool.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
          Service Log
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
                <th className="px-3 py-2 font-medium">Vehicle</th>
                <th className="px-3 py-2 font-medium">Service</th>
                <th className="px-3 py-2 font-medium">Cost</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <ServiceRow key={record.id} record={record} onClose={onClose} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-ink-400">
          Latest: {records[0] ? `${records[0].vehicleName} · ${formatDate(records[0].date)}` : '—'}
        </p>
      </section>
    </div>
  )
}

export default memo(Maintenance)
