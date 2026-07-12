import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import { fetchDrivers, createDriver, updateDriver } from '../../api'
import { DRIVER_STATUS } from '../../utils/constants'
import { isLicenseExpired } from '../../utils/format'
import { mockDrivers } from '../../data/mockData'

export const loadDrivers = createAsyncThunk('drivers/load', async (params, { rejectWithValue }) => {
  try {
    return await fetchDrivers(params)
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const addDriver = createAsyncThunk('drivers/add', async (payload, { rejectWithValue }) => {
  try {
    return await createDriver(payload)
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const patchDriver = createAsyncThunk(
  'drivers/patch',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await updateDriver(id, data)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

const driversSlice = createSlice({
  name: 'drivers',
  initialState: {
    items: [],
    statusFilter: 'All',
    search: '',
    loading: false,
    error: null,
  },
  reducers: {
    setDriverStatusFilter(state, action) {
      state.statusFilter = action.payload
    },
    setDriverSearch(state, action) {
      state.search = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDrivers.pending, (state) => {
        state.loading = true
      })
      .addCase(loadDrivers.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(loadDrivers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addDriver.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(patchDriver.fulfilled, (state, action) => {
        const idx = state.items.findIndex((d) => d.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
  },
})

export const { setDriverStatusFilter, setDriverSearch } = driversSlice.actions

export const selectDrivers = (state) => state.drivers.items

export const selectFilteredDrivers = createSelector(
  [(state) => state.drivers.items, (state) => state.drivers.statusFilter, (state) => state.drivers.search],
  (items, statusFilter, search) =>
    items.filter((d) => {
      const statusOk = statusFilter === 'All' || d.status === statusFilter
      const q = search.trim().toLowerCase()
      const searchOk =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.licenseNo.toLowerCase().includes(q)
      return statusOk && searchOk
    }),
)

export const selectAssignableDrivers = createSelector([selectDrivers], (items) =>
  items.filter(
    (d) =>
      d.status === DRIVER_STATUS.AVAILABLE &&
      d.status !== DRIVER_STATUS.SUSPENDED &&
      !isLicenseExpired(d.expiry),
  ),
)

export default driversSlice.reducer
