import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  verifyPHROTP,
  requestPHROTP,
  extractTokens,
  saveAbhaSession,
  getAbhaUserProfile,
  getPhrAppLoginProfile,
  buildProfileFromResponses,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaCreateOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [txnId, setTxnId] = useState(state.txnId || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(30)
  const refs = useRef([])

  useEffect(() => {
    if (!state.txnId) navigate("/app/abha/create", { replace: true })
  }, [state.txnId, navigate])

  useEffect(() => {
    if (resendTimer <= 0) return undefined
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleVerify = async () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Enter the 6-digit OTP")
      return
    }
    setLoading(true)
    setError("")
    try {
      const response = await verifyPHROTP(
        txnId,
        otpString,
        state.loginType,
        state.loginMethod,
      )
      if (!response.success) {
        setError(response.error || "Verification failed")
        return
      }

      const data = response.data || {}
      const users = data.users || []
      const { xToken, xAuthToken, tToken } = extractTokens(data)

      if (users.length > 1 || (!xToken && tToken)) {
        navigate("/app/abha/login/select-address", {
          replace: true,
          state: {
            txnId: data.txnId || txnId,
            users: users.length ? users : [{ abhaAddress: data.abhaAddress }],
            tToken,
            loginType: state.loginType,
            tokens: data.tokens,
          },
        })
        return
      }

      if (xToken) {
        const [abhaProfile, phrProfile] = await Promise.all([
          getAbhaUserProfile(xToken),
          getPhrAppLoginProfile(xToken),
        ])
        const profile = await buildProfileFromResponses(abhaProfile, phrProfile, {
          abhaAddress: users[0]?.abhaAddress,
        })
        saveAbhaSession({ xToken, xAuthToken, profile, loginType: state.loginType })
        navigate("/app/abha/profile", { replace: true })
        return
      }

      if (data.txnId) {
        navigate("/app/abha/create/aadhaar/address", {
          state: { txnId: data.txnId, token: xToken },
        })
        return
      }

      setError("Could not complete enrollment. Try login or create via Aadhaar.")
    } catch (err) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || !state.loginId) return
    try {
      const response = await requestPHROTP({
        loginId: state.loginId,
        loginType: state.loginType,
        method: state.loginMethod,
      })
      const next = response?.txnId || response?.data?.txnId
      if (next) setTxnId(next)
      setResendTimer(30)
      setOtp(["", "", "", "", "", ""])
    } catch (err) {
      setError(err.message || "Failed to resend OTP")
    }
  }

  return (
    <AbhaShell title="Verify OTP" backTo="/app/abha/create">
      <div className="rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm">
        <div className="flex justify-between gap-2">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, "")
                if (clean.length >= 6) {
                  setOtp(clean.slice(0, 6).split(""))
                  return
                }
                const next = [...otp]
                next[i] = clean.slice(-1)
                setOtp(next)
                if (clean && i < 5) refs.current[i + 1]?.focus()
              }}
              className="h-12 w-10 rounded-lg border border-[#E2E5F0] text-center text-lg font-semibold outline-none focus:border-[#2F387E] sm:w-12"
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading || otp.join("").length !== 6}
          onClick={handleVerify}
          className="mt-5 w-full rounded-xl bg-[#2F387E] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify OTP"}
        </button>

        <button
          type="button"
          disabled={resendTimer > 0}
          onClick={handleResend}
          className="mt-3 w-full py-2 text-sm font-medium text-[#2F387E] disabled:text-[#9CA3AF]"
        >
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
        </button>
      </div>
    </AbhaShell>
  )
}
