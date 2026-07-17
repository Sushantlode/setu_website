/** Book Test helpers — mirrors RN bookTestPlatformFee + bookTestReportStatus + resolveProductPrice */

export const BOOK_TEST_PLATFORM_FEE_RATE = 0.05
export const BOOK_TEST_SERVICE_CHARGE_FREE_MIN_ORDER = 300
export const REPORT_POLL_INTERVAL_MS = 45000
export const CATEGORY_IMAGE_BASE =
  "https://d10pnqyli54qno.cloudfront.net/Appointment/Categories%20/"

export const CAROUSEL_DATA = [
  {
    title: "Wellness Checkup",
    desc: "Your complete health snapshot. Covers key markers to understand your overall health status.",
    image:
      "https://d10pnqyli54qno.cloudfront.net/Appointment/Carousel/carousel_wellness.png",
    category: "WELLNESS",
  },
  {
    title: "Heart Health Panel",
    desc: "Know your heart risk early. Checks important indicators to assess heart health.",
    image:
      "https://d10pnqyli54qno.cloudfront.net/Appointment/Carousel/carousel_heart.png",
    category: "CARDIAC",
  },
  {
    title: "Diabetes Screening",
    desc: "Track your blood sugar levels. Helps detect diabetes early and monitor sugar control.",
    image:
      "https://d10pnqyli54qno.cloudfront.net/Appointment/Carousel/carousel_diabetes.png",
    category: "DIABETES",
  },
]

export const FEATURED_CATEGORIES = [
  { key: "WELLNESS", title: "Wellness Packages" },
  { key: "DIABETES", title: "Diabetes Care" },
  { key: "HEART HEALTH", title: "Heart Health" },
]

const CATEGORY_IMAGE_MAP = {
  WELLNESS: "wellness.png",
  "HEART HEALTH": "Hearthealth.png",
  DIABETES: "Diabetes.png",
  CARDIAC: "Cardiac.png",
  VITAMIN: "vitamin.png",
  LIVER: "liver.png",
  RENAL: "renal.png",
  ALLERGY: "allergy.png",
  HIV: "hiv.png",
  MALARIA: "malaria.png",
  TYPHOID: "typhoid.png",
  TUBERCULOSIS: "Tuberculosis.png",
  INFECTION: "Infection.png",
  HEPATITIS: "Hepatitis.png",
  METABOLIC: "Metabolic.png",
  THALASSEMIA: "Thalassemia.png",
  AUTOIMMUNE: "Autoimmune.png",
  SMOKING: "Smoking.png",
  "DRUG OF ABUSE": "Drug of abuse.png",
  "INFECTIOUS DISEASE": "Infectious_disease.png",
}

export function categoryImageUrl(codeOrName) {
  const key = String(codeOrName || "")
    .trim()
    .toUpperCase()
  const file = CATEGORY_IMAGE_MAP[key] || "wellness.png"
  return `${CATEGORY_IMAGE_BASE}${encodeURIComponent(file).replace(/%20/g, "%20")}`
}

function resolvePriceValue(value) {
  if (value == null) return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  if (typeof value === "object") {
    for (const key of ["sellingPrice", "listingPrice", "price", "b2C", "b2c"]) {
      const nested = resolvePriceValue(value[key])
      if (nested != null && nested > 0) return nested
    }
  }
  return null
}

export function resolveProductPrice(item) {
  const rate = item?.rate
  const candidates = [
    rate?.b2C,
    rate?.b2c,
    rate?.B2C,
    rate,
    item?.offer_price,
    item?.offerPrice,
    item?.selling_price,
    item?.price,
    item?.mrp,
    item?.amount,
  ]
  for (const c of candidates) {
    const p = resolvePriceValue(c)
    if (p != null && p > 0) return p
  }
  return 0
}

export function productCode(item) {
  return String(item?.code || item?.product_code || item?.productCode || "").trim()
}

export function productName(item) {
  return String(item?.name || item?.packageName || item?.productName || "Package").trim()
}

