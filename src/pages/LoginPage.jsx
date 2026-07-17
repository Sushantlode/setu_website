import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Loader2, Smartphone } from "lucide-react"
import { assets } from "../data/content"
import {
  loginWithOtp,
  sendLoginOtp,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from "../api/auth"
import { useAuth } from "../context/AuthContext"

const OTP_LENGTH = 6

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const isRegister = location.pathname.startsWith("/register")

  const [step, setStep] = useState("phone")
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [flow, setFlow] = useState("login")
  const [receiveUpdates, setReceiveUpdates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [errorCode, setErrorCode] = useState("")
  const notice = location.state?.notice || ""

  useEffect(() => {
    const prefilled = location.state?.mobile
    if (prefilled && /^[6-9][0-9]{9}$/.test(String(prefilled))) {
      setMobile(String(prefilled))
    }
  }, [location.state?.mobile])

  const redirectTo = location.state?.from || "/app"

  if (!authLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError("")
    setErrorCode("")

    const trimmed = mobile.trim()
    if (!/^[6-9][0-9]{9}$/.test(trimmed)) {
      setError("Enter a valid 10-digit Indian mobile number.")
      return
    }

    setLoading(true)
    try {
      // Sign-in uses POST /auth/otp/send (same as RN app).
      // Register uses POST /auth/register/send-otp.
      const result = isRegister
        ? await sendRegistrationOtp(trimmed, receiveUpdates)
        : await sendLoginOtp(trimmed)
      setMobile(trimmed)
      setFlow(result.kind)
      if (result.kind === "profile") {
        navigate("/register/profile", {
          state: {
            mobile: trimmed,
            mobileAlreadyVerified: result.mobileAlreadyVerified,
          },
        })
        return
      }
      setStep("otp")
    } catch (err) {
      setError(err.message || "Failed to send OTP.")
      setErrorCode(err.code || "")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError("")
    setErrorCode("")

    if (otp.length !== OTP_LENGTH) {
      setError("Enter the 6-digit OTP.")
      return
    }

    setLoading(true)
    try {
      if (flow === "login") {
        const session = await loginWithOtp(mobile, otp)
        login(session)
        navigate(redirectTo, { replace: true })
        return
      }

      await verifyRegistrationOtp(mobile, otp)
      navigate("/register/profile", { state: { mobile } })
    } catch (err) {
      setError(err.message || "OTP verification failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-safe-top page-safe-bottom min-h-svh bg-[#F7FAFF]">
      <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4 py-10 app-safe-x">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-setu-muted transition-colors hover:text-setu-charcoal"
        >
          <ArrowLeft size={16} />
          Back to website
        </Link>

        <div className="overflow-hidden rounded-[1.75rem] border border-[#D2DEFF] bg-white shadow-sm">
          <div className="bg-[#1C39BB] px-6 py-6 text-white sm:px-8">
            <img
              src={assets.logo}
              alt="SETU"
              className="mb-4 h-9 w-auto brightness-0 invert"
            />
            <h1 className="font-serif text-2xl sm:text-3xl">
              {isRegister ? "Join SETU" : "Sign in to SETU"}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Same mobile OTP login as the SETU app
            </p>
          </div>
          <div className="p-6 sm:p-8">

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-setu-charcoal">
                  Mobile number
                </span>
                <div className="flex overflow-hidden rounded-xl border border-[#D2DEFF] focus-within:border-[#1C39BB]">
                  <span className="flex items-center bg-[#EEF3FF] px-3 text-sm text-[#1C39BB]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-3 py-3 text-setu-charcoal outline-none"
                    placeholder="10-digit number"
                    autoComplete="tel"
                  />
                </div>
              </label>

              <label className="flex items-start gap-3 text-sm text-setu-muted">
                <input
                  type="checkbox"
                  checked={receiveUpdates}
                  onChange={(e) => setReceiveUpdates(e.target.checked)}
                  className="mt-1"
                />
                <span>Receive health updates and SETU program notifications</span>
              </label>

              {notice && !error && (
                <p className="text-sm text-[#1C39BB]">{notice}</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}

              {errorCode === "USER_NOT_FOUND" && !isRegister && (
                <Link
                  to="/register"
                  state={{ mobile: mobile.trim(), notice: "Create your SETU account to continue." }}
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#1C39BB] bg-white px-5 py-3 text-sm font-semibold text-[#1C39BB] transition-colors hover:bg-[#EEF3FF]"
                >
                  Create account
                </Link>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1C39BB] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-setu-muted">
                OTP sent to <strong className="text-setu-charcoal">+91 {mobile}</strong>
              </p>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-setu-charcoal">
                  6-digit OTP
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                  className="w-full rounded-xl border border-[#D2DEFF] px-3 py-3 text-center text-lg tracking-[0.4em] text-setu-charcoal outline-none focus:border-[#1C39BB]"
                  placeholder="••••••"
                  autoComplete="one-time-code"
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1C39BB] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Verify & continue
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone")
                  setOtp("")
                  setError("")
                }}
                className="w-full text-sm text-setu-muted transition-colors hover:text-setu-charcoal"
              >
                Change mobile number
              </button>
            </form>
          )}

          <div className="mt-6 rounded-2xl bg-setu-sand/70 p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 shrink-0 text-[#1C39BB]" size={18} />
              <p className="text-sm leading-relaxed text-setu-muted">
                {isRegister
                  ? "Verify your mobile, add your name, and you get immediate access to the SETU web app."
                  : "Existing SETU app users can sign in with the same mobile number and OTP."}
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-setu-muted">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-[#1C39BB] hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to SETU?{" "}
                <Link to="/register" className="font-medium text-[#1C39BB] hover:underline">
                  Create account
                </Link>
              </>
            )}
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
