import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MENTAL_ACCENT } from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { MentalShell } from "./MentalShell"

export default function MentalDeviceDetails() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { setFlow, bookingDraft } = useMentalHealth()

  const [form, setForm] = useState(() => ({
    fullName: bookingDraft?.fullName || session?.first_name || session?.username || "",
    age: bookingDraft?.age || "",
    gender: bookingDraft?.gender || "",
    phoneNumber: bookingDraft?.phoneNumber || session?.mobile || "",
    email: bookingDraft?.email || "",
  }))
  const [error, setError] = useState("")

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.age || !form.gender || !form.phoneNumber.trim()) {
      setError("Please fill name, age, gender, and phone.")
      return
    }
    setFlow({
      bookingDraft: {
        ...(bookingDraft || {}),
        ...form,
        age: Number(form.age),
      },
    })
    navigate("/app/mental-health/device/address")
  }

  return (
    <MentalShell title="Patient details" backTo="/app/mental-health/device">
      <form onSubmit={onSubmit} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        {[
          { key: "fullName", label: "Full name", type: "text" },
          { key: "age", label: "Age", type: "number" },
          { key: "phoneNumber", label: "Phone", type: "tel" },
          { key: "email", label: "Email (optional)", type: "email" },
        ].map((field) => (
          <label key={field.key} className="mb-3 block text-sm font-medium text-[#0F172A]">
            {field.label}
            <input
              type={field.type}
              value={form[field.key]}
              onChange={update(field.key)}
              className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#0F766E]"
            />
          </label>
        ))}
        <label className="mb-3 block text-sm font-medium text-[#0F172A]">
          Gender
          <select
            value={form.gender}
            onChange={update("gender")}
            className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#0F766E]"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full px-5 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          Continue
        </button>
      </form>
    </MentalShell>
  )
}
