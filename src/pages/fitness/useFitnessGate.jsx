import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { ensureFreshSession } from "../../api/auth"
import { fetchFitnessProfile } from "../../api/fitness"

/**
 * Ensures SETU auth + fitness profile exist before rendering tab screens.
 */
export function useFitnessGate() {
  const navigate = useNavigate()
  const { session, isAuthenticated } = useAuth()
  const [ready, setReady] = useState(false)
  const [auth, setAuth] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!isAuthenticated) {
        navigate("/login", { state: { from: "/app/fitness" }, replace: true })
        return
      }
      try {
        const fresh = await ensureFreshSession(session).catch(() => session)
        if (cancelled) return
        const nextAuth = {
          token: fresh?.token,
          refreshToken: fresh?.refreshToken,
        }
        setAuth(nextAuth)
        const profile = await fetchFitnessProfile(nextAuth)
        if (cancelled) return
        if (!profile) {
          navigate("/app/fitness/onboarding", { replace: true })
          return
        }
        setReady(true)
      } catch (err) {
        if (cancelled) return
        if (err?.requiresAuth || err?.status === 401) {
          navigate("/login", { state: { from: "/app/fitness" }, replace: true })
          return
        }
        if (err?.profileMissing) {
          navigate("/app/fitness/onboarding", { replace: true })
          return
        }
        setAuth({
          token: session?.token,
          refreshToken: session?.refreshToken,
        })
        setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, session, navigate])

  return { ready, auth }
}

export function FitnessGateLoader({ title = "Fitness" }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-[#10B981]">
      <Loader2 className="animate-spin" size={28} aria-label={`Loading ${title}`} />
    </div>
  )
}
