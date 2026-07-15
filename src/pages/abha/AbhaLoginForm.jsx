import { useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ABHA_SUFFIX,
  formatAbhaNumber,
  normalizeAbhaAddress,
  requestLoginOTP,
  requestLoginPassword,
  getAbhaUserProfile,
  getPhrAppLoginProfile,
  buildProfileFromResponses,
  extractTokens,
  saveAbhaSession,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

const TITLES = {
  aadhaar: "Aadhaar Number",
  mobile: "Mobile Number",
  address: "ABHA Address",
  number: "ABHA Number",
}

export default function AbhaLoginForm() {
  const { method } = useParams()
  const loginType = ["aadhaar", "mobile", "address", "number"].includes(method)
    ? method
    : "address"
  const navigate = useNavigate()

  const [aadhaar, setAadhaar] = useState("")
  const [mobile, setMobile] = useState("")
  const [address, setAddress] = useState("")
  const [abhaNumber, setAbhaNumber] = useState("")
  const [yob, setYob] = useState("")
  const [otpMethod, setOtpMethod] = useState("mobile")
  const [authMode, setAuthMode] = useState("otp")
  const [password, setPassword] = useState("")
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const title = TITLES[loginType] || "Login"

  const canSubmit = useMemo(() => {
    if (!terms || loading) return false
    if (loginType === "aadhaar") return aadhaar.replace(/\D/g, "").length === 12
    if (loginType === "mobile") return mobile.replace(/\D/g, "").length === 10
    if (loginType === "address") {
      if (authMode === "password") return address.trim().length >= 3 && password.length >= 1
      return address.trim().length >= 3
    }
    if (loginType === "number") {
      return (
        abhaNumber.replace(/\D/g, "").length === 14 && /^\d{4}$/.test(yob)
      )
    }
    return false
  }, [
    terms,
    loading,
    loginType,
    aadhaar,
    mobile,
    address,
    abhaNumber,
    yob,
    authMode,
    password,
  ])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setError("")
    setLoading(true)

    try {
      let loginId = ""
      let finalLoginType = ""
      let finalLoginMethod = ""
      let yearOfBirth = null

      if (loginType === "address") {
        loginId = normalizeAbhaAddress(address)
        finalLoginType = "abha-address"
        finalLoginMethod = otpMethod
      } else if (loginType === "number") {
        loginId = abhaNumber.replace(/\D/g, "")
        yearOfBirth = yob
        finalLoginType = "abha-number"
        finalLoginMethod = otpMethod
      } else if (loginType === "mobile") {
        loginId = mobile.replace(/\D/g, "")
        finalLoginType = "abha-address"
        finalLoginMethod = "mobile"
      } else {
        loginId = aadhaar.replace(/\D/g, "")
        finalLoginType = "aadhaar"
        finalLoginMethod = "aadhaar"
      }

      if (authMode === "password" && loginType === "address") {
        const response = await requestLoginPassword({
          loginType: finalLoginType,
          loginId,
          password,
        })
        if (!response.success) throw new Error(response.error || "Password login failed")

        const nested = response.data?.data || response.data || {}
        const { xToken, xAuthToken } = extractTokens(nested)
        if (!xToken) throw new Error("X-Token not received")

        const [abhaProfile, phrProfile] = await Promise.all([
          getAbhaUserProfile(xToken),
          getPhrAppLoginProfile(xToken),
        ])
        const profile = await buildProfileFromResponses(abhaProfile, phrProfile, {
          abhaAddress: loginId,
        })
        saveAbhaSession({
          xToken,
          xAuthToken,
          profile,
          loginType: finalLoginType,
        })
        navigate("/app/abha/profile", { replace: true })
        return
      }

      const data = await requestLoginOTP({
        loginType: finalLoginType,
        loginMethod: finalLoginMethod,
        loginId,
        yearOfBirth,
      })

      const txnId =
        data?.data?.txnId || data?.txnId || data?.data?.data?.txnId || null
      if (!txnId) throw new Error("Failed to get transaction ID. Please try again.")

      navigate("/app/abha/login/otp", {
        state: {
          txnId,
          loginType: finalLoginType,
          loginMethod: finalLoginMethod,
          yearOfBirth,
          loginId,
          message: data?.data?.message || data?.message || "OTP sent successfully",
        },
      })
    } catch (err) {
      setError(err.message || "Login request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AbhaShell title={title} backTo="/app/abha/login">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm">
        {loginType === "aadhaar" && (
          <Field label="Aadhaar number">
            <input
              inputMode="numeric"
              maxLength={12}
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
              className="input"
              placeholder="12-digit Aadhaar"
              autoComplete="off"
            />
          </Field>
        )}

        {loginType === "mobile" && (
          <Field label="Mobile number">
            <input
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="input"
              placeholder="10-digit mobile"
            />
          </Field>
        )}

        {loginType === "address" && (
          <>
            <Field label={`ABHA address (${ABHA_SUFFIX})`}>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
                placeholder={`username${ABHA_SUFFIX}`}
                autoCapitalize="none"
              />
            </Field>
            <div className="flex gap-2 rounded-lg bg-[#F5F6FA] p-1">
              {["otp", "password"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAuthMode(m)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize ${
                    authMode === m
                      ? "bg-white text-[#2F387E] shadow-sm"
                      : "text-[#6B7289]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {authMode === "otp" && (
              <OtpMethodToggle value={otpMethod} onChange={setOtpMethod} />
            )}
            {authMode === "password" && (
              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="ABHA password"
                />
              </Field>
            )}
          </>
        )}

        {loginType === "number" && (
          <>
            <Field label="ABHA number">
              <input
                inputMode="numeric"
                value={abhaNumber}
                onChange={(e) => setAbhaNumber(formatAbhaNumber(e.target.value))}
                className="input"
                placeholder="00-0000-0000-0000"
              />
            </Field>
            <Field label="Year of birth">
              <input
                inputMode="numeric"
                maxLength={4}
                value={yob}
                onChange={(e) => setYob(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="input"
                placeholder="YYYY"
              />
            </Field>
            <OtpMethodToggle value={otpMethod} onChange={setOtpMethod} />
          </>
        )}

        <label className="flex items-start gap-2 text-sm text-[#4B5168]">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="text-[#2F387E] underline">
              Terms & Conditions
            </Link>
          </span>
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-[#2F387E] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Please wait…" : authMode === "password" ? "Login" : "Send OTP"}
        </button>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #E2E5F0;
          padding: 0.75rem 0.9rem;
          font-size: 0.95rem;
          outline: none;
        }
        .input:focus {
          border-color: #2F387E;
          box-shadow: 0 0 0 3px rgba(47, 56, 126, 0.12);
        }
      `}</style>
    </AbhaShell>
  )
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[#1A1F3C]">{label}</span>
      {children}
    </label>
  )
}

function OtpMethodToggle({ value, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[#1A1F3C]">OTP via</p>
      <div className="flex gap-2">
        {["mobile", "aadhaar"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${
              value === m
                ? "border-[#2F387E] bg-[#EEF0FF] font-semibold text-[#2F387E]"
                : "border-[#E2E5F0] text-[#6B7289]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
