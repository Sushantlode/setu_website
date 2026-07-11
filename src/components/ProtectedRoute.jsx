import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { AppBootSkeleton } from "./AppSkeleton"

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AppBootSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
