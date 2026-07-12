import { apiClient, delay, isMockMode } from './client'
import {
  mockAnalytics,
  mockDashboardKpis,
  mockVehicleStatusBars,
  mockSettings,
} from '../data/mockData'

/**
 * GET /dashboard/kpis?vehicleType=&status=&region=
 */
export const fetchDashboard = async (params = {}) => {
  if (isMockMode()) {
    await delay()
    return {
      kpis: mockDashboardKpis,
      vehicleStatus: mockVehicleStatusBars,
      filters: params,
    }
  }
  const { data } = await apiClient.get('/dashboard/kpis', { params })
  return data
}

/**
 * GET /analytics
 */
export const fetchAnalytics = async () => {
  if (isMockMode()) {
    await delay()
    return { ...mockAnalytics }
  }
  const { data } = await apiClient.get('/analytics')
  return data
}

/**
 * GET /analytics/export?format=csv
 */
export const exportAnalytics = async (format = 'csv') => {
  if (isMockMode()) {
    await delay()
    return {
      content:
        'metric,value\nFuel Efficiency,8.4\nFleet Utilization,81\nOperational Cost,34070\nVehicle ROI,14.2\n',
      filename: `transitops-analytics.${format}`,
    }
  }
  const { data } = await apiClient.get('/analytics/export', { params: { format } })
  return data
}

/**
 * GET /settings
 */
export const fetchSettings = async () => {
  if (isMockMode()) {
    await delay()
    return { ...mockSettings }
  }
  const { data } = await apiClient.get('/settings')
  return data
}

/**
 * PUT /settings
 */
export const updateSettings = async (payload) => {
  if (isMockMode()) {
    await delay()
    return { ...mockSettings, ...payload }
  }
  const { data } = await apiClient.put('/settings', payload)
  return data
}
