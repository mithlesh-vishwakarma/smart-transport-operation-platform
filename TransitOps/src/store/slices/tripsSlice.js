import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchTrips, createTrip, updateTripStatus } from '../../api'
import { TRIP_STATUS, VEHICLE_STATUS, DRIVER_STATUS } from '../../utils/constants'
import { mockTrips } from '../../data/mockData'
import { patchVehicle } from './vehiclesSlice'
import { patchDriver } from './driversSlice'

export const loadTrips = createAsyncThunk('trips/load', async (params, { rejectWithValue }) => {
  try {
    return await fetchTrips(params)
  } catch (error) {
    return rejectWithValue(error.message)
  }
})

export const addTrip = createAsyncThunk(
  'trips/add',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const trip = await createTrip(payload)
      if (trip.status === TRIP_STATUS.DISPATCHED) {
        if (trip.vehicleId) {
          await dispatch(
            patchVehicle({ id: trip.vehicleId, data: { status: VEHICLE_STATUS.ON_TRIP } }),
          )
        }
        if (trip.driverId) {
          await dispatch(
            patchDriver({ id: trip.driverId, data: { status: DRIVER_STATUS.ON_TRIP } }),
          )
        }
      }
      return trip
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

export const changeTripStatus = createAsyncThunk(
  'trips/changeStatus',
  async ({ id, status, vehicleId, driverId, extra = {} }, { dispatch, rejectWithValue }) => {
    try {
      const trip = await updateTripStatus(id, { status, ...extra })

      if (status === TRIP_STATUS.DISPATCHED) {
        if (vehicleId) {
          await dispatch(patchVehicle({ id: vehicleId, data: { status: VEHICLE_STATUS.ON_TRIP } }))
        }
        if (driverId) {
          await dispatch(patchDriver({ id: driverId, data: { status: DRIVER_STATUS.ON_TRIP } }))
        }
      }

      if (status === TRIP_STATUS.COMPLETED || status === TRIP_STATUS.CANCELLED) {
        if (vehicleId) {
          await dispatch(
            patchVehicle({ id: vehicleId, data: { status: VEHICLE_STATUS.AVAILABLE } }),
          )
        }
        if (driverId) {
          await dispatch(
            patchDriver({ id: driverId, data: { status: DRIVER_STATUS.AVAILABLE } }),
          )
        }
      }

      return trip
    } catch (error) {
      return rejectWithValue(error.message)
    }
  },
)

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    items: mockTrips,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadTrips.pending, (state) => {
        state.loading = true
      })
      .addCase(loadTrips.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(loadTrips.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(addTrip.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(changeTripStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
  },
})

export const selectTrips = (state) => state.trips.items
export const selectRecentTrips = (state) => state.trips.items.slice(0, 6)

export default tripsSlice.reducer
