/**
 * Agriculture / Agri Connect APIs — mirrors setuReactNative NewAgriculture.
 */
import { agriUrl, CLOUDFRONT_BASE, resolveStorageImageUrl } from "../config/api"
import { authFetch } from "./http"

export const AGRI_PRIMARY = "#1E6E33"
export const AGRI_CTA = "#307E33"
export const AGRI_BG = "#F5F8F3"

export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_Rgl75wP2oROCnL"

export const PRODUCT_FALLBACK_IMAGES = {
  Seeds: "Agri-connect/public/fertilizer_bag.png",
  Fertilizers: "Agri-connect/public/fertilizer_jar.png",
  Pesticides: "Agri-connect/public/pesticide.png",
  Equipment: "Agri-connect/public/soil_moisture_sensor.png",
  Irrigation: "Agri-connect/public/organic_bottle.png",
  default: "Agri-connect/public/organic_bottle.png",
}

function qs(params = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === "") return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ""
}

export function agriImage(keyOrUrl, category) {
  if (keyOrUrl) {
    const raw = String(keyOrUrl)
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return resolveStorageImageUrl(raw) || raw
    }
    if (raw.startsWith("/")) return raw
    const cf = `${CLOUDFRONT_BASE}/${raw.replace(/^\//, "")}`
    return resolveStorageImageUrl(cf) || cf
  }
  const fallback =
    PRODUCT_FALLBACK_IMAGES[category] || PRODUCT_FALLBACK_IMAGES.default
  return `${CLOUDFRONT_BASE}/${fallback}`
}

async function agriPublicGet(path, params) {
  const response = await fetch(agriUrl(`/api/v1${path}${qs(params)}`), {
    headers: { Accept: "application/json" },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Agriculture request failed")
  }
  return data
}

async function agriAuth(method, path, body, { token, refreshToken, params } = {}) {
  const { response, data } = await authFetch(
    agriUrl(`/api/v1${path}${qs(params)}`),
    {
      method,
      token,
      refreshToken,
      body: body != null ? JSON.stringify(body) : undefined,
    },
  )
  if (!response.ok || data?.success === false) {
    const err = new Error(data?.message || "Agriculture request failed")
    err.status = response.status
    err.requiresAuth = response.status === 401
    throw err
  }
  return data
}

export async function fetchAgriBanners() {
  const data = await agriPublicGet("/agri-banners")
  return Array.isArray(data?.data) ? data.data : []
}

export async function fetchAgriKnowledge() {
  const data = await agriPublicGet("/agri-knowledge")
  return Array.isArray(data?.data) ? data.data : []
}

export async function fetchAgriKnowledgeById(id) {
  const data = await agriPublicGet(`/agri-knowledge/${encodeURIComponent(id)}`)
  return data?.data ?? data
}

export async function fetchAgriProducts({
  category,
  search,
  limit = 50,
  offset = 0,
  token,
  refreshToken,
} = {}) {
  if (token) {
    const data = await agriAuth(
      "GET",
      "/agri-products",
      null,
      { token, refreshToken, params: { category, search, limit, offset } },
    )
    return Array.isArray(data?.data) ? data.data : []
  }
  const data = await agriPublicGet("/agri-products", {
    category,
    search,
    limit,
    offset,
  })
  return Array.isArray(data?.data) ? data.data : []
}

export async function fetchAgriProduct(id, auth = {}) {
  if (auth.token) {
    const data = await agriAuth(
      "GET",
      `/agri-products/${encodeURIComponent(id)}`,
      null,
      auth,
    )
    return data?.data ?? data
  }
  const data = await agriPublicGet(`/agri-products/${encodeURIComponent(id)}`)
  return data?.data ?? data
}

export async function fetchAgriCategories(auth = {}) {
  if (auth.token) {
    const data = await agriAuth("GET", "/agri-products/categories", null, auth)
    const list = data?.data
    if (Array.isArray(list)) return list.map((c) => (typeof c === "string" ? c : c?.name || c?.category)).filter(Boolean)
    return []
  }
  const data = await agriPublicGet("/agri-products/categories")
  const list = data?.data
  if (Array.isArray(list)) {
    return list
      .map((c) => (typeof c === "string" ? c : c?.name || c?.category))
      .filter(Boolean)
  }
  return []
}

export async function fetchAgriCart(auth) {
  const data = await agriAuth("GET", "/agri-cart/me", null, auth)
  return data?.data ?? data
}

export async function addToAgriCart(productId, quantity, auth) {
  const data = await agriAuth(
    "POST",
    "/agri-cart",
    { product_id: productId, quantity },
    auth,
  )
  return data?.data ?? data
}

export async function updateAgriCartItem(itemId, quantity, auth) {
  const data = await agriAuth(
    "PUT",
    `/agri-cart/${encodeURIComponent(itemId)}`,
    { quantity },
    auth,
  )
  return data?.data ?? data
}

export async function removeAgriCartItem(itemId, auth) {
  return agriAuth("DELETE", `/agri-cart/${encodeURIComponent(itemId)}`, null, auth)
}

export async function clearAgriCart(auth) {
  return agriAuth("DELETE", "/agri-cart/me/clear", null, auth)
}

export async function fetchAgriAddresses(auth) {
  const data = await agriAuth("GET", "/agri-address", null, auth)
  return Array.isArray(data?.data) ? data.data : []
}

export async function createAgriAddress(body, auth) {
  const data = await agriAuth("POST", "/agri-address", body, auth)
  return data?.data ?? data
}

export async function deleteAgriAddress(id, auth) {
  return agriAuth("DELETE", `/agri-address/${encodeURIComponent(id)}`, null, auth)
}

export async function checkoutAgriOrder({ addressId, notes }, auth) {
  const data = await agriAuth(
    "POST",
    "/agri-orders/checkout",
    { address_id: addressId, notes: notes || "" },
    auth,
  )
  return data?.data ?? data
}

export async function verifyAgriPayment(payload, auth) {
  const data = await agriAuth("POST", "/agri-orders/verify-payment", payload, auth)
  return data?.data ?? data
}

export async function fetchAgriOrders(auth, { limit = 50, offset = 0 } = {}) {
  const data = await agriAuth("GET", "/agri-orders/me", null, {
    ...auth,
    params: { limit, offset },
  })
  return Array.isArray(data?.data) ? data.data : []
}

export async function cancelAgriOrder(id, auth) {
  return agriAuth("POST", `/agri-orders/${encodeURIComponent(id)}/cancel`, null, auth)
}

export async function fetchSoilBookings(auth) {
  const data = await agriAuth("GET", "/soil-test/my-bookings-auth", null, auth)
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.bookings)) return data.data.bookings
  return []
}

