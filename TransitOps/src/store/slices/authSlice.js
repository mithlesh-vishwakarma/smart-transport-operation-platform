import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginRequest, logoutRequest } from '../../api'
import { ROLE_HOME, ROLES } from '../../utils/constants'

const savedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('transitops_user') || 'null')
  } catch {
    return null
  }
})()

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await loginRequest(credentials)
  } catch (error) {
    return rejectWithValue(error.message || 'Login failed')
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  await logoutRequest()
  localStorage.removeItem('transitops_token')
  localStorage.removeItem('transitops_user')
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    token: localStorage.getItem('transitops_token'),
    isAuthenticated: Boolean(savedUser && localStorage.getItem('transitops_token')),
    loading: false,
    error: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('transitops_token', action.payload.token)
        localStorage.setItem('transitops_user', JSON.stringify(action.payload.user))
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Invalid credentials. Account locked after 5 failed attempts.'
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
  },
})

export const { clearAuthError } = authSlice.actions

export const selectAuth = (state) => state.auth
export const selectUserRole = (state) => state.auth.user?.role || ROLES.DISPATCHER
export const selectHomePath = (state) =>
  ROLE_HOME[state.auth.user?.role] || '/dashboard'

export default authSlice.reducer
