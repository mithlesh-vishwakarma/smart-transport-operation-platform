import { apiClient, delay, isMockMode } from './client'
import { mockTrips } from '../data/mockData'

let localTrips = [...mockTrips]

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
  const { data } = await apiClient.get('/trips', { params })
  return data
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
  const { data } = await apiClient.post('/trips', payload)
  return data
}

/**
 * PATCH /trips/:id/status
 * Body: { status, odometer?, fuelConsumed? }
 */
export const updateTripStatus = async (id, payload) => {
  if (isMockMode()) {
    await delay()
    localTrips = localTrips.map((t) => (t.id === id ? { ...t, ...payload } : t))
    return localTrips.find((t) => t.id === id)
  }
  const { data } = await apiClient.patch(`/trips/${id}/status`, payload)
  return data
}
