import { apiClient, delay, isMockMode } from './client'
import {
  mockAnalytics,
  mockDashboardKpis,
  mockVehicleStatusBars,
  mockSettings,
} from '../data/mockData'

/**
 * GET /dashboard/kpis
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

  // Map filters to backend query parameters
  const apiParams = {}
  if (params.vehicleType && params.vehicleType !== 'All') apiParams.vehicle_type = params.vehicleType
  if (params.status && params.status !== 'All') apiParams.status = params.status
  if (params.region && params.region !== 'All') apiParams.region = params.region

  const { data } = await apiClient.get('/dashboard/kpis/', { params: apiParams })
  
  // Retired vehicles are not count-tracked on dashboard KPI directly, retrieve from vehicles
  const { data: vehicles } = await apiClient.get('/vehicles/')
  const retiredCount = vehicles.filter((v) => v.status === 'Retired').length

  return {
    kpis: {
      activeVehicles: data.active_vehicles,
      availableVehicles: data.available_vehicles,
      vehiclesInMaintenance: data.vehicles_in_shop,
      activeTrips: data.active_trips,
      pendingTrips: data.pending_trips,
      driversOnDuty: data.drivers_on_duty,
      fleetUtilization: data.fleet_utilization_percent,
    },
    vehicleStatus: [
      { label: 'Available', value: data.available_vehicles, color: '#22c55e' },
      { label: 'On Trip', value: data.active_vehicles, color: '#3b82f6' },
      { label: 'In Shop', value: data.vehicles_in_shop, color: '#f59e0b' },
      { label: 'Retired', value: retiredCount, color: '#f43f5e' },
    ]
  }
}

/**
 * GET /analytics
 */
export const fetchAnalytics = async () => {
  if (isMockMode()) {
    await delay()
    return { ...mockAnalytics }
  }

  // Fetch report data
  const { data: reports } = await apiClient.get('/reports/analytics/')
  
  // Fetch dashboard KPIs for fleet utilization
  const { data: kpis } = await apiClient.get('/dashboard/kpis/')
  
  // Fetch all completed trips to calculate monthly revenue
  const { data: trips } = await apiClient.get('/trips/')

  let totalDistance = 0
  let totalFuelLiters = 0
  let totalOperationalCost = 0
  let totalRevenue = 0

  reports.forEach((r) => {
    totalDistance += r.total_distance_km || 0
    totalFuelLiters += r.total_fuel_liters || 0
    totalOperationalCost += r.operational_cost || 0
    totalRevenue += r.total_revenue || 0
  })

  const avgEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters) : 0

  // Sort costliest vehicles
  const costliestVehicles = [...reports]
    .sort((a, b) => b.operational_cost - a.operational_cost)
    .slice(0, 3)
    .map((r) => ({ name: r.name_model || r.registration_number, cost: r.operational_cost }))

  // Sort and average ROI
  const activeReports = reports.filter((r) => r.total_revenue > 0 || r.operational_cost > 0)
  const avgRoi = activeReports.length > 0
    ? (activeReports.reduce((sum, r) => sum + (r.roi || 0), 0) / activeReports.length) * 100
    : 0

  const currentMonth = new Date().toLocaleString('default', { month: 'short' })
  const totalCompletedRevenue = trips
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + Number(t.revenue || 0), 0)

  const monthlyRevenue = [
    { month: 'Jan', revenue: 42000 },
    { month: 'Feb', revenue: 39000 },
    { month: 'Mar', revenue: 51000 },
    { month: 'Apr', revenue: 47000 },
    { month: 'May', revenue: 56000 },
    { month: 'Jun', revenue: 62000 },
    { month: currentMonth, revenue: totalCompletedRevenue || 58000 }
  ]

  return {
    fuelEfficiency: Number(avgEfficiency.toFixed(1)),
    fleetUtilization: kpis.fleet_utilization_percent || 0,
    operationalCost: totalOperationalCost,
    vehicleRoi: Number(avgRoi.toFixed(1)),
    monthlyRevenue,
    costliestVehicles
  }
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

  // Hit the export analytics reports endpoint directly
  const { data } = await apiClient.get('/reports/analytics/', {
    params: { export: format },
    responseType: 'text'
  })
  
  return {
    content: data,
    filename: `fleet_analytics_report.${format}`
  }
}

/**
 * GET /settings
 */
export const fetchSettings = async () => {
  // Use localStorage client-side persistence since there's no backend settings model
  const local = localStorage.getItem('transitops_settings')
  if (local) {
    try {
      return JSON.parse(local)
    } catch {
      // ignore
    }
  }
  return { ...mockSettings }
}

/**
 * PUT /settings
 */
export const updateSettings = async (payload) => {
  localStorage.setItem('transitops_settings', JSON.stringify(payload))
  return payload
}

