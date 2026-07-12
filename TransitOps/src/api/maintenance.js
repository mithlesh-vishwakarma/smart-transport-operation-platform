import { apiClient, delay, isMockMode } from './client'
import { mockMaintenance } from '../data/mockData'

let localMaintenance = [...mockMaintenance]

/**
 * GET /maintenance
 */
export const fetchMaintenance = async () => {
  if (isMockMode()) {
    await delay()
    return [...localMaintenance]
  }
  const { data } = await apiClient.get('/maintenance')
  return data
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
  const { data } = await apiClient.post('/maintenance', payload)
  return data
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
  const { data } = await apiClient.patch(`/maintenance/${id}`, payload)
  return data
}
