import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  RAZORPAY_KEY_ID,
  createPaymentOrder,
  fetchOrders,
  fetchPaymentOrderDetails,
  fetchPaymentOrderToken,
  trackOrder,
  verifyPayment,
} from "../../api/generic"
import GenericShell, { GenericPrimaryButton } from "../../components/generic/GenericShell"
import {
  ACCENT,
  canPayOrder,
  formatInr,
  isOrderPaid,
  orderAmount,
  orderIdOf,
  orderStatusText,
  shouldShowPayButton,
} from "../../utils/generic"

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

function normalizeTrack(raw) {
  if (!raw) return null
  const data = raw?.data || raw
  return {
    order: data?.order || data?.Order || data,
    items: data?.items || data?.order_items || data?.OrderDetails || [],
    timeline: data?.timeline || data?.tracking || data?.status_history || [],
  }
}

export function GenericOrders() {
  const { session } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const list = await fetchOrders(session)
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

  return (
    <GenericShell title="My orders">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-700" />
        </div>
      ) : error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal-200 bg-white p-8 text-center">
          <p className="font-semibold">No orders yet</p>
          <Link
            to="/app/generic-medicine/home"
            className="mt-4 inline-flex rounded-2xl px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Browse medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const id = orderIdOf(order)
            return (
              <Link
                key={id}
                to={`/app/generic-medicine/orders/${encodeURIComponent(id)}`}
                className="block rounded-2xl border border-teal-100 bg-white p-4 shadow-sm hover:border-teal-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Order #{id}</p>
                    <p className="mt-1 text-xs text-setu-muted">
                      {order.OrderDate || order.order_date || order.created_at || ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" style={{ color: ACCENT }}>
                      {formatInr(orderAmount(order))}
                    </p>
                    <p className="mt-1 text-xs font-medium text-teal-800">
                      {orderStatusText(order)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </GenericShell>
  )
}

export function GenericOrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [summary, setSummary] = useState(null)
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [details, tracking] = await Promise.all([
        fetchPaymentOrderDetails(session, orderId).catch(() => null),
        trackOrder(session, orderId).catch(() => null),
      ])
      const detailPayload = details?.data || details
      setSummary(
        detailPayload?.order ||
          detailPayload?.Order ||
          detailPayload ||
          null,
      )
      setTrack(normalizeTrack(tracking))
    } catch (err) {
      setError(err.message || "Could not load order")
    } finally {
      setLoading(false)
    }
  }, [session, orderId])

  useEffect(() => {
    reload()
  }, [reload])

  const display = summary || track?.order || { OrderID: orderId }
  const items = track?.items || display?.items || display?.OrderDetails || []
  const amount = orderAmount(display)
  const paid = isOrderPaid(display)
  const showPay = shouldShowPayButton(display)

  const handlePay = async () => {
    setError("")
    setPaying(true)
    try {
      let key = RAZORPAY_KEY_ID
      let razorpayOrderId = null
      let amountPaise = Math.round(Number(amount) * 100)
      let currency = "INR"

      const tokenRes = await fetchPaymentOrderToken(session, orderId)
      const orderTokenResponse = tokenRes?.data
      const tokenSuccess =
        orderTokenResponse?.success === true ||
        orderTokenResponse?.data?.success === true ||
        orderTokenResponse?.status === true ||
        String(orderTokenResponse?.status).toLowerCase() === "true"

      const tokenPayload = orderTokenResponse?.data ?? orderTokenResponse
      const tokenOrderData = tokenPayload?.data ?? tokenPayload

      if (tokenSuccess || tokenOrderData?.id || tokenPayload?.razorpay_order_id) {
        key = tokenPayload?.key_id || key
        razorpayOrderId =
          tokenPayload?.razorpay_order_id || tokenOrderData?.id || null
        if (tokenPayload?.amount != null || tokenOrderData?.amount != null) {
          amountPaise = Math.round(
            Number(tokenPayload?.amount ?? tokenOrderData?.amount),
          )
        }
        currency = tokenPayload?.currency || tokenOrderData?.currency || "INR"
      } else {
        const createRes = await createPaymentOrder(session, orderId)
        const createOrderResponse = createRes?.data
        const nested =
          createOrderResponse?.data ??
          createOrderResponse?.response ??
          createOrderResponse
        razorpayOrderId =
          nested?.razorpay_order_id ||
          nested?.razorpayOrderId ||
          nested?.order_id ||
          nested?.id ||
          createOrderResponse?.razorpay_order_id ||
          null
        key = nested?.key_id || createOrderResponse?.key_id || key
        if (nested?.amount != null) amountPaise = Math.round(Number(nested.amount))
        currency = nested?.currency || currency
      }

      if (!key) throw new Error("Payment configuration missing")
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        throw new Error("Invalid payment amount")
      }

      const payment = await openRazorpayCheckout({
        key,
        amount: amountPaise,
        currency,
        name: "SETU Generic Medicine",
        description: `Order #${orderId}`,
        order_id: razorpayOrderId || undefined,
        theme: { color: ACCENT },
        prefill: {
          name: display.CustomerName || session?.first_name || undefined,
          contact: String(display.CustomerMobile || session?.mobile || "")
            .replace(/\D/g, "")
            .slice(-10),
          email:
            display.CustomerEmail && display.CustomerEmail !== "null"
              ? display.CustomerEmail
              : undefined,
        },
      })

      const verifyRes = await verifyPayment(session, {
        order_id: orderId,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_signature: payment.razorpay_signature,
      })

      const ok =
        verifyRes?.success === true ||
        verifyRes?.data?.success === true ||
        verifyRes?.status === true ||
        String(verifyRes?.status).toLowerCase() === "true" ||
        verifyRes?.data?.status === true ||
        String(verifyRes?.data?.status).toLowerCase() === "true"

      if (!ok) {
        throw new Error(
          verifyRes?.message ||
            verifyRes?.data?.message ||
            "Payment verification failed",
        )
      }

      navigate("/app/generic-medicine/success", { state: { orderId } })
      reload()
    } catch (err) {
      if (err.message === "Payment cancelled") {
        setError("Payment cancelled")
      } else {
        setError(err.message || "Payment failed")
      }
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <GenericShell title="Order detail" backTo="/app/generic-medicine/orders">
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-700" />
        </div>
      </GenericShell>
    )
  }

  return (
    <GenericShell title={`Order #${orderId}`} backTo="/app/generic-medicine/orders">
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="rounded-2xl border border-teal-100 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-setu-muted">Status</p>
              <p className="font-semibold text-teal-900">{orderStatusText(display)}</p>
              {paid && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  {display.OrderPayStatusText || "Payment successful"}
                </p>
              )}
              {!paid && canPayOrder(display) && (
                <p className="mt-1 text-xs text-amber-700">Payment pending</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-setu-muted">Amount</p>
              <p className="text-xl font-bold" style={{ color: ACCENT }}>
                {formatInr(amount)}
              </p>
            </div>
          </div>
          {(display.CustomerName || display.DeliveryAddress || display.address) && (
            <p className="mt-3 text-sm text-setu-muted">
              {display.CustomerName}
              {display.CustomerMobile ? ` · ${display.CustomerMobile}` : ""}
              <br />
              {display.DeliveryAddress || display.address || ""}
            </p>
          )}
        </div>

        {Array.isArray(items) && items.length > 0 && (
          <div className="rounded-2xl border border-teal-100 bg-white p-4">
            <h3 className="mb-3 font-semibold">Items</h3>
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li
                  key={item.product_id || item.ProductID || idx}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="line-clamp-2">
                    {item.product_name || item.ProductName || item.name}
                    <span className="text-setu-muted">
                      {" "}
                      × {item.OrdDetailQTY || item.qty || item.quantity || 1}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatInr(item.product_rate || item.rate || item.amount || 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(track?.timeline) && track.timeline.length > 0 && (
          <div className="rounded-2xl border border-teal-100 bg-white p-4">
            <h3 className="mb-3 font-semibold">Tracking</h3>
            <ol className="space-y-3">
              {track.timeline.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                  <div>
                    <p className="font-medium">
                      {step.status_text || step.status || step.title || "Update"}
                    </p>
                    <p className="text-xs text-setu-muted">
                      {step.date || step.created_at || step.time || ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <button
          type="button"
          className="w-full rounded-2xl border border-teal-200 py-3 text-sm font-semibold text-teal-800"
          onClick={reload}
        >
          Refresh status
        </button>

        {showPay && (
          <GenericPrimaryButton onClick={handlePay} disabled={paying}>
            {paying ? "Opening payment…" : `Pay now · ${formatInr(amount)}`}
          </GenericPrimaryButton>
        )}

        {paid && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Payment received. Your order is being processed.
          </div>
        )}
      </div>
    </GenericShell>
  )
}
