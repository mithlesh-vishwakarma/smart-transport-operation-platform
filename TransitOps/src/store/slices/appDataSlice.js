import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchDashboard,
  fetchAnalytics,
  exportAnalytics,
  fetchSettings,
  updateSettings,
} from '../../api'
import {
  mockDashboardKpis,
  mockVehicleStatusBars,
  mockAnalytics,
  mockSettings,
} from '../../data/mockData'
import { RBAC_MATRIX } from '../../utils/constants'

export const loadDashboard = createAsyncThunk(
  'appData/dashboard',
  async (params, { rejectWithValue }) => {
    try {
      return await fetchDashboard(params)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const loadAnalytics = createAsyncThunk(
  'appData/analytics',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAnalytics()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const exportAnalyticsCsv = createAsyncThunk(
  'appData/export',
  async (_, { rejectWithValue }) => {
    try {
      return await exportAnalytics('csv')
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const loadSettings = createAsyncThunk(
  'appData/settings',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSettings()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const saveSettings = createAsyncThunk(
  'appData/saveSettings',
  async (payload, { rejectWithValue }) => {
    try {
      return await updateSettings(payload)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

const appDataSlice = createSlice({
  name: 'appData',
  initialState: {
    dashboard: {
      kpis: {
        activeVehicles: 0,
        availableVehicles: 0,
        vehiclesInMaintenance: 0,
        activeTrips: 0,
        pendingTrips: 0,
        driversOnDuty: 0,
        fleetUtilization: 0,
      },
      vehicleStatus: [],
      filters: { vehicleType: 'All', status: 'All', region: 'All' },
    },
    analytics: {
      fuelEfficiency: 0,
      fleetUtilization: 0,
      operationalCost: 0,
      vehicleRoi: 0,
      monthlyRevenue: [],
      costliestVehicles: [],
    },
    settings: {
      depotName: '',
      currency: 'INR (Rs)',
      distanceUnit: 'Kilometers',
    },
    rbac: RBAC_MATRIX,
    loading: false,
    error: null,
    saveMessage: null,
  },
  reducers: {
    setDashboardFilters(state, action) {
      state.dashboard.filters = { ...state.dashboard.filters, ...action.payload }
    },
    clearSaveMessage(state) {
      state.saveMessage = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboard.fulfilled, (state, action) => {
        state.dashboard.kpis = action.payload.kpis
        state.dashboard.vehicleStatus = action.payload.vehicleStatus
      })
      .addCase(loadAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.settings = action.payload
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.settings = action.payload
        state.saveMessage = 'Settings saved successfully'
      })
  },
})

export const { setDashboardFilters, clearSaveMessage } = appDataSlice.actions

export const selectDashboard = (state) => state.appData.dashboard
export const selectAnalytics = (state) => state.appData.analytics
export const selectSettings = (state) => state.appData.settings
export const selectRbac = (state) => state.appData.rbac

export default appDataSlice.reducer
