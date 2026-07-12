import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import vehiclesReducer from './slices/vehiclesSlice'
import driversReducer from './slices/driversSlice'
import tripsReducer from './slices/tripsSlice'
import maintenanceReducer from './slices/maintenanceSlice'
import fuelReducer from './slices/fuelSlice'
import appDataReducer from './slices/appDataSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
    drivers: driversReducer,
    trips: tripsReducer,
    maintenance: maintenanceReducer,
    fuel: fuelReducer,
    appData: appDataReducer,
  },
})
