import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  cancelThyrocareOrder,
  fetchOrderList,
  fetchThyrocareOrderDetails,
  rescheduleThyrocareOrder,
} from "../../api/booktest"
import BookTestShell, { BookTestPrimaryButton } from "../../components/booktest/BookTestShell"
import {
  formatAppointment,
  formatInr,
  isPastOrder,
  orderIdOf,
  parseOrderReportPayload,
} from "../../utils/booktest"

function statusBadgeClass(status) {
  const s = String(status || "").toUpperCase()
  if (s.includes("CANCEL")) return "bg-red-50 text-red-700"
  if (s.includes("COMPLETE") || s.includes("DONE")) return "bg-emerald-50 text-emerald-700"
  return "bg-violet-50 text-violet-800"
}

export function BookTestOrders() {
  const { session } = useAuth()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState("upcoming")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const { orders: list } = await fetchOrderList(session, { page: 1, limit: 30 })
        if (!cancelled) setOrders(Array.isArray(list) ? list : [])
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load orders")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session])

  const filtered = useMemo(() => {
    return orders.filter((o) => (tab === "past" ? isPastOrder(o) : !isPastOrder(o)))
  }, [orders, tab])

  return (
    <BookTestShell title="My Orders" backTo="/app/book-tests/home">
      <div className="mb-4 flex gap-2">
        {["upcoming", "past"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === t ? "bg-violet-700 text-white" : "bg-white text-violet-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-700" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-setu-muted">No {tab} orders.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const id = orderIdOf(order)
            const status = order.status || order.orderStatus || order.statusText || "Scheduled"
            return (
              <Link
                key={id}
                to={`/app/book-tests/orders/${encodeURIComponent(id)}`}
                state={{ order }}
                className="block rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-setu-charcoal line-clamp-1">
                      {order.name || order.packageName || "Lab order"}
                    </h3>
                    <p className="mt-1 text-xs text-setu-muted">Order ID: {id}</p>
                    <p className="mt-1 text-sm text-setu-muted">
                      Appointment: {formatAppointment(order)}
                    </p>
                    {order.otp && (
                      <p className="mt-1 text-sm font-medium text-violet-800">
                        Collection OTP: {order.otp}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                    <p className="mt-2 text-sm font-semibold">
                      {formatInr(order.amountPaid || order.price || order.total_amount)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </BookTestShell>
  )
}

export function BookTestOrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [report, setReport] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const detail = await fetchOrderList(session, { orderId })
        const thyro = await fetchThyrocareOrderDetails(session, orderId).catch(() => null)
        if (cancelled) return
        const base =
          detail?.order ||
          detail?.data ||
          (Array.isArray(detail?.orders) ? detail.orders[0] : detail) ||
          {}
        setOrder(base)
        if (thyro) setReport(parseOrderReportPayload(thyro))
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load order")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session, orderId])

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return
    setBusy("cancel")
    try {
      await cancelThyrocareOrder(session, orderId, {
        payment_id: order?.paymentId || order?.payment_id,
      })
      alert("Order cancelled")
      navigate("/app/book-tests/orders")
    } catch (err) {
      alert(err.message || "Cancel failed")
    } finally {
      setBusy("")
    }
  }

  const handleReschedule = async () => {
    const date = window.prompt(
      "New appointment (YYYY-MM-DD HH:mm)",
      `${new Date().toISOString().slice(0, 10)} 10:00`,
    )
    if (!date) return
    setBusy("reschedule")
    try {
      await rescheduleThyrocareOrder(session, orderId, {
        appointmentDate: date,
        reasonKey: "CUSTOMER_REQUEST",
        reasonText: "Need a different collection slot",
      })
      alert("Order rescheduled")
      navigate(0)
    } catch (err) {
      alert(err.message || "Reschedule failed")
    } finally {
      setBusy("")
    }
  }

  if (loading) {
    return (
      <BookTestShell title="Order details" backTo="/app/book-tests/orders">
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-700" />
        </div>
      </BookTestShell>
    )
  }

  if (error || !order) {
    return (
      <BookTestShell title="Order details" backTo="/app/book-tests/orders">
        <p className="text-sm text-red-600">{error || "Order not found"}</p>
      </BookTestShell>
    )
  }

  const status = order.status || order.orderStatus || report?.status || "—"
  const past = isPastOrder({ ...order, status })

  return (
    <BookTestShell title="Order details" backTo="/app/book-tests/orders">
      <div className="space-y-4">
        <div className="rounded-3xl border border-violet-100 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-setu-charcoal">
                Order #{orderIdOf(order) || orderId}
              </h2>
              <p className="mt-1 text-sm text-setu-muted">
                Ref: {order.refOrderNo || order.leadId || "—"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                status,
              )}`}
            >
              {status}
            </span>
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-setu-muted">Appointment</dt>
              <dd>{formatAppointment(order)}</dd>
            </div>
            <div>
              <dt className="text-setu-muted">Paid amount</dt>
              <dd>{formatInr(order.amountPaid || order.price || order.total_amount)}</dd>
            </div>
            <div>
              <dt className="text-setu-muted">Payment ID</dt>
              <dd className="break-all">{order.paymentId || order.payment_id || "—"}</dd>
            </div>
            {order.otp && (
              <div>
                <dt className="text-setu-muted">Collection OTP</dt>
                <dd className="font-semibold text-violet-800">{order.otp}</dd>
              </div>
            )}
          </dl>
        </div>

        {!past && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <BookTestPrimaryButton onClick={handleReschedule} disabled={!!busy}>
              {busy === "reschedule" ? "Rescheduling…" : "Reschedule"}
            </BookTestPrimaryButton>
            <button
              type="button"
              onClick={handleCancel}
              disabled={!!busy}
              className="min-h-12 rounded-2xl border border-red-200 px-4 text-sm font-semibold text-red-700"
            >
              {busy === "cancel" ? "Cancelling…" : "Cancel Order"}
            </button>
          </div>
        )}

        {(report?.reportAvailable || order.isReportAvailable) && (
          <a
            href={report?.reportUrl || order.reportUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white"
          >
            Download PDF Report
          </a>
        )}
      </div>
    </BookTestShell>
  )
}
