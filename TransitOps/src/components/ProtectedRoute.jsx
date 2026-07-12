import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectAuth, selectUserRole } from '../store/slices/authSlice'
import { ROLE_ACCESS, ROLE_HOME } from '../utils/constants'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppSelector(selectAuth)
  const role = useAppSelector(selectUserRole)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const allowedPaths = ROLE_ACCESS[role] || []
  const currentPath = location.pathname

  // Allow the base path / or check if currentPath matches or starts with any of the allowed subpaths
  const isAllowed =
    currentPath === '/' ||
    allowedPaths.some((p) => currentPath === p || currentPath.startsWith(p + '/'))

  if (!isAllowed) {
    const homePath = ROLE_HOME[role] || '/dashboard'
    return <Navigate to={homePath} replace />
  }

  return children
}
