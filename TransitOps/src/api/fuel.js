import { apiClient, delay, isMockMode } from './client'
import { mockFuelLogs, mockExpenses } from '../data/mockData'

let localFuel = [...mockFuelLogs]
let localExpenses = [...mockExpenses]

/**
 * GET /fuel-logs
 */
export const fetchFuelLogs = async () => {
  if (isMockMode()) {
    await delay()
    return [...localFuel]
  }
  const { data } = await apiClient.get('/fuel-logs')
  return data
}

/**
 * POST /fuel-logs
 */
export const createFuelLog = async (payload) => {
  if (isMockMode()) {
    await delay()
    const log = { id: `f${Date.now()}`, ...payload }
    localFuel = [log, ...localFuel]
    return log
  }
  const { data } = await apiClient.post('/fuel-logs', payload)
  return data
}

/**
 * GET /expenses
 */
export const fetchExpenses = async () => {
  if (isMockMode()) {
    await delay()
    return [...localExpenses]
  }
  const { data } = await apiClient.get('/expenses')
  return data
}

/**
 * POST /expenses
 */
export const createExpense = async (payload) => {
  if (isMockMode()) {
    await delay()
    const expense = { id: `e${Date.now()}`, ...payload }
    localExpenses = [expense, ...localExpenses]
    return expense
  }
  const { data } = await apiClient.post('/expenses', payload)
  return data
}
