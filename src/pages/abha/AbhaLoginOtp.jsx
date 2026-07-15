import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  verifyLoginOTP,
  requestLoginOTP,
  getAbhaUserProfile,
  getPhrAppLoginProfile,
  buildProfileFromResponses,
  extractTokens,
  saveAbhaSession,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaLoginOtp() {
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
    if (!state.txnId || !state.loginType || !state.loginMethod) {
      navigate("/app/abha/login", { replace: true })
    }
  }, [state, navigate])

  useEffect(() => {
    if (resendTimer <= 0) return undefined
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const finishWithToken = async (xToken, xAuthToken, fallback = {}) => {
    const [abhaProfile, phrProfile] = await Promise.all([
      getAbhaUserProfile(xToken),
      getPhrAppLoginProfile(xToken),
    ])
    const profile = await buildProfileFromResponses(abhaProfile, phrProfile, fallback)
    saveAbhaSession({
      xToken,
      xAuthToken,
      profile,
      loginType: state.loginType,
    })
    navigate("/app/abha/profile", { replace: true })
  }

  const handleVerify = async () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits of OTP")
      return
    }
    setLoading(true)
    setError("")
    try {
      const response = await verifyLoginOTP({
        txnId,
        otp: otpString,
        loginType: state.loginType,
        loginMethod: state.loginMethod,
        yearOfBirth: state.yearOfBirth || null,
      })

      if (!response?.success || !response?.data) {
        setError(response?.error || "Verification failed")
        return
      }

      const {
        txnId: newTxnId,
        users,
        tokens,
        skipAddressSelection,
        selectedAbhaAddress,
      } = response.data

      if (!users?.length) {
        setError("No ABHA address found for this account")
        return
      }

      const { xToken, xAuthToken, tToken } = extractTokens(response.data)

      if (
        skipAddressSelection &&
        selectedAbhaAddress &&
        state.loginType === "abha-address" &&
        xToken
      ) {
        await finishWithToken(xToken, xAuthToken, {
          abhaAddress: selectedAbhaAddress,
        })
        return
      }

      if (users.length === 1 && xToken) {
        await finishWithToken(xToken, xAuthToken, {
          abhaAddress: users[0]?.abhaAddress,
          abhaNumber: users[0]?.abhaNumber,
          fullName: users[0]?.fullName,
          kycStatus: users[0]?.kycStatus,
        })
        return
      }

      if (users.length === 1 && tToken) {
        navigate("/app/abha/login/select-address", {
          replace: true,
          state: {
            txnId: newTxnId || txnId,
            users,
            tToken,
            loginType: state.loginType,
            tokens,
          },
        })
        return
      }

      navigate("/app/abha/login/select-address", {
        replace: true,
        state: {
          txnId: newTxnId || txnId,
          users,
          tToken: tToken || tokens?.tToken,
          loginType: state.loginType,
          tokens,
        },
      })
    } catch (err) {
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || !state.loginId) return
    setError("")
    try {
      const data = await requestLoginOTP({
        loginType: state.loginType,
        loginMethod: state.loginMethod,
        loginId: state.loginId,
        yearOfBirth: state.yearOfBirth || null,
      })
      const nextTxn =
        data?.data?.txnId || data?.txnId || data?.data?.data?.txnId
      if (nextTxn) setTxnId(nextTxn)
      setResendTimer(30)
      setOtp(["", "", "", "", "", ""])
    } catch (err) {
      setError(err.message || "Failed to resend OTP")
    }
  }

  const onChange = (index, value) => {
    const clean = value.replace(/\D/g, "")
    if (clean.length >= 6) {
      setOtp(clean.slice(0, 6).split(""))
      refs.current[5]?.focus()
      return
    }
    const next = [...otp]
    next[index] = clean.slice(-1)
    setOtp(next)
    if (clean && index < 5) refs.current[index + 1]?.focus()
  }

  return (
    <AbhaShell title="Verify OTP" backTo="/app/abha/login">
      <div className="rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#6B7289]">
          {state.message || "Enter the 6-digit OTP sent to your registered method."}
        </p>

        <div className="mt-5 flex justify-between gap-2">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !otp[i] && i > 0) {
                  refs.current[i - 1]?.focus()
                }
              }}
              className="h-12 w-10 rounded-lg border border-[#E2E5F0] text-center text-lg font-semibold text-[#1A1F3C] outline-none focus:border-[#2F387E] sm:h-14 sm:w-12"
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
