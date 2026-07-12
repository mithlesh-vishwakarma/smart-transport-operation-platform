import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { selectAuth } from '../store/slices/authSlice'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAppSelector(selectAuth)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
