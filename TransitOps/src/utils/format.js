export const formatNumber = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('en-IN')
}

export const formatCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('en-IN')
}

export const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const isLicenseExpired = (expiryDate) => {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiry < today
}

export const parseCapacityKg = (capacity) => {
  if (typeof capacity === 'number') return capacity
  if (!capacity) return 0
  const text = String(capacity).toLowerCase().trim()
  const num = parseFloat(text.replace(/[^\d.]/g, ''))
  if (Number.isNaN(num)) return 0
  if (text.includes('ton') || text.includes('t')) return num * 1000
  return num
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