function normalizeTestEntry(t) {
  if (t == null) return null
  if (typeof t === "string" || typeof t === "number") {
    const name = String(t).trim()
    return name ? { name } : null
  }
  if (typeof t !== "object") return null
  const name = String(
    t.name || t.testName || t.packagename || t.groupName || t.code || "",
  ).trim()
  if (!name) return null
  return { ...t, name }
}

function testsFromGroup(group) {
  const kids =
    group?.child ||
    group?.childs ||
    group?.tests ||
    group?.testList ||
    group?.testsIncluded ||
    []
  if (!Array.isArray(kids)) return []
  return kids.map(normalizeTestEntry).filter(Boolean)
}

/** Flattened test list — handles catalog `childs` and packageDetails `packages_list`. */
export function productTests(item) {
  const packagesList = item?.packages_list
  if (Array.isArray(packagesList) && packagesList.length) {
    return packagesList.flatMap(testsFromGroup)
  }
  const list =
    item?.childs ||
    item?.child ||
    item?.tests ||
    item?.testList ||
    item?.testsIncluded ||
    item?.raw?.testsIncluded ||
    []
  if (!Array.isArray(list)) return []
  return list.map(normalizeTestEntry).filter(Boolean)
}

/** Grouped tests for package detail (matches RN HemogramList / packages_list). */
export function productTestGroups(item) {
  const packagesList = item?.packages_list
  if (Array.isArray(packagesList) && packagesList.length) {
    return packagesList
      .map((g) => ({
        name: String(
          g?.packagename || g?.packageName || g?.groupName || g?.name || "Tests",
        ).trim(),
        tests: testsFromGroup(g),
      }))
      .filter((g) => g.tests.length > 0)
  }
  const flat = productTests(item)
  if (!flat.length) return []
  return [{ name: "Tests included", tests: flat }]
}

