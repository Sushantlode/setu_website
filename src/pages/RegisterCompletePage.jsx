import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

/**
 * Legacy route — registration now finishes on /register/profile and goes to /app.
 * Keep this path so old bookmarks/deep links do not dead-end on payment messaging.
 */
export default function RegisterCompletePage() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { mobile, firstName } = location.state || {}

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  if (mobile && firstName) {
    return (
      <Navigate
        to="/register/profile"
        replace
        state={{ mobile, mobileAlreadyVerified: true }}
      />
    )
  }

  return <Navigate to="/register" replace />
}
