import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  cancelMyBooking,
  deleteMyBooking,
  getMyBookings,
  MENTAL_ACCENT,
} from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../components/ui/Toast"
import { MentalShell } from "./MentalShell"

function statusStyle(status) {
  const s = String(status || "").toLowerCase()
  if (s.includes("cancel")) return "bg-red-100 text-red-700"
  if (s.includes("complete") || s.includes("success")) return "bg-emerald-100 text-emerald-700"
  if (s.includes("pending") || s.includes("confirm") || s.includes("upcoming"))
    return "bg-amber-100 text-amber-800"
  return "bg-slate-100 text-slate-700"
}

export default function MentalBookings() {
  const { session } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getMyBookings(session)
      setItems(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err?.message || "Failed to load bookings")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [session, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return
    setBusyId(id)
    try {
      await cancelMyBooking(id, "Cancelled by user", session)
      toast.success("Booking cancelled")
      await load()
    } catch (err) {
      toast.error(err?.message || "Cancel failed")
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this booking from your list?")) return
    setBusyId(id)
    try {
      await deleteMyBooking(id, session)
      toast.success("Booking removed")
      await load()
    } catch (err) {
      toast.error(err?.message || "Delete failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <MentalShell
      title="My bookings"
      backTo="/app/mental-health/assessments"
      showHeaderActions
      activeAction="bookings"
    >
      <div className="mb-4 flex justify-end">
        <Link
          to="/app/mental-health/device"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          Book device
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#E5E7EB]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-12 text-center">
          <p className="font-semibold text-[#0F172A]">No bookings yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Book a stress quantification device for at-home screening.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => {
            const id = b.id || b.bookingId
            const status = b.status || b.bookingStatus || "scheduled"
            const date = b.scheduleDate || b.date || b.bookingDate
            const time = b.scheduleTime || b.time || b.bookingTime
            return (
              <li key={id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0F172A]">
                      {b.fullName || b.patientName || "Device visit"}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {[date, time].filter(Boolean).join(" · ") || "Schedule TBD"}
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {[b.city, b.state, b.pincode].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>
                    {status}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === id}
                    onClick={() => handleCancel(id)}
                    className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#0F172A] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busyId === id}
                    onClick={() => handleDelete(id)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </MentalShell>
  )
}
