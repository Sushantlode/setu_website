/**
 * Generic Medicine API — mirrors setuReactNative/src/Utils/api/genericApi.js
 * Base: /generic/api
 */
import { apiUrl, buildStorageObjectUrl, genericUrl } from "../config/api"
import { authFetch } from "./http"

/** Vendor cart/compare endpoints expect Android or Ios (matches RN). */
const GENERIC_DEVICE = "Android"

function unwrap(data) {
  if (data?.data != null && typeof data.data === "object") return data.data
  return data
}

function assertOk(response, data, fallback) {
  // Generic API often returns 200 with Success:false / hasError
  const failed =
    !response.ok ||
    data?.hasError === true ||
    data?.Success === false ||
    data?.success === false
  if (!failed) return data
  const msg =
    data?.errors?.messages ||
    data?.errors?.message ||
    data?.message ||
    data?.Message ||
    data?.messages ||
    data?.error ||
    data?.data?.message ||
    fallback ||
    "Request failed"
  const err = new Error(msg)
  err.status = response.status
  err.data = data
  throw err
}

async function gmFetch(path, { session, method = "POST", body } = {}) {
  const { response, data } = await authFetch(genericUrl(path), {
    method,
    token: session?.token,
    refreshToken: session?.refreshToken,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  return { response, data }
}

export function getCategoryImageUrl(id) {
  if (!id) return null
  return buildStorageObjectUrl(`Genric_Medicine/Categories/${id}.png`, "image/png")
}

/**
 * Product image URL — mirrors RN GenericMedicineHome / ProductView:
 * `${product_image_path}${product_image_name}`
 */
export function getProductImageUrl(productOrPath, nameMaybe) {
  // Legacy: getProductImageUrl(path, name)
  if (typeof productOrPath === "string" || productOrPath == null) {
    const path = productOrPath
    const name = nameMaybe
    if (path && name) return `${path}${name}`
    if (typeof path === "string" && path.startsWith("http")) return path
    return null
  }

  const item = productOrPath
  const path = item.product_image_path
  const fileName =
    item.product_image_name ||
    item.product_image ||
    item.image_name ||
    null

  if (path && fileName) {
    // path may already be a full URL ending with /; fileName is the file
    if (String(path).startsWith("http") && String(path).includes(String(fileName))) {
      return path
    }
    return `${path}${fileName}`
  }
  if (typeof path === "string" && path.startsWith("http")) return path
  if (typeof item.product_image === "string" && item.product_image.startsWith("http")) {
    return item.product_image
  }
  if (typeof item.image_url === "string" && item.image_url.startsWith("http")) {
    return item.image_url
  }
  if (typeof item.image === "string" && item.image.startsWith("http")) {
    return item.image
  }
  return null
}

export async function onboardUser(session) {
  try {
    await gmFetch("/user/onboard", { session, body: {} })
  } catch {
    /* non-blocking */
  }
}

export async function fetchCategories(session) {
  const { response, data } = await gmFetch("/products/categories", {
    session,
    body: { m_key: "" },
  })
  assertOk(response, data, "Could not load categories")
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : raw?.categories || data?.data || []
}

export async function fetchProductsByCategory(session, categoryId, page = "1") {
  const { response, data } = await gmFetch("/products/by-category", {
    session,
    body: {
      m_key: "",
      category_id: String(categoryId),
      page: String(page),
    },
  })
  assertOk(response, data, "Could not load products")
  const raw = unwrap(data)
  return {
    products: Array.isArray(raw) ? raw : raw?.products || raw?.data || data?.data || [],
    pages: data?.pages || raw?.pages || 1,
  }
}

export async function searchBrand(session, query) {
  const { response, data } = await gmFetch("/products/search-brand", {
    session,
    body: { m_key: "", search: query },
  })
  if (!response.ok) return []
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : raw?.products || data?.data || []
}

export async function searchGeneric(session, query) {
  const { response, data } = await gmFetch("/products/search-generic", {
    session,
    body: { m_key: "", search: query },
  })
  if (!response.ok) return []
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : raw?.products || data?.data || []
}

export async function searchAllProducts(session, query) {
  const [brand, gen] = await Promise.all([
    searchBrand(session, query).catch(() => []),
    searchGeneric(session, query).catch(() => []),
  ])
  const map = new Map()
  ;[...brand, ...gen].forEach((p) => {
    const key = String(p?.product_id || p?.uuid4 || "")
    if (key && !map.has(key)) map.set(key, p)
  })
  return [...map.values()]
}

export async function fetchProductDetails(session, productId) {
  const { response, data } = await gmFetch("/products/details", {
    session,
    body: { m_key: "", product_id: String(productId) },
  })
  assertOk(response, data, "Could not load product")

  // Match RN ProductDetailsGen: product_details[0] + top-level similar_product
  const rawDetails = data?.product_details?.[0]
  if (rawDetails) {
    return {
      ...rawDetails,
      prescription_status:
        rawDetails.prescription_status || rawDetails.prescription_stauts,
      similar_product: data?.similar_product || [],
    }
  }

  const raw = unwrap(data)
  const product = raw?.product || raw || data?.data || {}
  return {
    ...product,
    similar_product: data?.similar_product || product.similar_product || [],
  }
}

export async function fetchCartList(session) {
  const { response, data } = await gmFetch("/cart/list", {
    session,
    body: { m_key: "" },
  })
  assertOk(response, data, "Could not load cart")
  const items = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(unwrap(data))
      ? unwrap(data)
      : data?.data?.items || []
  return {
    items,
    orderId: data?.order_id || data?.data?.order_id || null,
    prescriptionNeeded: String(
      data?.prescription_needed ?? data?.data?.prescription_needed ?? "0",
    ),
    prescriptionMessage:
      data?.prescription_needed_msg || data?.data?.prescription_needed_msg || "",
    raw: data,
  }
}

export async function addToCart(session, productId, qty) {
  const { response, data } = await gmFetch("/cart/add", {
    session,
    body: { product_id: String(productId), order_qty: String(qty) },
  })
  assertOk(response, data, "Could not update cart")
  return data
}

export async function removeCartItem(session, productId) {
  const { response, data } = await gmFetch("/cart/remove", {
    session,
    body: {
      product_id: String(productId),
      order_qty: "1",
      device: GENERIC_DEVICE,
    },
  })
  assertOk(response, data, "Could not remove item")
  return data
}

export async function submitCart(session, payload) {
  const { response, data } = await gmFetch("/cart/submit", {
    session,
    body: payload,
  })
  assertOk(response, data, "Could not submit order")
  return data
}

export async function fetchAddressList(session) {
  const { response, data } = await gmFetch("/address/list", {
    session,
    body: { m_key: "" },
  })
  assertOk(response, data, "Could not load addresses")
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : raw?.addresses || data?.data || []
}

export async function addAddress(session, payload) {
  const { response, data } = await gmFetch("/address/add", { session, body: payload })
  assertOk(response, data, "Could not save address")
  return unwrap(data) || data
}

export async function updateAddress(session, payload) {
  const { response, data } = await gmFetch("/address/update", { session, body: payload })
  assertOk(response, data, "Could not update address")
  return unwrap(data) || data
}

export async function deleteAddress(session, addressId) {
  const { response, data } = await gmFetch("/address/delete", {
    session,
    body: { address_id: addressId },
  })
  assertOk(response, data, "Could not delete address")
  return data
}

export async function fetchStates(session) {
  const { response, data } = await gmFetch("/location/states", { session, body: {} })
  if (!response.ok) return []
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : data?.data || []
}

export async function fetchDistricts(session, stateUuid) {
  const { response, data } = await gmFetch("/location/districts", {
    session,
    body: { fk_state_uuid4: stateUuid, state_uuid4: stateUuid },
  })
  if (!response.ok) return []
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : data?.data || []
}

export async function fetchCities(session, districtUuid) {
  const { response, data } = await gmFetch("/location/cities", {
    session,
    body: { fk_district_uuid4: districtUuid, district_uuid4: districtUuid },
  })
  if (!response.ok) return []
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : data?.data || []
}

function parseOrdersResponse(data) {
  if (data?.success && data?.orders && typeof data.orders === "object") {
    const parsed = Object.values(data.orders).map((orderItem) => {
      const summaryObj = orderItem.order_summary
        ? Object.values(orderItem.order_summary)[0]
        : {}
      const productsArray = orderItem.product_details
        ? Object.values(orderItem.product_details)
        : []
      return {
        id: Number(summaryObj.OrderID),
        summary: summaryObj,
        products: productsArray,
        shipping: orderItem.shipping_data || {},
        prescription: orderItem.prescription || {},
        ...summaryObj,
      }
    })
    parsed.sort((a, b) => (b.id || 0) - (a.id || 0))
    return parsed
  }

  const raw = unwrap(data)
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.orders)) return raw.orders
  if (raw?.orders && typeof raw.orders === "object") {
    return parseOrdersResponse({ success: true, orders: raw.orders })
  }
  return data?.data || []
}

