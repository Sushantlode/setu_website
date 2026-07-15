import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  RAZORPAY_KEY_ID,
  SOIL_SERVICE_AMOUNT,
  bookSoilTest,
  clearSoilDraft,
  computeSoilTotal,
  formatInr,
  loadSoilDraft,
  saveSoilDraft,
} from "../../api/agri"
import { AgriShell } from "./AgriShell"

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error("Could not load Razorpay"))
    document.body.appendChild(script)
  })
}

function openRazorpayCheckout(options) {
  return new Promise((resolve, reject) => {
    loadRazorpayScript()
      .then((Razorpay) => {
        const rzp = new Razorpay({
          ...options,
          handler: (response) => resolve(response),
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        })
        rzp.on("payment.failed", (resp) => {
          reject(new Error(resp?.error?.description || "Payment failed"))
        })
        rzp.open()
      })
      .catch(reject)
  })
}

const STEPS = ["Address", "Crop & field", "Schedule & pay"]

export default function AgriSoilBook() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }

  const initial = useMemo(() => loadSoilDraft(), [])
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(() => ({
    fullName: initial.fullName || session?.first_name || "",
    mobileNumber: initial.mobileNumber || session?.mobile || "",
    email: initial.email || "",
    villageName: initial.villageName || "",
    district: initial.district || "",
    state: initial.state || "",
    pincode: initial.pincode || "",
    current_address: initial.current_address || "",
    cropName: initial.cropName || "",
    cropType: initial.cropType || "",
    cropSeason: initial.cropSeason || "",
    landSize: initial.landSize || "",
    preferred_date: initial.preferred_date || "",
  }))
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fees = computeSoilTotal(SOIL_SERVICE_AMOUNT)

  const update = (partial) => {
    setDraft((prev) => {
      const next = { ...prev, ...partial }
      saveSoilDraft(next)
      return next
    })
    setError("")
  }

  const validate = () => {
    if (step === 0) {
      if (!draft.fullName.trim()) return "Enter full name."
      if (!/^[6-9]\d{9}$/.test(String(draft.mobileNumber).replace(/\D/g, "").slice(-10))) {
        return "Enter a valid 10-digit mobile."
      }
      if (!draft.state.trim() || !draft.district.trim() || !draft.pincode.trim()) {
        return "State, district and pincode are required."
      }
      if (!draft.villageName.trim()) return "Enter village name."
    }
    if (step === 1) {
      if (!draft.cropName.trim()) return "Enter crop name."
      if (!draft.landSize.trim()) return "Enter land size."
    }
    if (step === 2) {
      if (!draft.preferred_date) return "Select a preferred date."
    }
    return ""
  }

  const next = () => {
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
      return
    }
    submit()
  }

  const back = () => {
    if (step === 0) {
      navigate("/app/agriculture")
      return
    }
    setStep((s) => s - 1)
  }

  const submit = async () => {
    if (!auth.token) {
      navigate("/login", { state: { from: "/app/agriculture/soil" } })
      return
    }
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }

    setSubmitting(true)
    setError("")
    try {
      const payment = await openRazorpayCheckout({
        key: RAZORPAY_KEY_ID,
        amount: Math.round(fees.total * 100),
        currency: "INR",
        name: "SETU Agri Connect",
        description: "Soil testing service",
        prefill: {
          name: draft.fullName,
          contact: String(draft.mobileNumber).replace(/\D/g, "").slice(-10),
          email: draft.email || "",
        },
        theme: { color: "#1E6E33" },
      })

      await bookSoilTest(
        {
          fullName: draft.fullName.trim(),
          mobileNumber: String(draft.mobileNumber).replace(/\D/g, "").slice(-10),
          email: draft.email || undefined,
          villageName: draft.villageName.trim(),
          district: draft.district.trim(),
          state: draft.state.trim(),
          pincode: draft.pincode.trim(),
          current_address: draft.current_address || undefined,
          cropName: draft.cropName.trim(),
          cropType: draft.cropType || undefined,
          cropSeason: draft.cropSeason || undefined,
          landSize: draft.landSize,
          preferred_date: draft.preferred_date,
          paymentMethod: "razorpay",
          payment_amount: fees.total,
          paymentStatus: "completed",
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_signature: payment.razorpay_signature,
        },
        auth,
      )

      clearSoilDraft()
      navigate("/app/agriculture/soil/bookings", {
        state: { notice: "Soil test booked successfully." },
      })
    } catch (err) {
      setError(err.message || "Booking failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AgriShell title="Book soil test" onBack={back}>
      <div className="mb-4">
        <p className="text-xs font-medium text-[#6E8371]">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#D9E3D7]">
          <div
            className="h-full rounded-full bg-[#1E6E33] transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 ? (
        <div className="space-y-3">
          {[
            ["fullName", "Full name"],
            ["mobileNumber", "Mobile"],
            ["email", "Email (optional)"],
            ["villageName", "Village"],
            ["district", "District"],
            ["state", "State"],
            ["pincode", "Pincode"],
            ["current_address", "Address line"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium text-[#1E2E1F]">{label}</span>
              <input
                value={draft[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
              />
            </label>
          ))}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          {[
            ["cropName", "Crop name"],
            ["cropType", "Crop type"],
            ["cropSeason", "Season"],
            ["landSize", "Land size (acres)"],
          ].map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <input
                value={draft[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
              />
            </label>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Preferred date</span>
            <input
              type="date"
              value={draft.preferred_date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => update({ preferred_date: e.target.value })}
              className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
            />
          </label>
          <div className="rounded-2xl border border-[#D9E3D7] bg-white p-4 text-sm">
            <div className="flex justify-between">
              <span>Soil testing</span>
              <span>{formatInr(fees.base)}</span>
            </div>
            <div className="mt-2 flex justify-between text-[#6E8371]">
              <span>Platform fee</span>
              <span>{formatInr(fees.platformFee)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-[#D9E3D7] pt-3 font-semibold">
              <span>Total</span>
              <span className="text-[#1E6E33]">{formatInr(fees.total)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        disabled={submitting}
        onClick={next}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#307E33] py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
        {step >= STEPS.length - 1 ? `Pay ${formatInr(fees.total)}` : "Continue"}
      </button>
    </AgriShell>
  )
}
