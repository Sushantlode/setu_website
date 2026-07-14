import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useBookTest } from "../../context/BookTestContext"
import { fetchAppointmentSlots } from "../../api/booktest"
import BookTestShell, { BookTestPrimaryButton } from "../../components/booktest/BookTestShell"

function nextDates(count = 7) {
  const out = []
  const start = new Date()
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function formatDayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function slotLabel(slot) {
  return (
    slot?.time ||
    slot?.startTime ||
    slot?.slotTime ||
    slot?.displayTime ||
    slot?.label ||
    String(slot)
  )
}

export default function BookTestSlots() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { flow, setFlow } = useBookTest()
  const dates = useMemo(() => nextDates(7), [])
  const [selectedDate, setSelectedDate] = useState(dates[0])
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const address = flow?.address
  const patient = flow?.patient
  const pincode = address?.pincode

  useEffect(() => {
    if (!patient || !pincode || !flow?.cartProductCodes?.length) {
      setError("Complete patient & address details first.")
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      setSelectedSlot(null)
      try {
        const list = await fetchAppointmentSlots(session, {
          appointmentDate: selectedDate,
          pincode: String(pincode),
          patients: [
            {
              name: patient.name,
              gender: patient.gender,
              age: patient.age,
              ageType: "YEAR",
              items: flow.cartProductCodes,
            },
          ],
        })
        if (!cancelled) setSlots(Array.isArray(list) ? list : [])
      } catch (err) {
        if (!cancelled) {
          setSlots([])
          setError(err.message || "No slots available for this date")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session, selectedDate, pincode, patient, flow?.cartProductCodes])

  const handleContinue = () => {
    if (!selectedSlot) {
      setError("Select a collection slot")
      return
    }
    setFlow({
      selectedDate,
      selectedSlot,
      selectedTime: slotLabel(selectedSlot),
    })
    navigate("/app/book-tests/checkout")
  }

  return (
    <BookTestShell title="Pickup Slot Details" backTo="/app/book-tests/patient">
      <div className="space-y-5">
        {address && (
          <div className="rounded-2xl border border-violet-100 bg-white p-4 text-sm">
            <p className="font-semibold text-setu-charcoal">Selected Address</p>
            <p className="mt-1 text-setu-muted">
              {[address.houseNumber, address.addressLine2, address.pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div>
          <h2 className="mb-2 font-semibold">Available Dates</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`min-w-[5.5rem] rounded-2xl border px-3 py-3 text-left text-xs ${
                  selectedDate === d
                    ? "border-violet-600 bg-violet-700 text-white"
                    : "border-violet-100 bg-white text-setu-charcoal"
                }`}
              >
                {formatDayLabel(d)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-semibold">Available Slots</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-violet-700" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-setu-muted">No slots for this date.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot, idx) => {
                const label = slotLabel(slot)
                const active = selectedSlot === slot || slotLabel(selectedSlot) === label
                return (
                  <button
                    key={`${label}-${idx}`}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-medium ${
                      active
                        ? "border-violet-600 bg-violet-50 text-violet-900"
                        : "border-violet-100 bg-white"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <BookTestPrimaryButton onClick={handleContinue} disabled={!selectedSlot}>
          Continue to checkout
        </BookTestPrimaryButton>
      </div>
    </BookTestShell>
  )
}
