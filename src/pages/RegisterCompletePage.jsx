import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { AppBootSkeleton } from "../components/AppSkeleton"

/**
 * Legacy route — registration finishes on /register/profile → /app.
 * Never render pay-in-app / "finish registration" copy here.
 */
export default function RegisterCompletePage() {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  const { mobile, firstName } = location.state || {}

  if (loading) {
    return <AppBootSkeleton />
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  // Old deep links / bookmarks may pass verified mobile (+ optional name).
  // Send them to finish name + confirm-trial-no-payment, not a dead-end.
  if (mobile) {
    return (
      <Navigate
        to="/register/profile"
        replace
        state={{
          mobile,
          mobileAlreadyVerified: true,
          ...(firstName ? { preferredFirstName: firstName } : {}),
        }}
      />
    )
  }

  return <Navigate to="/register" replace />
}
