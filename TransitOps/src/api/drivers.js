import { apiClient, delay, isMockMode } from './client'
import { mockDrivers } from '../data/mockData'

let localDrivers = [...mockDrivers]

/**
 * GET /drivers?status=&search=
 */
export const fetchDrivers = async (params = {}) => {
  if (isMockMode()) {
    await delay()
    let list = [...localDrivers]
    if (params.status && params.status !== 'All') {
      list = list.filter((d) => d.status === params.status)
    }
    if (params.search) {
      const q = params.search.toLowerCase()
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.licenseNo.toLowerCase().includes(q),
      )
    }
    return list
  }
  const { data } = await apiClient.get('/drivers', { params })
  return data
}

/**
 * POST /drivers
 */
export const createDriver = async (payload) => {
  if (isMockMode()) {
    await delay()
    const driver = { id: `d${Date.now()}`, tripCompletion: 0, safetyScore: 80, ...payload }
    localDrivers = [driver, ...localDrivers]
    return driver
  }
  const { data } = await apiClient.post('/drivers', payload)
  return data
}

/**
 * PUT /drivers/:id
 */
export const updateDriver = async (id, payload) => {
  if (isMockMode()) {
    await delay()
    localDrivers = localDrivers.map((d) => (d.id === id ? { ...d, ...payload } : d))
    return localDrivers.find((d) => d.id === id)
  }
  const { data } = await apiClient.put(`/drivers/${id}`, payload)
  return data
}
