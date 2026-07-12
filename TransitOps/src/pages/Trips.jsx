import { memo, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addTrip, changeTripStatus, selectTrips } from '../store/slices/tripsSlice'
import { selectDispatchableVehicles } from '../store/slices/vehiclesSlice'
import { selectAssignableDrivers } from '../store/slices/driversSlice'
import { TRIP_STATUS } from '../utils/constants'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'

const STEPS = [
  { key: TRIP_STATUS.DRAFT, color: 'bg-status-available' },
  { key: TRIP_STATUS.DISPATCHED, color: 'bg-status-ontrip' },
  { key: TRIP_STATUS.COMPLETED, color: 'bg-status-draft' },
  { key: TRIP_STATUS.CANCELLED, color: 'bg-status-draft' },
]

const TripCard = memo(function TripCard({ trip, onComplete, onCancel }) {
  return (
    <article className="rounded-xl border border-surface-700 bg-surface-850 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ink-100">{trip.tripCode}</p>
          <p className="mt-1 text-sm text-ink-300">
            {trip.source} → {trip.destination}
          </p>
        </div>
        <StatusBadge status={trip.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-200">
        <span>
          {trip.vehicleName} / {trip.driverName}
        </span>
        <span className="text-ink-400">{trip.eta}</span>
      </div>
      {trip.status === TRIP_STATUS.DISPATCHED ? (
        <div className="mt-3 flex gap-2">
          <Button className="text-xs" onClick={() => onComplete(trip)}>
            Complete
          </Button>
          <Button variant="danger" className="text-xs" onClick={() => onCancel(trip)}>
            Cancel
          </Button>
        </div>
      ) : null}
    </article>
  )
})

function Trips() {
  const dispatch = useAppDispatch()
  const trips = useAppSelector(selectTrips)
  const vehicles = useAppSelector(selectDispatchableVehicles)
  const drivers = useAppSelector(selectAssignableDrivers)

  const [form, setForm] = useState({
    source: 'Gandhinagar Depot',
    destination: 'Ahmedabad Hub',
    vehicleId: '',
    driverId: '',
    cargoWeight: '',
    plannedDistance: '',
  })

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === form.vehicleId),
    [vehicles, form.vehicleId],
  )

  const cargoWeight = Number(form.cargoWeight) || 0
  const capacity = selectedVehicle?.capacityKg || 0
  const capacityExceeded = selectedVehicle && cargoWeight > capacity
  const canDispatch =
    form.source &&
    form.destination &&
    form.vehicleId &&
    form.driverId &&
    cargoWeight > 0 &&
    !capacityExceeded

  const vehicleOptions = [
    { value: '', label: 'Select available vehicle' },
    ...vehicles.map((v) => ({
      value: v.id,
      label: `${v.nameModel} — ${v.capacity}`,
    })),
  ]

  const driverOptions = [
    { value: '', label: 'Select available driver' },
    ...drivers.map((d) => ({ value: d.id, label: d.name })),
  ]

  const handleDispatch = async (e) => {
    e.preventDefault()
    if (!canDispatch) return
    const vehicle = selectedVehicle
    const driver = drivers.find((d) => d.id === form.driverId)
    await dispatch(
      addTrip({
        source: form.source,
        destination: form.destination,
        vehicleId: vehicle.id,
        vehicleName: vehicle.nameModel,
        driverId: driver.id,
        driverName: driver.name,
        cargoWeight,
        plannedDistance: Number(form.plannedDistance) || 0,
        status: TRIP_STATUS.DISPATCHED,
        eta: `${Math.max(20, Number(form.plannedDistance) || 30)} min`,
      }),
    )
    setForm((prev) => ({ ...prev, vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '' }))
  }

  const handleComplete = (trip) => {
    dispatch(
      changeTripStatus({
        id: trip.id,
        status: TRIP_STATUS.COMPLETED,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        extra: { eta: '—' },
      }),
    )
  }

  const handleCancel = (trip) => {
    dispatch(
      changeTripStatus({
        id: trip.id,
        status: TRIP_STATUS.CANCELLED,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        extra: { eta: 'Cancelled' },
      }),
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <div className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((step, index) => (
            <div key={step.key} className="flex items-center gap-2">
              <span
                className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                  index === 0 ? 'bg-status-available' : index === 1 ? 'bg-status-ontrip' : 'bg-surface-600'
                }`}
              >
                {step.key}
              </span>
              {index < STEPS.length - 1 ? <span className="text-ink-400">→</span> : null}
            </div>
          ))}
        </div>

        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
          Create Trip
        </h2>

        <form onSubmit={handleDispatch} className="space-y-3">
          <Input
            label="Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            required
          />
          <Input
            label="Destination"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            required
          />
          <Select
            label="Vehicle (Available Only)"
            value={form.vehicleId}
            onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            options={vehicleOptions}
            required
          />
          <Select
            label="Driver (Available Only)"
            value={form.driverId}
            onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            options={driverOptions}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cargo Weight (KG)"
              type="number"
              value={form.cargoWeight}
              onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
              required
            />
            <Input
              label="Planned Distance (KM)"
              type="number"
              value={form.plannedDistance}
              onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })}
            />
          </div>

          {capacityExceeded ? (
            <div className="rounded-lg border border-status-cancelled/70 bg-status-cancelled/10 px-3 py-3 text-sm text-status-cancelled">
              <p>Vehicle Capacity: {capacity} kg</p>
              <p>Cargo Weight: {cargoWeight} kg</p>
              <p className="mt-1 font-semibold">
                ✕ Capacity exceeded by {cargoWeight - capacity} kg — dispatch blocked
              </p>
            </div>
          ) : null}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={!canDispatch} className="flex-1">
              Dispatch
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                setForm({
                  source: '',
                  destination: '',
                  vehicleId: '',
                  driverId: '',
                  cargoWeight: '',
                  plannedDistance: '',
                })
              }
            >
              Cancel
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
          Live Board
        </h2>
        <div className="space-y-3">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          ))}
        </div>
        <p className="mt-5 text-xs text-ink-400">
          On Complete: odometer → fuel log → expenses → Vehicle & Driver Available
        </p>
      </section>
    </div>
  )
}

export default memo(Trips)
