import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import { fetchVehicles, createVehicle, updateVehicle } from '../../api'
import { VEHICLE_STATUS } from '../../utils/constants'
import { mockVehicles } from '../../data/mockData'

export const loadVehicles = createAsyncThunk('vehicles/load', async (params, { rejectWithValue }) => {
  try {
    return await fetchVehicles(params)
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const addVehicle = createAsyncThunk('vehicles/add', async (payload, { rejectWithValue }) => {
  try {
    return await createVehicle(payload)
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const patchVehicle = createAsyncThunk(
  'vehicles/patch',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateVehicle(id, data)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState: {
    items: mockVehicles,
    filters: { type: 'All', status: 'All', search: '', region: 'All' },
    loading: false,
    error: null,
  },
  reducers: {
    setVehicleFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadVehicles.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadVehicles.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(loadVehicles.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(addVehicle.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(patchVehicle.fulfilled, (state, action) => {
        const idx = state.items.findIndex((v) => v.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
  },
})

export const { setVehicleFilters } = vehiclesSlice.actions

export const selectVehicles = (state) => state.vehicles.items
export const selectVehicleFilters = (state) => state.vehicles.filters

export const selectFilteredVehicles = createSelector(
  [selectVehicles, selectVehicleFilters],
  (items, filters) => {
    return items.filter((v) => {
      const typeOk = filters.type === 'All' || v.type === filters.type
      const statusOk = filters.status === 'All' || v.status === filters.status
      const regionOk = filters.region === 'All' || v.region === filters.region
      const q = filters.search.trim().toLowerCase()
      const searchOk =
        !q ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.nameModel.toLowerCase().includes(q)
      return typeOk && statusOk && regionOk && searchOk
    })
  },
)

export const selectDispatchableVehicles = createSelector([selectVehicles], (items) =>
  items.filter((v) => v.status === VEHICLE_STATUS.AVAILABLE),
)

export default vehiclesSlice.reducer
