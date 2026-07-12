import { apiClient } from './client'

/**
 * Fetch all documents associated with a specific vehicle ID.
 */
export const fetchVehicleDocuments = async (vehicleId) => {
  const { data } = await apiClient.get('/documents/')
  // Filter locally by vehicle relationship link
  return data.filter((doc) => doc.vehicle === vehicleId)
}

/**
 * Create a new document linked to a vehicle.
 */
export const createVehicleDocument = async (payload) => {
  const { data } = await apiClient.post('/documents/', {
    vehicle: payload.vehicleId,
    document_name: payload.documentName,
    document_number: payload.documentNumber,
    expiry_date: payload.expiryDate,
    file_path: payload.filePath || '',
  })
  return data
}

/**
 * Delete a specific vehicle document by ID.
 */
export const deleteVehicleDocument = async (id) => {
  await apiClient.delete(`/documents/${id}/`)
}
