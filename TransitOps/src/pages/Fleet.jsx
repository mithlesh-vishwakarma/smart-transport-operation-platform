import { memo, useEffect, useMemo, useState } from 'react'
import { Plus, Edit, FileText, Trash2 } from 'lucide-react'
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
import { fetchVehicleDocuments, createVehicleDocument, deleteVehicleDocument } from '../api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/ui/StatusBadge'

const VehicleRow = memo(function VehicleRow({ vehicle, onEdit, onManageDocs, isReadOnly }) {
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
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
              className="text-info hover:text-info/80 cursor-pointer"
              title="Edit Vehicle"
            >
              <Edit size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onManageDocs(vehicle)}
            className="text-ink-300 hover:text-ink-100 cursor-pointer"
            title="Manage Documents"
          >
            <FileText size={16} />
          </button>
        </div>
      </td>
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

  const [docsModalVehicle, setDocsModalVehicle] = useState(null)
  const [docsList, setDocsList] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [newDoc, setNewDoc] = useState({ documentName: '', documentNumber: '', expiryDate: '' })

  useEffect(() => {
    if (docsModalVehicle) {
      setDocsLoading(true)
      fetchVehicleDocuments(docsModalVehicle.id)
        .then((data) => {
          setDocsList(data)
          setDocsLoading(false)
        })
        .catch(() => setDocsLoading(false))
    }
  }, [docsModalVehicle])

  const handleManageDocsClick = (vehicle) => {
    setDocsModalVehicle(vehicle)
    setNewDoc({ documentName: '', documentNumber: '', expiryDate: '' })
  }

  const handleAddDoc = async (e) => {
    e.preventDefault()
    if (!newDoc.documentName || !newDoc.documentNumber || !newDoc.expiryDate) return
    try {
      const doc = await createVehicleDocument({
        vehicleId: docsModalVehicle.id,
        ...newDoc,
      })
      setDocsList((prev) => [...prev, doc])
      setNewDoc({ documentName: '', documentNumber: '', expiryDate: '' })
    } catch (err) {
      console.error('Error creating document', err)
    }
  }

  const handleDeleteDoc = async (docId) => {
    try {
      await deleteVehicleDocument(docId)
      setDocsList((prev) => prev.filter((d) => d.id !== docId))
    } catch (err) {
      console.error('Error deleting document', err)
    }
  }

  const isReadOnly = role === ROLES.DISPATCHER || role === ROLES.FINANCIAL_ANALYST

  useEffect(() => {
    dispatch(loadVehicles(filters))
  }, [dispatch, filters])

  const typeOptions = useMemo(() => ['All', ...VEHICLE_TYPES], [])
  const statusOptions = useMemo(() => ['All', ...Object.values(VEHICLE_STATUS)], [])

  const [sortField, setSortField] = useState('registrationNumber')
  const [sortOrder, setSortOrder] = useState('asc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedVehicles = useMemo(() => {
    const list = [...vehicles]
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
  }, [vehicles, sortField, sortOrder])

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
              {renderSortHeader('Reg. No. (Unique)', 'registrationNumber')}
              {renderSortHeader('Name/Model', 'nameModel')}
              {renderSortHeader('Type', 'type')}
              {renderSortHeader('Capacity', 'capacityKg')}
              {renderSortHeader('Odometer', 'odometer')}
              {renderSortHeader('Acq. Cost', 'acquisitionCost')}
              {renderSortHeader('Status', 'status')}
              <th className="px-3 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedVehicles.map((vehicle) => (
              <VehicleRow
                key={vehicle.id}
                vehicle={vehicle}
                onEdit={handleEditClick}
                onManageDocs={handleManageDocsClick}
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

      {docsModalVehicle && (
        <Modal
          open={!!docsModalVehicle}
          onClose={() => setDocsModalVehicle(null)}
          title={`Documents: ${docsModalVehicle.registrationNumber}`}
        >
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {docsLoading ? (
                <p className="text-sm text-ink-300">Loading documents...</p>
              ) : docsList.length === 0 ? (
                <p className="text-sm text-ink-400 italic">No documents found for this vehicle.</p>
              ) : (
                docsList.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-surface-700 bg-surface-850"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-ink-100">{doc.document_name}</h4>
                      <p className="text-xs text-ink-300 mt-0.5">
                        No: {doc.document_number} | Expiry: {doc.expiry_date}
                      </p>
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-status-cancelled hover:text-status-cancelled/80 cursor-pointer p-1.5 rounded-md hover:bg-surface-800"
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isReadOnly && (
              <form onSubmit={handleAddDoc} className="border-t border-surface-700 pt-3 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-300">Add Document</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Document Name"
                    placeholder="e.g. Insurance, Permit"
                    value={newDoc.documentName}
                    onChange={(e) => setNewDoc({ ...newDoc, documentName: e.target.value })}
                    required
                  />
                  <Input
                    label="Document Number"
                    placeholder="e.g. INS-998822"
                    value={newDoc.documentNumber}
                    onChange={(e) => setNewDoc({ ...newDoc, documentNumber: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Expiry Date"
                  type="date"
                  value={newDoc.expiryDate}
                  onChange={(e) => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                  required
                />
                <Button type="submit" className="w-full text-xs">
                  Save Document
                </Button>
              </form>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default memo(Fleet)

