import { Link, useLocation, useNavigate } from "react-router-dom"
import { Smartphone, ArrowRight } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function RegisterCompletePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, session } = useAuth()
  const { mobile, firstName, lastName } = location.state || {}

  if (!mobile || !firstName) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-setu-cream px-4">
        <Link to="/register" className="text-setu-teal hover:underline">
          Start registration
        </Link>
      </div>
    )
  }

  const canEnterApp = isAuthenticated && Boolean(session?.token)

  return (
    <div className="flex min-h-svh items-center justify-center bg-setu-cream px-4 py-10">
      <div className="max-w-lg rounded-3xl border border-setu-stone/20 bg-white p-8 text-center shadow-sm">
        <h1 className="font-serif text-2xl text-setu-charcoal">
          Welcome, {firstName} {lastName}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-setu-muted">
          Your mobile <strong>+91 {mobile}</strong> is verified.{" "}
          {canEnterApp
            ? "Your session is active — you can open the SETU dashboard now. Plan payment can be finished in the mobile app."
            : "To complete subscription and payment (same as the mobile app), finish registration in the SETU app, then sign in here."}
        </p>

        <div className="mt-6 rounded-2xl bg-setu-sand/80 p-4 text-left">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 shrink-0 text-setu-teal" size={18} />
            <p className="text-sm text-setu-muted">
              {canEnterApp
                ? "Full Razorpay checkout stays in the mobile app for this phase. You already have access to the web module shell."
                : "Download the SETU app to complete plan selection, then sign in on web with the same number."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {canEnterApp ? (
            <button
              type="button"
              onClick={() => navigate("/app", { replace: true })}
              className="btn-primary btn-primary-dark inline-flex items-center justify-center gap-2"
            >
              Open dashboard
              <ArrowRight size={16} />
            </button>
          ) : (
            <Link
              to="/login"
              className="btn-primary btn-primary-dark inline-flex items-center justify-center gap-2"
            >
              Sign in
              <ArrowRight size={16} />
            </Link>
          )}
          <Link to="/" className="btn-primary btn-outline-dark inline-flex items-center justify-center">
            Back to website
          </Link>
        </div>
      </div>
    </div>
  )
}
