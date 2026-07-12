import axios from 'axios'

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('transitops_token')
      localStorage.removeItem('transitops_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export const isMockMode = () => USE_MOCK

export const delay = (ms = 300) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
