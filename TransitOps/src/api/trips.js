import { apiClient, delay, isMockMode } from './client'
import { mockTrips } from '../data/mockData'

let localTrips = [...mockTrips]

const mapBackendTrip = (t) => ({
  id: t.id,
  tripCode: `TR${String(t.id).padStart(3, '0')}`,
  source: t.source,
  destination: t.destination,
  vehicleId: t.vehicle,
  vehicleName: t.vehicle_name || 'Unassigned',
  driverId: t.driver,
  driverName: t.driver_name || 'Unassigned',
  cargoWeight: t.cargo_weight,
  plannedDistance: t.planned_distance,
  status: t.status,
  eta: t.status === 'Dispatched' ? '45 min' : '—',
  actualDistance: t.actual_distance,
  revenue: Number(t.revenue || 0)
})

const mapFrontendTrip = (t) => ({
  source: t.source,
  destination: t.destination,
  vehicle: t.vehicleId,
  driver: t.driverId,
  cargo_weight: Number(t.cargoWeight),
  planned_distance: Number(t.plannedDistance),
  status: t.status || 'Draft',
  revenue: Number(t.revenue || 0)
})

/**
 * GET /trips?status=
 */
export const fetchTrips = async (params = {}) => {
  if (isMockMode()) {
    await delay()
    let list = [...localTrips]
    if (params.status && params.status !== 'All') {
      list = list.filter((t) => t.status === params.status)
    }
    return list
  }
  
  const apiParams = {}
  if (params.status && params.status !== 'All') apiParams.status = params.status

  const { data } = await apiClient.get('/trips/', { params: apiParams })
  return data.map(mapBackendTrip)
}

/**
 * POST /trips
 */
export const createTrip = async (payload) => {
  if (isMockMode()) {
    await delay()
    const trip = {
      id: `t${Date.now()}`,
      tripCode: `TR${String(localTrips.length + 1).padStart(3, '0')}`,
      eta: '—',
      ...payload,
    }
    localTrips = [trip, ...localTrips]
    return trip
  }

  const { data } = await apiClient.post('/trips/', mapFrontendTrip(payload))
  return mapBackendTrip(data)
}

/**
 * PATCH /trips/:id/status -> calls custom post actions in Django backend
 */
export const updateTripStatus = async (id, payload) => {
  if (isMockMode()) {
    await delay()
    localTrips = localTrips.map((t) => (t.id === id ? { ...t, ...payload } : t))
    return localTrips.find((t) => t.id === id)
  }

  let endpoint = `/trips/${id}/`
  let method = 'patch'
  let postData = {}

  if (payload.status === 'Dispatched') {
    endpoint = `/trips/${id}/dispatch/`
    method = 'post'
  } else if (payload.status === 'Completed') {
    endpoint = `/trips/${id}/complete/`
    method = 'post'
    postData = { actual_distance: payload.actualDistance }
  } else if (payload.status === 'Cancelled') {
    endpoint = `/trips/${id}/cancel/`
    method = 'post'
  }

  const { data } = await apiClient({
    url: endpoint,
    method,
    data: postData
  })
  return mapBackendTrip(data)
}

