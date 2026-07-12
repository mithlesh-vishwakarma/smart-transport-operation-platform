import { memo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addExpense,
  addFuelLog,
  selectExpenses,
  selectFuelLogs,
  selectTotalOperationalCost,
} from '../store/slices/fuelSlice'
import { selectVehicles } from '../store/slices/vehiclesSlice'
import { formatCurrency, formatDate } from '../utils/format'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/ui/StatusBadge'

const FuelRow = memo(function FuelRow({ log }) {
  return (
    <tr className="border-b border-surface-700/80 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-ink-100">{log.vehicleName}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{formatDate(log.date)}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{log.liters} L</td>
      <td className="px-3 py-3 text-sm text-ink-200">{formatCurrency(log.fuelCost)}</td>
    </tr>
  )
})

const ExpenseRow = memo(function ExpenseRow({ expense }) {
  return (
    <tr className="border-b border-surface-700/80 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-ink-100">{expense.tripCode}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{expense.vehicleName}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{formatCurrency(expense.toll)}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{formatCurrency(expense.other)}</td>
      <td className="px-3 py-3 text-sm text-ink-200">
        {formatCurrency(expense.maintenanceLinked)}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={expense.status} />
      </td>
    </tr>
  )
})

function FuelExpenses() {
  const dispatch = useAppDispatch()
  const logs = useAppSelector(selectFuelLogs)
  const expenses = useAppSelector(selectExpenses)
  const totalCost = useAppSelector(selectTotalOperationalCost)
  const vehicles = useAppSelector(selectVehicles)

  const [fuelOpen, setFuelOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    date: new Date().toISOString().slice(0, 10),
    liters: '',
    fuelCost: '',
  })
  const [expenseForm, setExpenseForm] = useState({
    tripCode: '',
    vehicleName: '',
    toll: '',
    other: '',
    maintenanceLinked: '',
    status: 'Available',
  })

  const vehicleOptions = [
    { value: '', label: 'Select vehicle' },
    ...vehicles.map((v) => ({ value: v.id, label: v.nameModel })),
  ]

  const submitFuel = async (e) => {
    e.preventDefault()
    const vehicle = vehicles.find((v) => v.id === fuelForm.vehicleId)
    if (!vehicle) return
    await dispatch(
      addFuelLog({
        vehicleId: vehicle.id,
        vehicleName: vehicle.nameModel,
        date: fuelForm.date,
        liters: Number(fuelForm.liters) || 0,
        fuelCost: Number(fuelForm.fuelCost) || 0,
      }),
    )
    setFuelOpen(false)
    setFuelForm({
      vehicleId: '',
      date: new Date().toISOString().slice(0, 10),
      liters: '',
      fuelCost: '',
    })
  }

  const submitExpense = async (e) => {
    e.preventDefault()
    await dispatch(
      addExpense({
        tripCode: expenseForm.tripCode,
        vehicleName: expenseForm.vehicleName,
        toll: Number(expenseForm.toll) || 0,
        other: Number(expenseForm.other) || 0,
        maintenanceLinked: Number(expenseForm.maintenanceLinked) || 0,
        status: expenseForm.status,
      }),
    )
    setExpenseOpen(false)
    setExpenseForm({
      tripCode: '',
      vehicleName: '',
      toll: '',
      other: '',
      maintenanceLinked: '',
      status: 'Available',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-200">Fuel Logs</h2>
        <div className="flex gap-2">
          <Button onClick={() => setFuelOpen(true)}>
            <Plus size={16} /> Log Fuel
          </Button>
          <Button onClick={() => setExpenseOpen(true)}>
            <Plus size={16} /> Add Expense
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-700 bg-surface-900">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
              <th className="px-3 py-3 font-medium">Vehicle</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Liters</th>
              <th className="px-3 py-3 font-medium">Fuel Cost</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <FuelRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-200">
          Other Expenses (Toll / Misc)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-surface-700 bg-surface-900">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
                <th className="px-3 py-3 font-medium">Trip</th>
                <th className="px-3 py-3 font-medium">Vehicle</th>
                <th className="px-3 py-3 font-medium">Toll</th>
                <th className="px-3 py-3 font-medium">Other</th>
                <th className="px-3 py-3 font-medium">Maint. (Linked)</th>
                <th className="px-3 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-surface-700 pt-4">
        <p className="text-sm uppercase tracking-wide text-ink-300">
          Total Operational Cost (Auto) = Fuel + Maint
        </p>
        <p className="font-display text-2xl font-bold text-accent">
          {formatCurrency(totalCost)}
        </p>
      </div>

      <Modal open={fuelOpen} title="Log Fuel" onClose={() => setFuelOpen(false)}>
        <form onSubmit={submitFuel} className="space-y-3">
          <Select
            label="Vehicle"
            value={fuelForm.vehicleId}
            onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
            options={vehicleOptions}
            required
          />
          <Input
            label="Date"
            type="date"
            value={fuelForm.date}
            onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Liters"
              type="number"
              value={fuelForm.liters}
              onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
              required
            />
            <Input
              label="Fuel Cost"
              type="number"
              value={fuelForm.fuelCost}
              onChange={(e) => setFuelForm({ ...fuelForm, fuelCost: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setFuelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={expenseOpen} title="Add Expense" onClose={() => setExpenseOpen(false)}>
        <form onSubmit={submitExpense} className="space-y-3">
          <Input
            label="Trip Code"
            value={expenseForm.tripCode}
            onChange={(e) => setExpenseForm({ ...expenseForm, tripCode: e.target.value })}
            required
          />
          <Input
            label="Vehicle"
            value={expenseForm.vehicleName}
            onChange={(e) => setExpenseForm({ ...expenseForm, vehicleName: e.target.value })}
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Toll"
              type="number"
              value={expenseForm.toll}
              onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })}
            />
            <Input
              label="Other"
              type="number"
              value={expenseForm.other}
              onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })}
            />
            <Input
              label="Maint. Linked"
              type="number"
              value={expenseForm.maintenanceLinked}
              onChange={(e) =>
                setExpenseForm({ ...expenseForm, maintenanceLinked: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setExpenseOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default memo(FuelExpenses)