export async function fetchOrders(session) {
  const { response, data } = await gmFetch("/orders/all", { session, body: {} })
  assertOk(response, data, "Could not load orders")
  return parseOrdersResponse(data)
}

export async function trackOrder(session, orderId) {
  const { response, data } = await gmFetch("/orders/track", {
    session,
    body: { order_id: String(orderId) },
  })
  assertOk(response, data, "Could not track order")
  return unwrap(data) || data
}

export async function fetchPaymentOrderDetails(session, orderId) {
  const { response, data } = await gmFetch("/payment/order-details", {
    session,
    body: { order_id: String(orderId) },
  })
  assertOk(response, data, "Could not load payment details")
  return unwrap(data) || data
}

export async function fetchPaymentOrderToken(session, orderId) {
  const { response, data } = await gmFetch("/payment/order-token", {
    session,
    body: { order_id: String(orderId) },
  })
  // Caller handles soft-fail / create-order fallback (matches RN GenOrderDetail)
  return { response, data }
}

export async function createPaymentOrder(session, orderId) {
  const { response, data } = await gmFetch("/payment/create-order", {
    session,
    body: { order_id: String(orderId) },
  })
  return { response, data }
}

export async function verifyPayment(session, payload) {
  const { response, data } = await gmFetch("/payment/verify", {
    session,
    body: payload,
  })
  assertOk(response, data, "Payment verification failed")
  return unwrap(data) || data
}