export async function bookSoilTest(payload, auth) {
  const data = await agriAuth("POST", "/soil-test/book", payload, auth)
  return data?.data ?? data
}

export async function cancelSoilBooking(id, auth) {
  return agriAuth("POST", `/soil-test/${encodeURIComponent(id)}/cancel`, null, auth)
}

export async function submitAgriInquiry(payload, auth) {
  const data = await agriAuth("POST", "/agri-user-questions", payload, auth)
  return data?.data ?? data
}

export async function fetchAgriInquiries(auth, { page = 1, limit = 20 } = {}) {
  const data = await agriAuth("GET", "/agri-user-questions", null, {
    ...auth,
    params: { page, limit },
  })
  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta || {},
  }
}

export async function fetchGreenlensCrops(auth) {
  const data = await agriAuth("GET", "/greenlens/crops", null, auth)
  const root = data?.data?.data ?? data?.data ?? data
  const crops = root?.crops ?? root?.data?.crops ?? root
  return Array.isArray(crops) ? crops : []
}

export async function fetchGreenlensCategories(auth) {
  const data = await agriAuth("GET", "/greenlens/categories", null, auth)
  const root = data?.data?.data ?? data?.data ?? data
  const categories = root?.categories ?? root?.data?.categories ?? root
  return Array.isArray(categories) ? categories : []
}

function greenlensErrorMessage(data, status, fallback) {
  const msg = String(data?.message || data?.error || "").trim()
  if (status === 401 || status === 403) {
    if (/account not found/i.test(msg)) {
      return "Your account is not linked to Agri Connect yet. Try another agri feature first, or sign in again."
    }
    if (/invalid or expired|invalid access|refresh/i.test(msg)) {
      return "Session expired. Please sign in again and retry diagnosis."
    }
    if (/greenlens|api.?key|not configured/i.test(msg)) {
      return msg
    }
    // Upstream axios-style message from GreenLens provider
    if (/status code 403/i.test(msg)) {
      return "GreenLens rejected this request (403). The provider API key or crop image may be invalid. Please try another photo or contact support."
    }
    return msg || "Access denied for GreenLens. Please sign in again."
  }
  return msg || fallback
}

export async function diagnoseCropDisease(file, knownCropName, { token, refreshToken }) {
  const form = new FormData()
  const filename =
    (file && file.name) ||
    (file && file.type === "image/png" ? "disease.png" : "disease.jpg")
  form.append("disease_image", file, filename)
  form.append("known_crop_name", knownCropName)

  const headers = {
    Accept: "application/json",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (refreshToken) {
    headers["x-refresh-token"] = refreshToken
    headers["X-REFRESH-TOKEN"] = refreshToken
  }
  // Do NOT set Content-Type — browser must set multipart boundary

  const response = await fetch(agriUrl("/api/v1/greenlens/diagnose"), {
    method: "POST",
    headers,
    body: form,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) {
    const err = new Error(
      greenlensErrorMessage(data, response.status, "Diagnosis failed"),
    )
    err.status = response.status
    err.requiresAuth = response.status === 401 || response.status === 403
    throw err
  }

  // RN DiseaseResultScreen uses response.data.data.data
  const nested = data?.data?.data ?? data?.data ?? data
  return nested
}

export function cartLineCount(cart) {
  const items = cart?.items || cart?.lines || cart?.cart_items || []
  if (!Array.isArray(items)) return Number(cart?.item_count || 0) || 0
  return items.reduce((sum, row) => sum + Number(row.quantity || 1), 0)
}

export function cartItems(cart) {
  const items = cart?.items || cart?.lines || cart?.cart_items || []
  return Array.isArray(items) ? items : []
}

export function formatInr(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return "—"
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

const SOIL_DRAFT_KEY = "setu_agri_soil_draft"

export function loadSoilDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(SOIL_DRAFT_KEY) || "{}")
  } catch {
    return {}
  }
}

export function saveSoilDraft(partial) {
  const next = { ...loadSoilDraft(), ...partial }
  sessionStorage.setItem(SOIL_DRAFT_KEY, JSON.stringify(next))
  return next
}

export function clearSoilDraft() {
  sessionStorage.removeItem(SOIL_DRAFT_KEY)
}

/** Soil fee display (RN PaymentScreen defaults). */
export const SOIL_SERVICE_AMOUNT = 499
export const SOIL_SERVICE_CHARGES = 0

export function computeSoilTotal(base = SOIL_SERVICE_AMOUNT) {
  const platformFee = Math.round(base * 0.02 * 100) / 100
  const total = Math.round((base + SOIL_SERVICE_CHARGES + platformFee) * 100) / 100
  return { base, platformFee, total }
}
