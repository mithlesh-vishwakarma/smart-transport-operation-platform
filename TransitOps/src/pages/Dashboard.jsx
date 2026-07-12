import { memo, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  loadDashboard,
  selectDashboard,
  setDashboardFilters,
} from '../store/slices/appDataSlice'
import { selectRecentTrips, loadTrips } from '../store/slices/tripsSlice'
import KpiCard from '../components/ui/KpiCard'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import ProgressBar from '../components/ui/ProgressBar'
import { VEHICLE_TYPES, VEHICLE_STATUS } from '../utils/constants'

const TripRow = memo(function TripRow({ trip }) {
  return (
    <tr className="border-b border-surface-700/80 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-ink-100">{trip.tripCode}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{trip.vehicleName}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{trip.driverName}</td>
      <td className="px-3 py-3">
        <StatusBadge status={trip.status === 'Dispatched' ? 'On Trip' : trip.status} />
      </td>
      <td className="px-3 py-3 text-sm text-ink-300">{trip.eta}</td>
    </tr>
  )
})

function Dashboard() {
  const dispatch = useAppDispatch()
  const { kpis, vehicleStatus, filters } = useAppSelector(selectDashboard)
  const recentTrips = useAppSelector(selectRecentTrips)
  const maxBar = Math.max(...vehicleStatus.map((v) => v.value), 1)

  useEffect(() => {
    dispatch(loadDashboard(filters))
    dispatch(loadTrips())
  }, [dispatch, filters])

  return (
    <div className="space-y-6">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Filters</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Vehicle Type"
            value={filters.vehicleType}
            onChange={(e) => dispatch(setDashboardFilters({ vehicleType: e.target.value }))}
            options={['All', ...VEHICLE_TYPES]}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => dispatch(setDashboardFilters({ status: e.target.value }))}
            options={['All', ...Object.values(VEHICLE_STATUS)]}
          />
          <Select
            label="Region"
            value={filters.region}
            onChange={(e) => dispatch(setDashboardFilters({ region: e.target.value }))}
            options={['All', 'Gandhinagar', 'Ahmedabad', 'Sanand', 'Vatva', 'Kalol']}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard title="Active Vehicles" value={kpis.activeVehicles} accent="blue" />
        <KpiCard title="Available Vehicles" value={kpis.availableVehicles} accent="green" />
        <KpiCard title="Vehicles in Maintenance" value={String(kpis.vehiclesInMaintenance).padStart(2, '0')} accent="orange" />
        <KpiCard title="Active Trips" value={kpis.activeTrips} accent="cyan" />
        <KpiCard title="Pending Trips" value={String(kpis.pendingTrips).padStart(2, '0')} accent="purple" />
        <KpiCard title="Drivers On Duty" value={kpis.driversOnDuty} accent="navy" />
        <KpiCard title="Fleet Utilization" value={`${kpis.fleetUtilization}%`} accent="lime" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
            Recent Trips
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
                  <th className="px-3 py-2 font-medium">Trip</th>
                  <th className="px-3 py-2 font-medium">Vehicle</th>
                  <th className="px-3 py-2 font-medium">Driver</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <TripRow key={trip.id} trip={trip} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-200">
            Vehicle Status
          </h2>
          <div className="space-y-4">
            {vehicleStatus.map((item) => (
              <ProgressBar
                key={item.label}
                label={item.label}
                value={item.value}
                max={maxBar}
                color={item.color}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default memo(Dashboard)
