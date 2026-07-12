import { apiClient, delay, isMockMode } from './client'
import { ROLE_HOME, ROLES } from '../utils/constants'

/**
 * POST /auth/login
 * Body: { email, password, role }
 * Response: { token, user: { id, name, email, role } }
 */
export const loginRequest = async ({ email, password, role }) => {
  if (isMockMode()) {
    await delay()
    if (!email || !password) {
      const err = new Error('Invalid credentials. Account locked after 5 failed attempts.')
      err.code = 'INVALID_CREDENTIALS'
      throw err
    }
    const name = email.split('@')[0].replace(/\./g, ' ')
    const displayName = name
      .split(' ')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
    return {
      token: 'mock-jwt-token',
      user: {
        id: 'u1',
        name: displayName || 'Raven K.',
        email,
        role: role || ROLES.DISPATCHER,
        homePath: ROLE_HOME[role] || '/dashboard',
      },
    }
  }

  const { data } = await apiClient.post('/auth/login', { email, password, role })
  return data
}

/**
 * POST /auth/logout
 */
export const logoutRequest = async () => {
  if (isMockMode()) {
    await delay(100)
    return { success: true }
  }
  const { data } = await apiClient.post('/auth/logout')
  return data
}

/**
 * GET /auth/me
 */
export const fetchCurrentUser = async () => {
  if (isMockMode()) {
    const raw = localStorage.getItem('transitops_user')
    return raw ? JSON.parse(raw) : null
  }
  const { data } = await apiClient.get('/auth/me')
  return data
}
