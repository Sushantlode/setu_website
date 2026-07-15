import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Loader2, Plus } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  cancelSoilBooking,
  clearSoilDraft,
  fetchSoilBookings,
  formatInr,
} from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriSoilBookings() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState(null)
  const notice = location.state?.notice || ""

  const load = useCallback(async () => {
    if (!auth.token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError("")
      setItems(await fetchSoilBookings(auth))
    } catch (err) {
      setError(err.message || "Failed to load soil bookings")
    } finally {
      setLoading(false)
    }
  }, [session?.token])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AgriShell
      title="Soil bookings"
      backTo="/app/agriculture"
      rightAction={
        <button
          type="button"
          onClick={() => {
            clearSoilDraft()
            navigate("/app/agriculture/soil")
          }}
          className="rounded-lg p-1.5 text-white hover:bg-white/10"
        >
          <Plus size={18} />
        </button>
      }
    >
      {!auth.token ? (
        <p className="text-sm text-[#6E8371]">
          <Link to="/login" state={{ from: "/app/agriculture/soil/bookings" }} className="text-[#1E6E33] underline">
            Sign in
          </Link>{" "}
          to view soil test bookings.
        </p>
      ) : null}

      {notice ? <p className="mb-3 text-sm text-[#1E6E33]">{notice}</p> : null}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {!loading && auth.token ? (
        <div className="space-y-3">
          {items.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-[#D9E3D7] bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-[#1E2E1F]">
                {b.cropName || b.crop_name || "Soil test"}
              </p>
              <p className="mt-1 text-sm text-[#6E8371]">
                {[b.villageName || b.village_name, b.district, b.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="mt-1 text-xs text-[#1E6E33]">
                {b.preferred_date || b.preferredDate || "Date TBD"} ·{" "}
                {b.status || "pending"}
                {b.payment_amount != null
                  ? ` · ${formatInr(b.payment_amount)}`
                  : ""}
              </p>
              {String(b.status || "").toLowerCase() !== "cancelled" ? (
                <button
                  type="button"
                  disabled={busyId === b.id}
                  className="mt-2 text-xs font-medium text-red-600"
                  onClick={async () => {
                    setBusyId(b.id)
                    try {
                      await cancelSoilBooking(b.id, auth)
                      await load()
                    } catch (err) {
                      setError(err.message)
                    } finally {
                      setBusyId(null)
                    }
                  }}
                >
                  {busyId === b.id ? "…" : "Cancel booking"}
                </button>
              ) : null}
            </div>
          ))}
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6E8371]">
              No soil test bookings yet.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              clearSoilDraft()
              navigate("/app/agriculture/soil")
            }}
            className="w-full rounded-full bg-[#307E33] py-3 text-sm font-semibold text-white"
          >
            Book soil test
          </button>
        </div>
      ) : null}
    </AgriShell>
  )
}
