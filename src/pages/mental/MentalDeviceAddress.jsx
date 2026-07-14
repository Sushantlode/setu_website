import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  createAddress,
  getAddresses,
  getTimeSlots,
  MENTAL_ACCENT,
} from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { useToast } from "../../components/ui/Toast"
import { MentalShell } from "./MentalShell"

const EMPTY_ADDR = {
  houseNumber: "",
  streetName: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
}

export default function MentalDeviceAddress() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const { bookingDraft, setFlow } = useMentalHealth()

  const [addresses, setAddresses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(EMPTY_ADDR)
  const [showNew, setShowNew] = useState(false)
  const [date, setDate] = useState(bookingDraft?.scheduleDate || "")
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState(bookingDraft?.scheduleTime || "")
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!bookingDraft?.fullName) {
      navigate("/app/mental-health/device/details", { replace: true })
    }
  }, [bookingDraft, navigate])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await getAddresses(session)
        if (cancelled) return
        setAddresses(list)
        if (list[0]?.id) setSelectedId(list[0].id)
        else setShowNew(true)
      } catch {
        if (!cancelled) setShowNew(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!date) return undefined
    const selected = addresses.find((a) => a.id === selectedId)
    const city = showNew ? form.city : selected?.city
    const state = showNew ? form.state : selected?.state
    const pincode = showNew ? form.pincode : selected?.pincode
    if (!city || !pincode) return undefined

    let cancelled = false
    ;(async () => {
      setLoadingSlots(true)
      try {
        const data = await getTimeSlots({ city, state, pincode, date })
        if (!cancelled) {
          setSlots(Array.isArray(data) ? data : [])
          setSlot("")
        }
      } catch (err) {
        if (!cancelled) {
          setSlots([])
          toast.error(err?.message || "No slots available")
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [date, selectedId, showNew, form.city, form.state, form.pincode, addresses, session, toast])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onContinue = async (e) => {
    e.preventDefault()
    if (!date || !slot) {
      toast.error("Please select date and time slot")
      return
    }

    setSaving(true)
    try {
      let address = showNew ? null : addresses.find((a) => a.id === selectedId)
      if (showNew) {
        if (!form.houseNumber || !form.streetName || !form.city || !form.state || !form.pincode) {
          toast.error("Please complete the address")
          setSaving(false)
          return
        }
        address = await createAddress(form, session)
      }
      if (!address) {
        toast.error("Please select or add an address")
        setSaving(false)
        return
      }

      const slotValue =
        typeof slot === "string"
          ? slot
          : slot?.time || slot?.slot || slot?.startTime || String(slot)

      setFlow({
        bookingDraft: {
          ...bookingDraft,
          houseNumber: address.houseNumber || form.houseNumber,
          streetName: address.streetName || form.streetName,
          landmark: address.landmark || form.landmark || "",
          city: address.city || form.city,
          state: address.state || form.state,
          pincode: address.pincode || form.pincode,
          scheduleDate: date,
          scheduleTime: slotValue,
        },
      })
      navigate("/app/mental-health/device/review")
    } catch (err) {
      toast.error(err?.message || "Could not save address")
    } finally {
      setSaving(false)
    }
  }

  const minDate = new Date().toISOString().slice(0, 10)

  return (
    <MentalShell title="Address & slot" backTo="/app/mental-health/device/details">
      <form onSubmit={onContinue} className="space-y-5">
        {!showNew && addresses.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#0F172A]">Saved addresses</p>
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${
                  selectedId === a.id ? "border-[#0F766E] bg-[#ECFDF5]" : "border-[#E5E7EB] bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                />
                <span className="text-sm text-[#0F172A]">
                  {[a.houseNumber, a.streetName, a.city, a.state, a.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="text-sm font-semibold text-[#0F766E]"
            >
              + Add new address
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-[#0F172A]">New address</p>
            {Object.keys(EMPTY_ADDR).map((key) => (
              <label key={key} className="mb-2 block text-sm capitalize text-[#0F172A]">
                {key.replace(/([A-Z])/g, " $1")}
                <input
                  value={form[key]}
                  onChange={update(key)}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#0F766E]"
                />
              </label>
            ))}
            {addresses.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="mt-1 text-sm text-[#0F766E]"
              >
                Use saved address
              </button>
            ) : null}
          </div>
        )}

        <label className="block text-sm font-semibold text-[#0F172A]">
          Date
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#0F766E]"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#0F172A]">Time slot</p>
          {loadingSlots ? (
            <p className="text-sm text-[#6B7280]">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-[#6B7280]">
              {date ? "No slots for this date / location." : "Pick a date to see slots."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s, i) => {
                const label =
                  typeof s === "string" ? s : s.time || s.slot || s.startTime || `Slot ${i + 1}`
                const value = typeof s === "string" ? s : label
                return (
                  <button
                    key={`${value}-${i}`}
                    type="button"
                    onClick={() => setSlot(value)}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      slot === value
                        ? "border-[#0F766E] bg-[#ECFDF5] font-semibold text-[#0F766E]"
                        : "border-[#E5E7EB] bg-white text-[#0F172A]"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          {saving ? "Saving…" : "Continue to review"}
        </button>
      </form>
    </MentalShell>
  )
}
