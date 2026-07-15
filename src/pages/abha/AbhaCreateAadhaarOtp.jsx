import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  verifyABHAOTP,
  requestABHAOTP,
  extractTokens,
  saveAbhaSession,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaCreateAadhaarOtp() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [mobile, setMobile] = useState("")
  const [txnId, setTxnId] = useState(state.txnId || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendTimer, setResendTimer] = useState(30)
  const refs = useRef([])

  useEffect(() => {
    if (!state.txnId) navigate("/app/abha/create/aadhaar", { replace: true })
  }, [state.txnId, navigate])

  useEffect(() => {
    if (resendTimer <= 0) return undefined
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const canSubmit =
    /^\d{6}$/.test(otp.join("")) && /^\d{10}$/.test(mobile) && !loading

  const handleVerify = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError("")
    try {
      const response = await verifyABHAOTP({
        txnId,
        otp: otp.join(""),
        mobile,
      })

      if (response?.mobileVerificationRequired) {
        setError(
          response?.message ||
            "Mobile verification is required. Please try again with the linked mobile.",
        )
        return
      }

      const data = response?.data || response || {}
      const nextTxn = data.txnId || txnId
      const { xToken, xAuthToken } = extractTokens(data)

      if (xToken) {
        saveAbhaSession({ xToken, xAuthToken, enrollmentTxnId: nextTxn })
      }

      navigate("/app/abha/create/aadhaar/address", {
        state: {
          txnId: nextTxn,
          token: xToken || state.token,
          message: data.message || response?.message,
        },
      })
    } catch (err) {
      setError(err.message || "OTP verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || !state.aadhaar) return
    try {
      const response = await requestABHAOTP({ aadhaar: state.aadhaar })
      const next =
        response?.data?.txnId || response?.txnId || response?.data?.data?.txnId
      if (next) setTxnId(next)
      setResendTimer(30)
      setOtp(["", "", "", "", "", ""])
    } catch (err) {
      setError(err.message || "Failed to resend OTP")
    }
  }

  return (
    <AbhaShell title="Verify Aadhaar OTP" backTo="/app/abha/create/aadhaar">
      <div className="space-y-4 rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#6B7289]">
          OTP sent for {state.maskedAadhaar || "your Aadhaar"}. Enter OTP and the
          mobile number to link.
        </p>

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

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#1A1F3C]">Mobile number</span>
          <input
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className="w-full rounded-xl border border-[#E2E5F0] px-3.5 py-3 outline-none focus:border-[#2F387E]"
            placeholder="10-digit mobile"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleVerify}
          className="w-full rounded-xl bg-[#2F387E] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Continue"}
        </button>

        <button
          type="button"
          disabled={resendTimer > 0}
          onClick={handleResend}
          className="w-full py-2 text-sm font-medium text-[#2F387E] disabled:text-[#9CA3AF]"
        >
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
        </button>
      </div>
    </AbhaShell>
  )
}
