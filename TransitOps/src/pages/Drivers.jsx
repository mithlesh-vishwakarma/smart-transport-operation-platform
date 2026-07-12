import { memo, useEffect, useState } from 'react'
import { Plus, Edit } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  addDriver,
  loadDrivers,
  patchDriver,
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

const DriverRow = memo(function DriverRow({ driver, onEdit }) {
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
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={() => onEdit(driver)}
          className="text-info hover:text-info/80 cursor-pointer"
          title="Edit Driver"
        >
          <Edit size={16} />
        </button>
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
  const [editingDriver, setEditingDriver] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedDrivers = useMemo(() => {
    const list = [...drivers]
    list.sort((a, b) => {
      let valA = a[sortField] ?? ''
      let valB = b[sortField] ?? ''

      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [drivers, sortField, sortOrder])

  const renderSortHeader = (label, field) => {
    const isSorted = sortField === field
    return (
      <th
        onClick={() => handleSort(field)}
        className="px-3 py-3 font-medium cursor-pointer hover:text-ink-200 select-none text-xs uppercase tracking-wider"
      >
        <div className="flex items-center gap-1">
          {label}
          {isSorted ? (
            <span className="text-[10px]">{sortOrder === 'asc' ? '▲' : '▼'}</span>
          ) : (
            <span className="text-[10px] text-ink-400 opacity-20 hover:opacity-100">▲</span>
          )}
        </div>
      </th>
    )
  }

  useEffect(() => {
    dispatch(loadDrivers())
  }, [dispatch])

  const handleEditClick = (driver) => {
    setEditingDriver(driver)
    setForm({
      name: driver.name,
      licenseNo: driver.licenseNo,
      category: driver.category === 'LMV' ? 'LMV' : 'HMV',
      expiry: driver.expiry,
      contact: driver.contact,
      status: driver.status,
      safety: driver.safety,
      safetyScore: driver.safetyScore,
      tripCompletion: driver.tripCompletion,
    })
    setFormError('')
    setOpen(true)
  }

  const handleAddClick = () => {
    setEditingDriver(null)
    setForm(emptyForm)
    setFormError('')
    setOpen(true)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (form.contact.length !== 10) {
      setFormError('Contact number must be exactly 10 digits')
      return
    }
    if (editingDriver) {
      const result = await dispatch(
        patchDriver({
          id: editingDriver.id,
          data: form,
        }),
      )
      if (patchDriver.fulfilled.match(result)) {
        setOpen(false)
        setEditingDriver(null)
        setForm(emptyForm)
      } else {
        setFormError(result.payload || 'Failed to update driver')
      }
    } else {
      const result = await dispatch(addDriver(form))
      if (addDriver.fulfilled.match(result)) {
        setOpen(false)
        setForm(emptyForm)
      } else {
        setFormError(result.payload || 'Failed to add driver')
      }
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
        <Button onClick={handleAddClick}>
          <Plus size={16} /> Add Driver
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-700 bg-surface-900">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-surface-700 text-xs uppercase tracking-wider text-ink-400">
              {renderSortHeader('Driver', 'name')}
              {renderSortHeader('License No.', 'licenseNo')}
              {renderSortHeader('Category', 'category')}
              {renderSortHeader('Expiry', 'expiry')}
              {renderSortHeader('Contact', 'contact')}
              {renderSortHeader('Trip Compl.', 'tripCompletion')}
              {renderSortHeader('Safety', 'safetyScore')}
              {renderSortHeader('Status', 'status')}
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.map((driver) => (
              <DriverRow key={driver.id} driver={driver} onEdit={handleEditClick} />
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

      <Modal open={open} title={editingDriver ? 'Edit Driver' : 'Add Driver'} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            disabled={!!editingDriver}
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
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              if (val.length <= 10) {
                setForm({ ...form, contact: val })
              }
            }}
            required
            maxLength={10}
            pattern="\d{10}"
            placeholder="10-digit mobile number"
          />
          {editingDriver && (
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={Object.values(DRIVER_STATUS)}
            />
          )}
          {formError ? <p className="text-sm text-status-cancelled">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingDriver ? 'Update Driver' : 'Save Driver'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default memo(Drivers)
