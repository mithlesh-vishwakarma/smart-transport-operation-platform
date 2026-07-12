import { apiClient, delay, isMockMode } from './client'
import { mockDrivers } from '../data/mockData'

let localDrivers = [...mockDrivers]

const mapBackendDriver = (d) => ({
  id: d.id,
  name: d.user?.username || 'Unknown',
  licenseNo: d.license_number,
  category: d.license_category === 'Class C' ? 'LMV' : 'HMV',
  expiry: d.license_expiry_date,
  contact: d.contact_number,
  tripCompletion: 92, // Stub completion rate
  safetyScore: Number(d.safety_score || 85),
  safety: d.status,
  status: d.status
})

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

  const apiParams = {}
  if (params.status && params.status !== 'All') apiParams.status = params.status
  if (params.search) apiParams.search = params.search

  const { data } = await apiClient.get('/drivers/', { params: apiParams })
  return data.map(mapBackendDriver)
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

  // To create a driver profile in the backend, we must register a User with role 'DRIVER'
  const registerPayload = {
    username: payload.name,
    email: `${payload.name.toLowerCase().replace(/\s+/g, '')}@transitops.in`,
    password: 'password', // Default temporary password
    role: 'DRIVER',
    license_number: payload.licenseNo,
    license_category: payload.category === 'LMV' ? 'Class C' : 'Class A',
    license_expiry_date: payload.expiry,
    contact_number: payload.contact
  }

  const { data: user } = await apiClient.post('/auth/register/', registerPayload)

  // Retrieve the generated driver profile
  const { data: drivers } = await apiClient.get('/drivers/')
  return drivers.find((d) => d.user?.id === user.id) || drivers[0]
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

  const updatePayload = {
    license_number: payload.licenseNo,
    license_category: payload.category === 'LMV' ? 'Class C' : 'Class A',
    license_expiry_date: payload.expiry,
    contact_number: payload.contact,
    status: payload.status
  }

  const { data } = await apiClient.put(`/drivers/${id}/`, updatePayload)
  return mapBackendDriver(data)
}

