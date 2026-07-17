import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  Scale,
  ShoppingCart,
} from "lucide-react"
import { useGenericMedicine } from "../../context/GenericMedicineContext"
import {
  ACCENT,
  formatInr,
  productDiscount,
  productMrp,
  productName,
  productRate,
} from "../../utils/generic"
import { getProductImageUrl } from "../../api/generic"

export default function GenericShell({
  title = "Generic Medicine",
  backTo = "/app/generic-medicine/home",
  children,
  hideNav = false,
}) {
  const { cartCount } = useGenericMedicine()

  return (
    <div className="min-h-svh bg-[#F2FFFC]">
      <header className="app-shell-header sticky top-0 z-20 border-b border-teal-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link
            to={backTo}
            className="tap-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800 hover:bg-teal-100"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate font-display text-lg text-setu-charcoal sm:text-xl">
            {title}
          </h1>
          {!hideNav && (
            <div className="flex items-center gap-1">
              <Link
                to="/app/generic-medicine/compare"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
                aria-label="Compare"
              >
                <Scale size={18} />
              </Link>
              <Link
                to="/app/generic-medicine/requests"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
                aria-label="Requests"
              >
                <FlaskConical size={18} />
              </Link>
              <Link
                to="/app/generic-medicine/orders"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
                aria-label="Orders"
              >
                <ClipboardList size={18} />
              </Link>
              <Link
                to="/app/generic-medicine/cart"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className="app-shell-main mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-5">
        {children}
      </main>
    </div>
  )
}

export function GenericPrimaryButton({ children, className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white shadow-sm transition enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ backgroundColor: ACCENT }}
      {...props}
    >
      {children}
    </button>
  )
}

export function MedicineCard({ item, onOpen, onAdd, adding }) {
  const name = productName(item)
  const mrp = productMrp(item)
  const rate = productRate(item)
  const discount = productDiscount(item)
  const img = getProductImageUrl(item)

  return (
    <article className="flex flex-col rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <button type="button" onClick={onOpen} className="text-left">
        <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-teal-50/70">
          {img ? (
            <img
              src={img}
              alt=""
              className="max-h-20 max-w-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
                const fallback = e.currentTarget.nextElementSibling
                if (fallback) fallback.classList.remove("hidden")
              }}
            />
          ) : null}
          <span className={`text-xs text-teal-600 ${img ? "hidden" : ""}`}>SETU</span>
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold text-setu-charcoal">{name}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-setu-muted">
          {item?.product_mfg_name || item?.packing_type || item?.packaging_type || ""}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold" style={{ color: ACCENT }}>
            {formatInr(rate)}
          </span>
          {mrp > rate && (
            <span className="text-xs text-setu-muted line-through">{formatInr(mrp)}</span>
          )}
          {discount > 0 && (
            <span className="text-xs font-semibold text-emerald-600">{discount}% off</span>
          )}
        </div>
      </button>
      <button
        type="button"
        disabled={adding}
        onClick={onAdd}
        className="mt-3 rounded-xl py-2 text-xs font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: ACCENT }}
      >
        {adding ? "Adding…" : "Add to cart"}
      </button>
    </article>
  )
}

export function CartBillSummary({ bill }) {
  if (!bill) return null
  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4">
      <h3 className="font-semibold text-setu-charcoal">Bill details</h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-setu-muted">Item total (MRP)</dt>
          <dd>{formatInr(bill.mrpTotal)}</dd>
        </div>
        <div className="flex justify-between text-emerald-700">
          <dt>Price discount</dt>
          <dd>-{formatInr(bill.discount)}</dd>
        </div>
        <div className="flex justify-between border-t border-teal-50 pt-2 text-base font-semibold">
          <dt>Total amount</dt>
          <dd style={{ color: ACCENT }}>{formatInr(bill.totalPayable)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-setu-muted">Minimum order value ₹100</p>
    </div>
  )
}