export function formatInr(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "₹0"
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

export const roundMoney = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

export const formatMoney = (value) => roundMoney(value).toFixed(2)

export const computePlatformFee = (orderAmount) =>
  roundMoney(Math.max(0, Number(orderAmount) || 0) * BOOK_TEST_PLATFORM_FEE_RATE)

export const isServiceChargesFree = (orderAmount) =>
  roundMoney(orderAmount) > BOOK_TEST_SERVICE_CHARGE_FREE_MIN_ORDER

export const formatPlatformFeeLabel = (baseLabel = "Platform Fee") =>
  `${baseLabel} (5%)`

export function parseLineItemPrice(item) {
  const raw =
    item?.order_amount ??
    item?.amount ??
    item?.selling_price ??
    item?.price ??
    item?.offer_price ??
    item?.mrp ??
    0
  const qty = parseInt(item?.quantity, 10) || 1
  const unit = Number(String(raw).replace(/[^\d.-]/g, "") || 0)
  return unit * qty
}

export function buildCartBillingSummary({
  cartItems = [],
  cartSummary = {},
  priceBreakup = null,
} = {}) {
  const rates = priceBreakup?.rates
  const hasPriceBreakup =
    rates &&
    (rates.netPayableAmount != null ||
      rates.totalMrp != null ||
      (Array.isArray(rates.charges) && rates.charges.length > 0))

  if (hasPriceBreakup) {
    const orderAmount = roundMoney(
      rates.totalMrp ??
        cartSummary.order_amount ??
        cartItems.reduce((s, it) => s + parseLineItemPrice(it), 0),
    )
    const discount = roundMoney(rates.totalDiscount ?? cartSummary.discount ?? 0)
    const netPayable = roundMoney(rates.netPayableAmount ?? orderAmount)
    const platformFee = computePlatformFee(orderAmount)
    const totalAmount = roundMoney(Math.max(0, netPayable + platformFee - discount))
    return {
      order_amount: formatMoney(orderAmount),
      platform_fee: formatMoney(platformFee),
      discount: formatMoney(discount),
      total_amount: formatMoney(totalAmount),
      serviceChargesFree: isServiceChargesFree(orderAmount),
    }
  }

  const orderAmount = roundMoney(
    cartSummary?.order_amount != null && cartSummary.order_amount !== ""
      ? cartSummary.order_amount
      : cartItems.reduce((s, it) => s + parseLineItemPrice(it), 0),
  )
  const discount = roundMoney(cartSummary?.discount || 0)
  const platformFee = computePlatformFee(orderAmount)
  const totalAmount = roundMoney(Math.max(0, orderAmount + platformFee - discount))
  return {
    order_amount: formatMoney(orderAmount),
    platform_fee: formatMoney(platformFee),
    discount: formatMoney(discount),
    total_amount: formatMoney(totalAmount),
    serviceChargesFree: isServiceChargesFree(orderAmount),
  }
}

export function normalizeCartItems(cartPayload) {
  if (Array.isArray(cartPayload)) return cartPayload
  return (
    cartPayload?.cart_data ||
    cartPayload?.cartItems ||
    cartPayload?.items ||
    cartPayload?.data?.cart_data ||
    []
  )
}

export function normalizeCartPayload(cartPayload) {
  const items = normalizeCartItems(cartPayload)
  const priceBreakup =
    cartPayload?.price_breakup ||
    cartPayload?.priceBreakup ||
    cartPayload?.data?.price_breakup ||
    null
  const cartSummary =
    cartPayload?.cart_summary ||
    cartPayload?.cartSummary ||
    cartPayload?.data?.cart_summary ||
    {}
  return {
    items,
    billing: buildCartBillingSummary({ cartItems: items, cartSummary, priceBreakup }),
    raw: cartPayload,
  }
}

const normalizeStatus = (v) => String(v || "").trim().toUpperCase()

export function isCompletedStatusValue(value) {
  const s = normalizeStatus(value)
  return (
    s === "COMPLETED" ||
    s === "COMPLETE" ||
    s === "DONE" ||
    s === "DELIVERED" ||
    s === "FULFILLED" ||
    s === "CLOSED"
  )
}

export function isCancelledStatus(value) {
  const s = normalizeStatus(value)
  return s === "CANCELLED" || s === "CANCELED" || s === "REJECTED"
}

export function isPastOrder(order) {
  const status =
    order?.status || order?.orderStatus || order?.statusText || order?._raw?.status
  if (isCompletedStatusValue(status) || isCancelledStatus(status)) return true
  const desc = String(order?.statusText || "").toUpperCase()
  if (desc.includes("REPORT") && (desc.includes("READY") || desc.includes("GENERATED"))) {
    return true
  }
  return false
}

export function orderIdOf(order) {
  return String(
    order?.order_id || order?.orderId || order?.id || order?.refOrderNo || "",
  )
}

export function formatAppointment(order) {
  const appt = order?.appointment || order?._raw?.appointment || {}
  const date = appt.date || order?.appointmentDate || order?.date || ""
  const time = appt.startTime || appt.time || order?.appointmentTime || ""
  if (!date && !time) return "—"
  try {
    const d = new Date(`${date} ${time}`.trim())
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    }
  } catch {
    /* ignore */
  }
  return [date, time].filter(Boolean).join(", ")
}

export function normalizePhone(v) {
  const digits = String(v || "").replace(/\D/g, "")
  if (digits.length === 10) return `+91-${digits}`
  if (digits.length === 12 && digits.startsWith("91")) return `+91-${digits.slice(2)}`
  return String(v || "")
}

export function parseOrderReportPayload(apiResponse) {
  const data = apiResponse?.data?.data ?? apiResponse?.data ?? {}
  const report = data?.report ?? {}
  const patients = Array.isArray(data?.patients) ? data.patients : []
  const reportAvailable = Boolean(
    data.reportAvailable ??
      report.available ??
      patients.some((p) => p?.isReportAvailable),
  )
  return {
    reportAvailable,
    reportUrl: data.reportUrl ?? report.reportUrl ?? null,
    leadId: data.leadId ?? report.leadId ?? data.refOrderNo ?? null,
    status: data.status ?? data.orderStatus ?? null,
    tracking: Array.isArray(data?.tracking) ? data.tracking : [],
    patients,
    raw: data,
  }
}

export function diseaseLabel(d) {
  return String(d?.displayName || d?.name || d?.code || "Category").trim()
}

export function diseaseCode(d) {
  return String(d?.code || d?.name || d?.displayName || "").trim()
}
