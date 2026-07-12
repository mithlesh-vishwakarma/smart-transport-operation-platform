import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import {
  fetchFuelLogs,
  createFuelLog,
  fetchExpenses,
  createExpense,
} from '../../api'
import { mockFuelLogs, mockExpenses } from '../../data/mockData'

export const loadFuelLogs = createAsyncThunk('fuel/loadLogs', async (_, { rejectWithValue }) => {
  try {
    return await fetchFuelLogs()
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const addFuelLog = createAsyncThunk('fuel/addLog', async (payload, { rejectWithValue }) => {
  try {
    return await createFuelLog(payload)
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const loadExpenses = createAsyncThunk('fuel/loadExpenses', async (_, { rejectWithValue }) => {
  try {
    return await fetchExpenses()
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const addExpense = createAsyncThunk('fuel/addExpense', async (payload, { rejectWithValue }) => {
  try {
    return await createExpense(payload)
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

const fuelSlice = createSlice({
  name: 'fuel',
  initialState: {
    logs: mockFuelLogs,
    expenses: mockExpenses,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFuelLogs.fulfilled, (state, action) => {
        state.logs = action.payload
      })
      .addCase(addFuelLog.fulfilled, (state, action) => {
        state.logs.unshift(action.payload)
      })
      .addCase(loadExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload)
      })
  },
})

export const selectFuelLogs = (state) => state.fuel.logs
export const selectExpenses = (state) => state.fuel.expenses

export const selectTotalOperationalCost = createSelector(
  [selectFuelLogs, (state) => state.maintenance.items],
  (logs, maintenance) => {
    const fuelTotal = logs.reduce((sum, log) => sum + Number(log.fuelCost || 0), 0)
    const maintTotal = maintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0)
    return fuelTotal + maintTotal
  },
)

export default fuelSlice.reducer
