import { memo, useEffect } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Printer } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  exportAnalyticsCsv,
  loadAnalytics,
  selectAnalytics,
} from '../store/slices/appDataSlice'
import { formatCurrency } from '../utils/format'
import KpiCard from '../components/ui/KpiCard'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'

function Analytics() {
  const dispatch = useAppDispatch()
  const analytics = useAppSelector(selectAnalytics)
  const maxCost = Math.max(...analytics.costliestVehicles.map((v) => v.cost), 1)

  useEffect(() => {
    dispatch(loadAnalytics())
  }, [dispatch])

  const handleExport = async () => {
    const result = await dispatch(exportAnalyticsCsv())
    if (exportAnalyticsCsv.fulfilled.match(result)) {
      const blob = new Blob([result.payload.content], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.payload.filename
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-400">
          ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Export PDF
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Fuel Efficiency" value={`${analytics.fuelEfficiency} km/l`} accent="cyan" />
        <KpiCard title="Fleet Utilization" value={`${analytics.fleetUtilization}%`} accent="green" />
        <KpiCard
          title="Operational Cost"
          value={formatCurrency(analytics.operationalCost)}
          accent="orange"
        />
        <KpiCard title="Vehicle ROI" value={`${analytics.vehicleRoi}%`} accent="lime" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-200">
            Monthly Revenue
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e36" />
                <XAxis dataKey="month" stroke="#6f7684" tick={{ fill: '#a8adb8', fontSize: 12 }} />
                <YAxis stroke="#6f7684" tick={{ fill: '#a8adb8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: '#16181c',
                    border: '1px solid #2a2e36',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="revenue" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-200">
            Top Costliest Vehicles
          </h2>
          <div className="space-y-5">
            {analytics.costliestVehicles.map((item, index) => (
              <ProgressBar
                key={item.name}
                label={item.name}
                value={item.cost}
                max={maxCost}
                color={index === 0 ? '#f43f5e' : index === 1 ? '#f59e0b' : '#38bdf8'}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default memo(Analytics)
