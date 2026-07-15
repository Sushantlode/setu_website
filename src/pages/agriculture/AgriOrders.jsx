import { useCallback, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { cancelAgriOrder, fetchAgriOrders, formatInr } from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriOrders() {
  const { session } = useAuth()
  const location = useLocation()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice] = useState(location.state?.notice || "")
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      setOrders(await fetchAgriOrders(auth))
    } catch (err) {
      setError(err.message || "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [session?.token])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AgriShell title="My orders" backTo="/app/agriculture">
      {notice ? <p className="mb-3 text-sm text-[#1E6E33]">{notice}</p> : null}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-[#D9E3D7] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1E2E1F]">
                    Order #{String(o.id).slice(0, 8)}
                  </p>
                  <p className="mt-1 text-sm text-[#6E8371]">
                    Status: {o.status || o.payment_status || "placed"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1E6E33]">
                    {formatInr(o.total_amount ?? o.amount ?? o.total)}
                  </p>
                </div>
                {String(o.status || "").toLowerCase() !== "cancelled" ? (
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={async () => {
                      setBusyId(o.id)
                      try {
                        await cancelAgriOrder(o.id, auth)
                        await load()
                      } catch (err) {
                        setError(err.message)
                      } finally {
                        setBusyId(null)
                      }
                    }}
                    className="text-xs font-medium text-red-600"
                  >
                    {busyId === o.id ? "…" : "Cancel"}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6E8371]">
              No orders yet.
            </p>
          ) : null}
        </div>
      ) : null}
    </AgriShell>
  )
}
