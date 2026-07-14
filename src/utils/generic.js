/** Generic Medicine helpers — mirrors RN pricing / cart / Rx rules */

export const ACCENT = "#14B8A6"
export const MIN_CART_ORDER_TOTAL = 100
export const FEATURED_CATEGORY_IDS = ["18", "19", "33"]
export const PAYABLE_ORDER_STATUSES = new Set(["0", "1", "22"])

export const PRE_FOR_OPTIONS = [
  { id: "1", label: "Self" },
  { id: "2", label: "Family Member" },
  { id: "3", label: "Others" },
]

export const LAST_DOCTOR_VISIT_OPTIONS = [
  { id: "1", label: "0–3 months" },
  { id: "2", label: "3–6 months" },
  { id: "3", label: "6–12 months" },
  { id: "4", label: "1 year+" },
]

export const MEDICINE_CONSUME_OPTIONS = [
  { id: "1", label: "First time" },
  { id: "2", label: "Less than 1 month" },
  { id: "3", label: "1–6 months" },
  { id: "4", label: "6–12 months" },
  { id: "5", label: "1 year+" },
]

export const ADDRESS_TYPES = [
  { id: "1", label: "Home" },
  { id: "2", label: "Office" },
]

export function productId(p) {
  return String(p?.product_id || p?.uuid4 || p?.ProductID || "").trim()
}

export function productName(p) {
  return String(p?.product_name || p?.ProductName || p?.name || "Medicine").trim()
}

export function productMrp(p) {
  return Number(p?.product_MRP ?? p?.product_mrp ?? p?.MRP ?? 0) || 0
}

export function productRate(p) {
  return Number(p?.product_rate ?? p?.product_Rate ?? p?.rate ?? 0) || 0
}

export function productDiscount(p) {
  const listed = Number(p?.discount)
  if (Number.isFinite(listed) && listed > 0) return listed
  const mrp = productMrp(p)
  const rate = productRate(p)
  if (mrp > 0 && rate > 0 && rate < mrp) {
    return Math.round(((mrp - rate) / mrp) * 100)
  }
  return 0
}

export function productStock(p) {
  const n = Number(p?.ProductStock ?? p?.product_stock ?? p?.stock)
  return Number.isFinite(n) ? n : 999
}

export function productQtyLimit(p) {
  const n = Number(p?.CartProductQtyLimit ?? p?.cart_qty_limit)
  return Number.isFinite(n) && n > 0 ? n : 20
}

export function maxOrderQty(p) {
  return Math.max(1, Math.min(productQtyLimit(p), productStock(p)))
}

export function isNotForOnlineSale(p) {
  const v = p?.IsNotForSellOnline ?? p?.IsNotForOnlineSale ?? p?.is_not_for_online_sale
  return v === true || v === 1 || v === "1"
}

export function isOutOfStock(p) {
  return productStock(p) <= 0
}

export function prescriptionStatus(p) {
  return String(p?.prescription_status ?? p?.prescription_stauts ?? "0")
}

export function formatInr(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "₹0"
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export function cartLineQty(item) {
  return parseInt(item?.OrdDetailQTY ?? item?.order_qty ?? item?.qty ?? 1, 10) || 1
}

export function computeCartBill(items = []) {
  let mrpTotal = 0
  let rateTotal = 0
  items.forEach((it) => {
    const qty = cartLineQty(it)
    mrpTotal += productMrp(it) * qty
    rateTotal += productRate(it) * qty
  })
  const discount = Math.max(0, mrpTotal - rateTotal)
  return {
    mrpTotal: Math.round(mrpTotal * 100) / 100,
    rateTotal: Math.round(rateTotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    totalPayable: Math.round(rateTotal * 100) / 100,
  }
}

export function meetsMinCart(totalPayable) {
  return Number(totalPayable) >= MIN_CART_ORDER_TOTAL
}

export function orderIdOf(order) {
  return String(order?.OrderID || order?.order_id || order?.orderId || order?.id || "")
}

export function orderAmount(order) {
  return Number(order?.OrderAmount || order?.order_amount || order?.amount || 0)
}

export function orderStatus(order) {
  return String(order?.OrderStatus ?? order?.order_status ?? order?.status ?? "")
}

export function orderStatusText(order) {
  return (
    order?.OrderStatusText ||
    order?.order_status_text ||
    order?.statusText ||
    orderStatus(order) ||
    "—"
  )
}

export function isOrderPaid(order) {
  if (!order) return false
  const payStatus = String(order?.OrderPayStatus ?? order?.order_pay_status ?? "").trim()
  if (payStatus === "2") return true
  if (payStatus === "1" || payStatus === "0") return false

  const payStatusText = String(
    order?.OrderPayStatusText ?? order?.order_pay_status_text ?? "",
  )
    .trim()
    .toLowerCase()
  if (!payStatusText) return false
  if (
    payStatusText.includes("unpaid") ||
    payStatusText.includes("not paid") ||
    payStatusText.includes("pending payment")
  ) {
    return false
  }
  return payStatusText === "paid" || payStatusText.includes("payment successful")
}

export function canPayOrder(order) {
  return PAYABLE_ORDER_STATUSES.has(orderStatus(order))
}

/** RN: show pay when status allows payment and order is not already paid */
export function shouldShowPayButton(order) {
  return canPayOrder(order) && !isOrderPaid(order)
}

export function categoryId(c) {
  return String(c?.category_id || c?.CategoryID || c?.id || "").trim()
}

export function categoryName(c) {
  return String(c?.category_name || c?.CategoryName || c?.name || "Category").trim()
}

export function locationName(row) {
  return String(row?.name || row?.Name || row?.state_name || row?.district_name || row?.city_name || "").trim()
}

export function locationUuid(row) {
  return String(row?.uuid4 || row?.UUID4 || row?.id || "").trim()
}
