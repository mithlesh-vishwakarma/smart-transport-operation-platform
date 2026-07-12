import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchMaintenance, createMaintenance, updateMaintenance } from '../../api'
import { MAINTENANCE_STATUS, VEHICLE_STATUS } from '../../utils/constants'
import { mockMaintenance } from '../../data/mockData'
import { patchVehicle } from './vehiclesSlice'

export const loadMaintenance = createAsyncThunk(
  'maintenance/load',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchMaintenance()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const addMaintenance = createAsyncThunk(
  'maintenance/add',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const record = await createMaintenance(payload)
      if (
        record.status === MAINTENANCE_STATUS.ACTIVE ||
        record.status === MAINTENANCE_STATUS.IN_SHOP
      ) {
        await dispatch(
          patchVehicle({
            id: record.vehicleId,
            data: { status: VEHICLE_STATUS.IN_SHOP },
          }),
        )
      }
      return record
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const closeMaintenance = createAsyncThunk(
  'maintenance/close',
  async ({ id, vehicleId }, { dispatch, rejectWithValue }) => {
    try {
      const record = await updateMaintenance(id, { status: MAINTENANCE_STATUS.COMPLETED })
      await dispatch(
        patchVehicle({ id: vehicleId, data: { status: VEHICLE_STATUS.AVAILABLE } }),
      )
      return record
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadMaintenance.fulfilled, (state, action) => {
        state.items = action.payload
      })
      .addCase(addMaintenance.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(closeMaintenance.fulfilled, (state, action) => {
        const idx = state.items.findIndex((m) => m.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
  },
})

export const selectMaintenance = (state) => state.maintenance.items

export default maintenanceSlice.reducer