export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_Rgl75wP2oROCnL"

export async function fetchPrescriptions(session) {
  const { response, data } = await gmFetch("/prescriptions/list", {
    session,
    body: { m_key: "" },
  })
  assertOk(response, data, "Could not load prescriptions")
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : data?.data || []
}

export async function removePrescription(session, docId) {
  const { response, data } = await gmFetch("/prescriptions/remove", {
    session,
    body: { doc_id: docId },
  })
  assertOk(response, data, "Could not remove prescription")
  return data
}

export async function uploadPrescription(session, { file, orderId, cart = false }) {
  const form = new FormData()
  form.append("file", file)
  form.append("m_key", "")
  if (orderId) form.append("order_id", String(orderId))
  if (cart) form.append("cart", "1")

  const headers = { Accept: "application/json" }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`
  if (session?.refreshToken) {
    headers["x-refresh-token"] = session.refreshToken
    headers["X-REFRESH-TOKEN"] = session.refreshToken
  }

  const res = await fetch(genericUrl("/prescriptions/upload"), {
    method: "POST",
    headers,
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  assertOk(res, data, "Could not upload prescription")
  return data
}

export async function submitPlainPrescription(session, payload) {
  const { response, data } = await gmFetch("/prescriptions/submit-plain", {
    session,
    body: payload,
  })
  assertOk(response, data, "Could not submit prescription details")
  return data
}

export async function brandComparisonSearch(session, search) {
  const { response, data } = await gmFetch("/brandcomparison/search", {
    session,
    body: { search },
  })
  assertOk(response, data, "Search failed")
  return normalizeBrandSearchList(data)
}

/** Search returns branded options only — generic alt shows after add (matches RN). */
export function normalizeBrandSearchList(data) {
  const raw = unwrap(data)
  if (Array.isArray(raw)) return raw
  if (Array.isArray(data?.data)) return data.data
  const root = raw && typeof raw === "object" ? raw : data
  if (!root || typeof root !== "object") return []
  if (Array.isArray(root.data)) return root.data
  return Object.keys(root)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => root[k])
    .filter((row) => row && typeof row === "object")
}

export function brandSearchBrandName(row) {
  return String(row?.BrandName || row?.brand_name || row?.MedicineName || "Medicine").trim()
}

export function brandSearchCompany(row) {
  return String(row?.CompanyName || row?.company_name || row?.MfgName || "").trim()
}

export function brandSearchPackaging(row) {
  return String(row?.Packaging || row?.packaging || row?.PackSize || "").trim()
}

export function brandSearchBrandPrice(row) {
  const n = Number(row?.PriceBrand ?? row?.brand_price ?? row?.MRP ?? 0)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function compareItemQty(item) {
  return parseInt(item?.CalcItemQty ?? item?.Qty ?? item?.qty ?? 1, 10) || 1
}

export function compareBrandUnitPrice(item) {
  return (
    parseFloat(item?.BrandPrice ?? item?.brand_price ?? item?.MRP ?? 0) || 0
  )
}

export function compareGenericUnitPrice(item) {
  return (
    parseFloat(
      item?.GenericPrice ?? item?.generic_price ?? item?.Price ?? 0,
    ) || 0
  )
}

/** RN MedicineComparison: BrandPrice × CalcItemQty (not BrandAmount) */
export function compareBrandLineTotal(item) {
  const explicit = Number(item?.BrandAmount ?? item?.brand_amount)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return compareBrandUnitPrice(item) * compareItemQty(item)
}

export function compareGenericLineTotal(item) {
  const explicit = Number(item?.GenericAmount ?? item?.generic_amount)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return compareGenericUnitPrice(item) * compareItemQty(item)
}

export async function brandComparisonAdd(session, medicineRowId, qty) {
  const { response, data } = await gmFetch("/brandcomparison/add", {
    session,
    body: { MedicineRowID: medicineRowId, qty: String(qty) },
  })
  assertOk(response, data, "Could not add to comparison")
  return data
}

export async function brandComparisonSaved(session) {
  try {
    const { response, data } = await gmFetch("/brandcomparison/saved", {
      session,
      body: {},
    })
    const failed =
      !response.ok ||
      data?.success === false ||
      data?.Success === false ||
      data?.hasError === true

    if (failed) {
      return {
        data: [],
        total_saving_amount: 0,
        total_saving_per: 0,
      }
    }

    if (Array.isArray(data?.data)) {
      return {
        data: data.data,
        total_saving_amount: data.total_saving_amount,
        total_saving_per: data.total_saving_per,
        total_brand_amt: data.total_brand_amt,
        total_generic_amt: data.total_generic_amt,
      }
    }

    const raw = unwrap(data) || data
    if (Array.isArray(raw)) {
      return { data: raw, total_saving_amount: 0, total_saving_per: 0 }
    }
    return raw || { data: [], total_saving_amount: 0, total_saving_per: 0 }
  } catch {
    // Empty calculator / vendor down — compare still works via search
    return { data: [], total_saving_amount: 0, total_saving_per: 0 }
  }
}

export async function brandComparisonRemove(session, calcItemId) {
  const { response, data } = await gmFetch("/brandcomparison/remove", {
    session,
    body: { CalcItemID: calcItemId },
  })
  assertOk(response, data, "Could not remove item")
  return data
}

export async function brandComparisonProceed(session) {
  const { response, data } = await gmFetch("/brandcomparison/proceed", {
    session,
    body: { device: GENERIC_DEVICE },
  })
  assertOk(response, data, "Could not proceed to cart")
  return data
}

export async function submitMedicineRequest(session, payload) {
  const { response, data } = await gmFetch("/medicine-requests", {
    session,
    body: payload,
  })
  assertOk(response, data, "Could not submit request")
  return data
}

export async function fetchMyMedicineRequests(session, page = 1) {
  const { response, data } = await authFetch(
    `${apiUrl("/generic/medicine-requests/mine")}?page=${page}&limit=10`,
    {
      method: "GET",
      token: session?.token,
      refreshToken: session?.refreshToken,
    },
  )
  if (!response.ok) {
    // fallback to generic base
    const alt = await gmFetch("/medicine-requests/mine", {
      session,
      method: "GET",
    }).catch(() => null)
    if (alt) {
      const raw = unwrap(alt.data)
      return Array.isArray(raw) ? raw : alt.data?.data || []
    }
    return []
  }
  const raw = unwrap(data)
  return Array.isArray(raw) ? raw : data?.data || []
}
