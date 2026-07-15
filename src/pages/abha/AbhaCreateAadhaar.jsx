import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { requestABHAOTP } from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaCreateAadhaar() {
  const navigate = useNavigate()
  const [aadhaar, setAadhaar] = useState("")
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const canSubmit = useMemo(
    () => aadhaar.length === 12 && terms && !loading,
    [aadhaar, terms, loading],
  )

  const handleContinue = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError("")
    try {
      const response = await requestABHAOTP({ aadhaar })
      const txnId =
        response?.data?.txnId ||
        response?.txnId ||
        response?.data?.data?.txnId ||
        null
      if (!txnId) throw new Error("Failed to retrieve transaction ID")

      navigate("/app/abha/create/aadhaar/otp", {
        state: {
          txnId,
          aadhaar,
          maskedAadhaar: `XXXX-XXXX-${aadhaar.slice(-4)}`,
          message: response?.data?.message || response?.message || "OTP sent",
        },
      })
    } catch (err) {
      setError(err.message || "Failed to request OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AbhaShell title="ABHA address creation" backTo="/app/abha/create">
      <form
        onSubmit={handleContinue}
        className="space-y-4 rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm"
      >
        <h2 className="text-base font-semibold text-[#1A1F3C]">
          Create using Aadhaar number
        </h2>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#1A1F3C]">Aadhaar number</span>
          <input
            inputMode="numeric"
            maxLength={12}
            value={aadhaar}
            onChange={(e) =>
              setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            className="w-full rounded-xl border border-[#E2E5F0] px-3.5 py-3 outline-none focus:border-[#2F387E]"
            placeholder="12-digit Aadhaar"
            autoComplete="off"
          />
        </label>

        <label className="flex items-start gap-2 text-sm text-[#4B5168]">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the Aadhaar declaration and{" "}
            <Link to="/terms" className="text-[#2F387E] underline">
              Terms & Conditions
            </Link>
          </span>
        </label>

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
      </form>
    </AbhaShell>
  )
}
