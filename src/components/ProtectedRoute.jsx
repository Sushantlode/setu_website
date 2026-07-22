import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { AppBootSkeleton } from "./AppSkeleton"

export default function ProtectedRoute({ children }) {
  const { session, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AppBootSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const type = session?.accountType || "user"
  if (type === "vle") {
    return <Navigate to="/vle/dashboard" replace />
  }
  if (type === "district_coordinator") {
    return <Navigate to="/coordinator/dashboard" replace />
  }

  return children
}
