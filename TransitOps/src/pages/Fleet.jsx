import { memo, useEffect, useMemo, useState } from 'react'
import { Plus, Edit } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addVehicle,
  loadVehicles,
  patchVehicle,
  selectFilteredVehicles,
  selectVehicleFilters,
  setVehicleFilters,
} from '../store/slices/vehiclesSlice'
import { VEHICLE_STATUS, VEHICLE_TYPES, ROLES } from '../utils/constants'
import { selectUserRole } from '../store/slices/authSlice'
import { formatCurrency, formatNumber, parseCapacityKg } from '../utils/format'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/ui/StatusBadge'

const VehicleRow = memo(function VehicleRow({ vehicle, onEdit, isReadOnly }) {
  return (
    <tr className="border-b border-surface-700/80 last:border-0">
      <td className="px-3 py-3 text-sm font-medium text-ink-100">{vehicle.registrationNumber}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{vehicle.nameModel}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{vehicle.type}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{vehicle.capacity}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{formatNumber(vehicle.odometer)}</td>
      <td className="px-3 py-3 text-sm text-ink-200">{formatCurrency(vehicle.acquisitionCost)}</td>
      <td className="px-3 py-3">
        <StatusBadge status={vehicle.status} />
      </td>
      {!isReadOnly && (
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={() => onEdit(vehicle)}
            className="text-info hover:text-info/80 cursor-pointer"
            title="Edit Vehicle"
          >
            <Edit size={16} />
          </button>
        </td>
      )}
    </tr>
  )
})

const emptyForm = {
  registrationNumber: '',
  nameModel: '',
  type: 'Van',
  capacity: '',
  odometer: '',
  acquisitionCost: '',
  status: VEHICLE_STATUS.AVAILABLE,
  region: 'Gandhinagar',
}

function Fleet() {
  const dispatch = useAppDispatch()
  const vehicles = useAppSelector(selectFilteredVehicles)
  const filters = useAppSelector(selectVehicleFilters)
  const error = useAppSelector((s) => s.vehicles.error)
  const role = useAppSelector(selectUserRole)
  const [open, setOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const isReadOnly = role === ROLES.DISPATCHER || role === ROLES.FINANCIAL_ANALYST

  useEffect(() => {
    dispatch(loadVehicles(filters))
  }, [dispatch, filters])

  const typeOptions = useMemo(() => ['All', ...VEHICLE_TYPES], [])
  const statusOptions = useMemo(() => ['All', ...Object.values(VEHICLE_STATUS)], [])

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle)
    setForm({
      registrationNumber: vehicle.registrationNumber,
      nameModel: vehicle.nameModel,
      type: vehicle.type,
      capacity: vehicle.capacity,
      odometer: String(vehicle.odometer),
      acquisitionCost: String(vehicle.acquisitionCost),
      status: vehicle.status,
      region: vehicle.region || 'Gandhinagar',
    })
    setFormError('')
    setOpen(true)
  }

  const handleAddClick = () => {
    setEditingVehicle(null)
    setForm(emptyForm)
    setFormError('')
    setOpen(true)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    
    const vehicleData = {
      ...form,
      odometer: Number(form.odometer) || 0,
      acquisitionCost: Number(form.acquisitionCost) || 0,
      capacityKg: parseCapacityKg(form.capacity),
    }

    if (editingVehicle) {
      const result = await dispatch(
        patchVehicle({
          id: editingVehicle.id,
          data: vehicleData,
        }),
      )
      if (patchVehicle.fulfilled.match(result)) {
        setOpen(false)
        setEditingVehicle(null)
        setForm(emptyForm)
      } else {
        setFormError(result.payload || 'Failed to update vehicle')
      }
    } else {
      const result = await dispatch(addVehicle(vehicleData))
      if (addVehicle.fulfilled.match(result)) {
        setOpen(false)
        setForm(emptyForm)
      } else {
        setFormError(result.payload || 'Failed to add vehicle')
      }
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Select
            label="Type"
            value={filters.type}
            onChange={(e) => dispatch(setVehicleFilters({ type: e.target.value }))}
            options={typeOptions}
            className="min-w-[140px]"
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => dispatch(setVehicleFilters({ status: e.target.value }))}
            options={statusOptions}
            className="min-w-[140px]"
          />
          <Input
            label="Search"
            placeholder="Search reg. no..."
            value={filters.search}
            onChange={(e) => dispatch(setVehicleFilters({ search: e.target.value }))}
            className="min-w-[200px]"
          />
        </div>
        {!isReadOnly && (
          <Button onClick={handleAddClick}>
            <Plus size={16} /> Add Vehicle
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-700 bg-surface-900">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
              <th className="px-3 py-3 font-medium">Reg. No. (Unique)</th>
              <th className="px-3 py-3 font-medium">Name/Model</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Capacity</th>
              <th className="px-3 py-3 font-medium">Odometer</th>
              <th className="px-3 py-3 font-medium">Acq. Cost</th>
              <th className="px-3 py-3 font-medium">Status</th>
              {!isReadOnly && <th className="px-3 py-3 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <VehicleRow
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={handleEditClick}
                isReadOnly={isReadOnly}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-accent">
        Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip
        Dispatcher
      </p>
      {error ? <p className="text-sm text-status-cancelled">{error}</p> : null}

      <Modal open={open} title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Registration Number"
            value={form.registrationNumber}
            onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            required
            disabled={!!editingVehicle}
          />
          <Input
            label="Name / Model"
            value={form.nameModel}
            onChange={(e) => setForm({ ...form, nameModel: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={VEHICLE_TYPES}
            />
            <Input
              label="Capacity"
              placeholder="500 kg"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Odometer"
              type="number"
              value={form.odometer}
              onChange={(e) => setForm({ ...form, odometer: e.target.value })}
            />
            <Input
              label="Acquisition Cost"
              type="number"
              value={form.acquisitionCost}
              onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
            />
          </div>
          {editingVehicle && (
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={Object.values(VEHICLE_STATUS)}
            />
          )}
          {formError ? <p className="text-sm text-status-cancelled">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default memo(Fleet)

