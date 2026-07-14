import { Link, useLocation } from "react-router-dom"
import { CheckCircle2, XCircle } from "lucide-react"
import GenericShell, { GenericPrimaryButton } from "../../components/generic/GenericShell"
import { ACCENT } from "../../utils/generic"

export function GenericSuccess() {
  const location = useLocation()
  const orderId = location.state?.orderId

  return (
    <GenericShell title="Payment success" backTo="/app/generic-medicine/home" hideNav>
      <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
        <h2 className="mt-4 font-display text-2xl text-setu-charcoal">Payment successful</h2>
        <p className="mt-2 text-sm text-setu-muted">
          Your generic medicine order is confirmed. You can track delivery from My Orders.
        </p>
        {orderId && (
          <p className="mt-3 text-sm font-semibold" style={{ color: ACCENT }}>
            Order ID: {orderId}
          </p>
        )}
        <div className="mt-6 space-y-2">
          <Link to={orderId ? `/app/generic-medicine/orders/${encodeURIComponent(orderId)}` : "/app/generic-medicine/orders"}>
            <GenericPrimaryButton>View order</GenericPrimaryButton>
          </Link>
          <Link
            to="/app/generic-medicine/home"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-teal-200 text-sm font-semibold text-teal-800"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </GenericShell>
  )
}

export function GenericFailure() {
  const location = useLocation()
  const orderId = location.state?.orderId
  const message = location.state?.message || "Payment failed. Please try again."

  return (
    <GenericShell
      title="Payment failed"
      backTo={
        orderId
          ? `/app/generic-medicine/orders/${encodeURIComponent(orderId)}`
          : "/app/generic-medicine/orders"
      }
      hideNav
    >
      <div className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <XCircle className="mx-auto text-red-600" size={48} />
        <h2 className="mt-4 font-display text-2xl text-setu-charcoal">Payment failed</h2>
        <p className="mt-2 text-sm text-setu-muted">{message}</p>
        <div className="mt-6 space-y-2">
          <Link
            to={
              orderId
                ? `/app/generic-medicine/orders/${encodeURIComponent(orderId)}`
                : "/app/generic-medicine/orders"
            }
          >
            <GenericPrimaryButton>Retry payment</GenericPrimaryButton>
          </Link>
          <Link
            to="/app/generic-medicine/cart"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-teal-200 text-sm font-semibold text-teal-800"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </GenericShell>
  )
}
