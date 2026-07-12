import { apiClient, delay, isMockMode } from './client'
import { mockMaintenance } from '../data/mockData'

let localMaintenance = [...mockMaintenance]

const mapBackendMaintenance = (m) => ({
  id: m.id,
  vehicleId: m.vehicle,
  vehicleName: m.vehicle_name || 'Unknown',
  serviceType: m.description,
  cost: Number(m.cost),
  date: m.date,
  status: m.is_active ? 'In Shop' : 'Completed'
})

const mapFrontendMaintenance = (m) => ({
  vehicle: m.vehicleId,
  description: m.serviceType,
  cost: Number(m.cost),
  date: m.date,
  is_active: m.status !== 'Completed'
})

/**
 * GET /maintenance
 */
export const fetchMaintenance = async () => {
  if (isMockMode()) {
    await delay()
    return [...localMaintenance]
  }
  const { data } = await apiClient.get('/maintenance/')
  return data.map(mapBackendMaintenance)
}

/**
 * POST /maintenance
 */
export const createMaintenance = async (payload) => {
  if (isMockMode()) {
    await delay()
    const record = { id: `m${Date.now()}`, ...payload }
    localMaintenance = [record, ...localMaintenance]
    return record
  }
  const { data } = await apiClient.post('/maintenance/', mapFrontendMaintenance(payload))
  return mapBackendMaintenance(data)
}

/**
 * PATCH /maintenance/:id
 */
export const updateMaintenance = async (id, payload) => {
  if (isMockMode()) {
    await delay()
    localMaintenance = localMaintenance.map((m) =>
      m.id === id ? { ...m, ...payload } : m,
    )
    return localMaintenance.find((m) => m.id === id)
  }
  const { data } = await apiClient.patch(`/maintenance/${id}/`, mapFrontendMaintenance(payload))
  return mapBackendMaintenance(data)
}

