import { apiClient, delay, isMockMode } from './client'
import { mockVehicles } from '../data/mockData'

let localVehicles = [...mockVehicles]

const mapBackendVehicle = (v) => ({
  id: v.id,
  registrationNumber: v.registration_number,
  nameModel: v.name_model,
  type: v.vehicle_type,
  capacity: v.max_load_capacity >= 1000 ? `${v.max_load_capacity / 1000} Ton` : `${v.max_load_capacity} kg`,
  capacityKg: v.max_load_capacity,
  odometer: v.odometer,
  acquisitionCost: Number(v.acquisition_cost),
  status: v.status,
  region: 'Gandhinagar'
})

const mapFrontendVehicle = (v) => ({
  registration_number: v.registrationNumber,
  name_model: v.nameModel,
  vehicle_type: v.type,
  max_load_capacity: v.capacityKg,
  odometer: v.odometer,
  acquisition_cost: v.acquisitionCost,
  status: v.status
})

/**
 * GET /vehicles?type=&status=&search=
 */
export const fetchVehicles = async (params = {}) => {
  if (isMockMode()) {
    await delay()
    let list = [...localVehicles]
    if (params.type && params.type !== 'All') {
      list = list.filter((v) => v.type === params.type)
    }
    if (params.status && params.status !== 'All') {
      list = list.filter((v) => v.status === params.status)
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      list = list.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(q) ||
          v.nameModel.toLowerCase().includes(q),
      )
    }
    return list
  }
  
  // DRF search mapping
  const apiParams = {}
  if (params.status && params.status !== 'All') apiParams.status = params.status
  if (params.type && params.type !== 'All') apiParams.vehicle_type = params.type
  if (params.search) apiParams.search = params.search

  const { data } = await apiClient.get('/vehicles/', { params: apiParams })
  return data.map(mapBackendVehicle)
}

/**
 * POST /vehicles
 */
export const createVehicle = async (payload) => {
  if (isMockMode()) {
    await delay()
    const exists = localVehicles.some(
      (v) => v.registrationNumber.toLowerCase() === payload.registrationNumber.toLowerCase(),
    )
    if (exists) {
      throw new Error('Registration number must be unique')
    }
    const vehicle = {
      id: `v${Date.now()}`,
      ...payload,
      capacityKg: payload.capacityKg ?? 0,
    }
    localVehicles = [vehicle, ...localVehicles]
    return vehicle
  }

  const { data } = await apiClient.post('/vehicles/', mapFrontendVehicle(payload))
  return mapBackendVehicle(data)
}

/**
 * PUT /vehicles/:id
 */
export const updateVehicle = async (id, payload) => {
  if (isMockMode()) {
    await delay()
    localVehicles = localVehicles.map((v) => (v.id === id ? { ...v, ...payload } : v))
    return localVehicles.find((v) => v.id === id)
  }
  const { data } = await apiClient.put(`/vehicles/${id}/`, mapFrontendVehicle(payload))
  return mapBackendVehicle(data)
}

/**
 * DELETE /vehicles/:id
 */
export const deleteVehicle = async (id) => {
  if (isMockMode()) {
    await delay()
    localVehicles = localVehicles.filter((v) => v.id !== id)
    return { success: true }
  }
  const { data } = await apiClient.delete(`/vehicles/${id}/`)
  return data
}

