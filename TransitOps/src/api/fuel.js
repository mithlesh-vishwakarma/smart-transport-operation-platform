import { apiClient, delay, isMockMode } from './client'
import { mockFuelLogs, mockExpenses } from '../data/mockData'

let localFuel = [...mockFuelLogs]
let localExpenses = [...mockExpenses]

const mapBackendFuelLog = (f) => ({
  id: f.id,
  vehicleId: f.vehicle,
  vehicleName: f.vehicle_name || 'Unknown',
  date: f.date,
  liters: f.liters,
  fuelCost: Number(f.cost)
})

const mapFrontendFuelLog = (f) => ({
  vehicle: f.vehicleId,
  liters: Number(f.liters),
  cost: Number(f.fuelCost),
  date: f.date
})

const mapBackendExpense = (e) => ({
  id: e.id,
  tripCode: e.description && e.description.includes('Trip ') ? e.description.split(' ')[1] : 'Misc',
  vehicleName: e.vehicle_name || 'Unknown',
  toll: e.expense_type === 'Toll' ? Number(e.cost) : 0,
  other: e.expense_type === 'Other' ? Number(e.cost) : 0,
  maintenanceLinked: e.expense_type === 'Maintenance' ? Number(e.cost) : 0,
  status: 'Completed'
})

const mapFrontendExpense = (e) => {
  let expenseType = 'Other'
  let cost = 0
  if (e.toll > 0) {
    expenseType = 'Toll'
    cost = e.toll
  } else if (e.maintenanceLinked > 0) {
    expenseType = 'Maintenance'
    cost = e.maintenanceLinked
  } else if (e.other > 0) {
    expenseType = 'Other'
    cost = e.other
  }

  return {
    expense_type: expenseType,
    cost: Number(cost),
    description: e.tripCode ? `Trip ${e.tripCode}` : 'Miscellaneous Expense',
    date: new Date().toISOString().slice(0, 10)
  }
}

/**
 * GET /fuel-logs
 */
export const fetchFuelLogs = async () => {
  if (isMockMode()) {
    await delay()
    return [...localFuel]
  }
  const { data } = await apiClient.get('/fuel-logs/')
  return data.map(mapBackendFuelLog)
}

/**
 * POST /fuel-logs
 */
export const createFuelLog = async (payload) => {
  if (isMockMode()) {
    await delay()
    const log = { id: `f${Date.now()}`, ...payload }
    localFuel = [log, ...localFuel]
    return log
  }
  const { data } = await apiClient.post('/fuel-logs/', mapFrontendFuelLog(payload))
  return mapBackendFuelLog(data)
}

/**
 * GET /expenses
 */
export const fetchExpenses = async () => {
  if (isMockMode()) {
    await delay()
    return [...localExpenses]
  }
  const { data } = await apiClient.get('/expenses/')
  return data.map(mapBackendExpense)
}

/**
 * POST /expenses
 */
export const createExpense = async (payload) => {
  if (isMockMode()) {
    await delay()
    const expense = { id: `e${Date.now()}`, ...payload }
    localExpenses = [expense, ...localExpenses]
    return expense
  }

  // Prefer vehicleId if passed directly, otherwise fall back to vehicle name lookup
  let vehicleId = payload.vehicleId
  if (!vehicleId) {
    const { data: vehicles } = await apiClient.get('/vehicles/')
    const matchedVehicle = vehicles.find(
      (v) =>
        v.name_model?.toLowerCase().includes(payload.vehicleName?.toLowerCase()) ||
        v.registration_number?.toLowerCase().includes(payload.vehicleName?.toLowerCase())
    )
    vehicleId = matchedVehicle ? matchedVehicle.id : (vehicles[0] ? vehicles[0].id : 1)
  }

  const expensePayload = mapFrontendExpense(payload)
  expensePayload.vehicle = vehicleId

  const { data } = await apiClient.post('/expenses/', expensePayload)
  return mapBackendExpense(data)
}

