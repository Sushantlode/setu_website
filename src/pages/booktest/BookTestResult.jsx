import { Link, useLocation } from "react-router-dom"
import { CheckCircle2, XCircle } from "lucide-react"
import BookTestShell, { BookTestPrimaryButton } from "../../components/booktest/BookTestShell"

export function BookTestSuccess() {
  const location = useLocation()
  const orderId = location.state?.orderId

  return (
    <BookTestShell title="Order placed" backTo="/app/book-tests/home" hideNav>
      <div className="mx-auto max-w-md rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
        <h2 className="mt-4 font-display text-2xl text-setu-charcoal">Order Success</h2>
        <p className="mt-2 text-sm text-setu-muted">
          Your lab test booking is confirmed. Our phlebotomist will visit at the selected slot.
        </p>
        {orderId && (
          <p className="mt-3 text-sm font-semibold text-violet-800">Order ID: {orderId}</p>
        )}
        <div className="mt-6 space-y-2">
          <Link to="/app/book-tests/orders">
            <BookTestPrimaryButton>View my orders</BookTestPrimaryButton>
          </Link>
          <Link
            to="/app/book-tests/home"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-violet-200 text-sm font-semibold text-violet-800"
          >
            Book more tests
          </Link>
        </div>
      </div>
    </BookTestShell>
  )
}

export function BookTestFailure() {
  const location = useLocation()
  const message = location.state?.message || "Payment failed. Please try again."

  return (
    <BookTestShell title="Order failed" backTo="/app/book-tests/checkout" hideNav>
      <div className="mx-auto max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <XCircle className="mx-auto text-red-600" size={48} />
        <h2 className="mt-4 font-display text-2xl text-setu-charcoal">Order Failure</h2>
        <p className="mt-2 text-sm text-setu-muted">{message}</p>
        <div className="mt-6 space-y-2">
          <Link to="/app/book-tests/checkout">
            <BookTestPrimaryButton>Retry checkout</BookTestPrimaryButton>
          </Link>
          <Link
            to="/app/book-tests/cart"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-violet-200 text-sm font-semibold text-violet-800"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </BookTestShell>
  )
}
