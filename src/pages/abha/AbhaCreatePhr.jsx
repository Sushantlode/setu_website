import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { formatAbhaNumber, requestPHROTP } from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaCreatePhr() {
  const location = useLocation()
  const isMobile = location.pathname.includes("/create/mobile")
  const navigate = useNavigate()

  const [abhaNumber, setAbhaNumber] = useState("")
  const [mobile, setMobile] = useState("")
  const [otpVia, setOtpVia] = useState("aadhaar")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loginId = isMobile
    ? mobile.replace(/\D/g, "")
    : abhaNumber.replace(/\D/g, "")

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (isMobile) return loginId.length === 10
    return loginId.length === 14
  }, [isMobile, loginId, loading])

  const handleContinue = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError("")
    try {
      const loginType = isMobile ? "mobile" : "abha-number"
      const response = await requestPHROTP({
        loginId,
        loginType,
        method: isMobile ? "mobile" : otpVia,
      })
      const txnId = response?.txnId || response?.data?.txnId
      if (!txnId) throw new Error("Failed to get transaction ID")

      navigate("/app/abha/create/otp", {
        state: {
          txnId,
          loginType,
          loginMethod: isMobile ? "mobile" : otpVia,
          loginId,
        },
      })
    } catch (err) {
      setError(err.message || "Failed to request OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AbhaShell
      title="Creating My ABHA Address"
      backTo="/app/abha/create"
    >
      <form
        onSubmit={handleContinue}
        className="space-y-4 rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm"
      >
        {isMobile ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Mobile number</span>
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
        ) : (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">ABHA number</span>
              <input
                inputMode="numeric"
                value={abhaNumber}
                onChange={(e) => setAbhaNumber(formatAbhaNumber(e.target.value))}
                className="w-full rounded-xl border border-[#E2E5F0] px-3.5 py-3 outline-none focus:border-[#2F387E]"
                placeholder="00-0000-0000-0000"
              />
            </label>
            <div>
              <p className="mb-1.5 text-sm font-medium">Validate via</p>
              <div className="flex gap-2">
                {["aadhaar", "mobile"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setOtpVia(m)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize ${
                      otpVia === m
                        ? "border-[#2F387E] bg-[#EEF0FF] font-semibold text-[#2F387E]"
                        : "border-[#E2E5F0] text-[#6B7289]"
                    }`}
                  >
                    {m} OTP
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-[#2F387E] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Sending OTP…" : "Continue"}
        </button>

        {!isMobile && (
          <button
            type="button"
            onClick={() => navigate("/app/abha/create/aadhaar")}
            className="w-full text-sm font-medium text-[#2F387E]"
          >
            Don&apos;t have ABHA number? Create now
          </button>
        )}
      </form>
    </AbhaShell>
  )
}
