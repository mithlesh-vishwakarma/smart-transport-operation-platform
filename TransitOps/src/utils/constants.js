export const ROLES = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
}

export const ROLE_HOME = {
  [ROLES.FLEET_MANAGER]: '/fleet',
  [ROLES.DISPATCHER]: '/dashboard',
  [ROLES.SAFETY_OFFICER]: '/drivers',
  [ROLES.FINANCIAL_ANALYST]: '/fuel',
}

export const ROLE_ACCESS = {
  [ROLES.FLEET_MANAGER]: ['/fleet', '/maintenance', '/dashboard', '/settings'],
  [ROLES.DISPATCHER]: ['/dashboard', '/trips', '/fleet', '/drivers', '/settings'],
  [ROLES.SAFETY_OFFICER]: ['/drivers', '/dashboard', '/settings'],
  [ROLES.FINANCIAL_ANALYST]: ['/fuel', '/analytics', '/dashboard', '/settings'],
}

export const VEHICLE_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
}

export const DRIVER_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
}

export const TRIP_STATUS = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const MAINTENANCE_STATUS = {
  ACTIVE: 'Active',
  IN_SHOP: 'In Shop',
  COMPLETED: 'Completed',
}

export const VEHICLE_TYPES = ['Van', 'Truck', 'Mini', 'Bus']

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Fleet', path: '/fleet', icon: 'Truck' },
  { label: 'Drivers', path: '/drivers', icon: 'Users' },
  { label: 'Trips', path: '/trips', icon: 'Route' },
  { label: 'Maintenance', path: '/maintenance', icon: 'Wrench' },
  { label: 'Fuel & Expenses', path: '/fuel', icon: 'Fuel' },
  { label: 'Analytics', path: '/analytics', icon: 'BarChart3' },
  { label: 'Settings', path: '/settings', icon: 'Settings' },
]

export const RBAC_MATRIX = [
  {
    role: ROLES.FLEET_MANAGER,
    fleet: '✓',
    drivers: '✓',
    trips: '—',
    fuel: '—',
    analytics: '✓',
  },
  {
    role: ROLES.DISPATCHER,
    fleet: 'view',
    drivers: '—',
    trips: '✓',
    fuel: '—',
    analytics: '—',
  },
  {
    role: ROLES.SAFETY_OFFICER,
    fleet: '—',
    drivers: '✓',
    trips: 'view',
    fuel: '—',
    analytics: '—',
  },
  {
    role: ROLES.FINANCIAL_ANALYST,
    fleet: 'view',
    drivers: '—',
    trips: '—',
    fuel: '✓',
    analytics: '✓',
  },
]
