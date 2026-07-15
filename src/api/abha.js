/**
 * ABHA / ABDM APIs — mirrors setuReactNative Utils/api/abha.js
 */
import { abhaUrl } from "../config/api"

export const ABHA_PRIMARY = "#2F387E"
export const ABHA_BG = "#F5F6FA"
export const ABHA_SUFFIX =
  import.meta.env.VITE_ABHA_ADDRESS_SUFFIX || "@sbx"
export const ABDM_CM_ID = import.meta.env.VITE_ABDM_CM_ID || "sbx"
export const ABDM_HIU_ID =
  import.meta.env.VITE_ABDM_HIU_ID || "IN2710003460"

const SESSION_KEY = "setu_abha_session"

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function requestMeta() {
  return {
    "REQUEST-ID": uuid(),
    TIMESTAMP: new Date().toISOString(),
  }
}

function withBearer(token) {
  if (!token) return ""
  return String(token).startsWith("Bearer ") ? String(token) : `Bearer ${token}`
}

function stripBearer(token) {
  if (!token) return ""
  const t = String(token).trim()
  return t.startsWith("Bearer ") ? t.slice(7).trim() : t
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

function errMessage(data, fallback) {
  if (!data) return fallback
  if (typeof data === "string") return data
  if (typeof data.error === "string") return data.error
  if (data.error?.message) return data.error.message
  if (data.message) return data.message
  if (data.details?.[0]?.message) return data.details[0].message
  if (typeof data.details === "string") return data.details
  return fallback
}

async function abhaFetch(path, { method = "GET", body, headers, raw } = {}) {
  const response = await fetch(abhaUrl(`/api/v3${path}`), {
    method,
    headers: {
      Accept: "application/json",
      ...(body != null ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (raw) return response

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err = new Error(errMessage(data, `ABHA request failed (${response.status})`))
    err.status = response.status
    err.data = data
    throw err
  }
  return data
}

/* ── Session (localStorage) ── */

export function loadAbhaSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAbhaSession(partial) {
  const prev = loadAbhaSession() || {}
  const next = { ...prev, ...partial, updatedAt: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  return next
}

export function clearAbhaSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getXToken() {
  return loadAbhaSession()?.xToken || ""
}

export function getXAuthToken() {
  return loadAbhaSession()?.xAuthToken || ""
}

export function normalizeAbhaAddress(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase()
  if (!v) return ""
  return v.includes("@") ? v : `${v}${ABHA_SUFFIX}`
}

export function formatAbhaNumber(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  if (digits.length <= 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}-${digits.slice(10)}`
}

export function extractTokens(payload = {}) {
  const tokens = payload.tokens || payload.data?.tokens || {}
  const xToken =
    tokens.token ||
    tokens.xToken ||
    tokens["X-Token"] ||
    payload.token ||
    payload.xToken ||
    ""
  const xAuthToken =
    tokens.accessToken ||
    tokens.authToken ||
    tokens["X-AUTH-TOKEN"] ||
    payload.accessToken ||
    payload.xAuthToken ||
    ""
  const tToken = tokens.tToken || tokens["T-token"] || payload.tToken || ""
  return {
    xToken: stripBearer(xToken),
    xAuthToken: stripBearer(xAuthToken),
    tToken: stripBearer(tToken),
  }
}

/* ── Login ── */

export async function requestLoginOTP(data) {
  return abhaFetch("/login/requestOTP", { method: "POST", body: data })
}

export async function verifyLoginOTP(payload) {
  try {
    const data = await abhaFetch("/login/verifyOTP", {
      method: "POST",
      body: {
        txnId: String(payload?.txnId || "").trim(),
        otp: String(payload?.otp || "").trim(),
        loginType: payload?.loginType,
        loginMethod: payload?.loginMethod,
        yearOfBirth: payload?.yearOfBirth || null,
      },
    })
    if (data?.success) return { success: true, data: data.data }
    if (data?.txnId) return { success: true, data }
    return { success: false, error: errMessage(data, "OTP verification failed") }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function verifyLoginUser(txnId, abhaAddress, tToken, loginType) {
  try {
    const data = await abhaFetch("/login/verifyUser", {
      method: "POST",
      body: {
        txnId: String(txnId || "").trim(),
        abhaAddress: String(abhaAddress || "").trim(),
        loginType,
      },
      headers: {
        ...requestMeta(),
        "T-token": withBearer(tToken),
      },
    })
    if (data?.success) return { success: true, data: data.data || data }
    return {
      success: false,
      error: errMessage(data, "Failed to verify user"),
    }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function requestLoginPassword(requestData) {
  try {
    const data = await abhaFetch("/login/verifyPassword", {
      method: "POST",
      body: { data: requestData },
    })
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

/* ── Enrollment / create ── */

export async function requestABHAOTP({ aadhaar }) {
  return abhaFetch("/requestABHAOTP", {
    method: "POST",
    body: { aadhaar },
  })
}

export async function verifyABHAOTP(body) {
  return abhaFetch("/verifyABHAOTP", { method: "POST", body })
}

export async function requestPHROTP(data) {
  return abhaFetch("/requestPHROTP", { method: "POST", body: data })
}

export async function verifyPHROTP(txnId, otp, loginType, loginMethod) {
  try {
    const data = await abhaFetch("/verifyPHROTP", {
      method: "POST",
      body: {
        txnId: String(txnId || "").trim(),
        otp: String(otp || "").trim(),
        loginType: loginType || "mobile",
        method:
          loginMethod ||
          (loginType === "mobile" ? "mobile-otp" : "abha-otp"),
      },
    })
    if (data?.success) return { success: true, data: data.data }
    if (data?.txnId) return { success: true, data }
    return { success: false, error: errMessage(data, "OTP verification failed") }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function getAbhaAddressSuggestions(txnId) {
  return abhaFetch(`/abhaAddressSuggestion${qs({ txnId })}`)
}

export async function createAbhaAddress(body) {
  return abhaFetch("/createAbhaAddress", { method: "POST", body })
}

export async function checkAbhaAddressExists(abhaAddress) {
  return abhaFetch(`/checkAbhaAddressExists${qs({ abhaAddress })}`)
}

export async function enrolAbhaAddress(payload, transferToken) {
  return abhaFetch("/enrolAbhaAddress", {
    method: "POST",
    body: payload,
    headers: { "X-token": transferToken },
  })
}

export async function initCreateAbhaAddress(payload, transferToken) {
  return abhaFetch("/initCreateAbhaAddress", {
    method: "POST",
    body: payload,
    headers: transferToken ? { "X-token": transferToken } : {},
  })
}

/* ── Profile ── */

export async function getAbhaUserProfile(xToken) {
  try {
    if (!xToken) return { success: false, error: "X-Token is required" }
    const data = await abhaFetch("/phr/app/login/profile", {
      headers: {
        ...requestMeta(),
        "X-Token": withBearer(xToken),
      },
    })
    return { success: true, data: data?.data || data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function getPhrAppLoginProfile(xToken) {
  try {
    if (!xToken) return { success: false, error: "X-Token is required" }
    const data = await abhaFetch("/phr/app/login/profile", {
      headers: {
        ...requestMeta(),
        "X-Token": withBearer(xToken),
      },
    })
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function getUserPHRCard(xToken, xAuthToken) {
  try {
    if (!xToken || !xAuthToken) {
      return { success: false, error: "Missing tokens" }
    }
    const data = await abhaFetch("/phr/app/login/profile/phrCard", {
      headers: {
        ...requestMeta(),
        "X-Token": withBearer(xToken),
        "X-AUTH-TOKEN": withBearer(xAuthToken),
      },
    })
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function getUserQRCode(xToken, xAuthToken) {
  try {
    const data = await abhaFetch("/phr/app/login/profile/qrCode", {
      headers: {
        ...requestMeta(),
        "X-Token": withBearer(xToken),
        ...(xAuthToken ? { "X-AUTH-TOKEN": withBearer(xAuthToken) } : {}),
      },
    })
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function downloadAbhaCard(token) {
  const response = await abhaFetch("/downloadAbhaCard", {
    headers: { "X-Token": withBearer(token) },
    raw: true,
  })
  if (!response.ok) {
    throw new Error("Failed to download ABHA card")
  }
  return response.blob()
}

export async function logoutAbhaUser(xToken, xAuthToken) {
  try {
    if (!xToken || !xAuthToken) {
      return { success: false, error: "Tokens required" }
    }
    const data = await abhaFetch("/phr/app/login/profile/request/logout", {
      headers: {
        ...requestMeta(),
        "X-Token": withBearer(xToken),
        "X-AUTH-TOKEN": withBearer(xAuthToken),
      },
    })
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

/* ── Consents & facilities ── */

export async function getAllConsentRequests(
  authToken,
  limit = 20,
  offset = 0,
  status = "ALL",
) {
  try {
    const clean = stripBearer(authToken)
    if (!clean) return { success: false, error: "Auth token required", data: {} }
    const data = await abhaFetch(
      `/consent/requests${qs({ limit, offset, status })}`,
      {
        headers: {
          ...requestMeta(),
          "X-CM-ID": ABDM_CM_ID,
          "X-AUTH-TOKEN": clean,
        },
      },
    )
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message, data: {} }
  }
}

export async function approveConsentRequest(consentRequestId, authToken, body = {}) {
  const clean = stripBearer(authToken)
  return abhaFetch(`/consent/request/${encodeURIComponent(consentRequestId)}/approve`, {
    method: "POST",
    body,
    headers: {
      ...requestMeta(),
      "X-CM-ID": ABDM_CM_ID,
      "X-AUTH-TOKEN": clean,
    },
  })
}

export async function denyConsentRequest(
  consentRequestId,
  reason = "Not authorized",
  authToken,
) {
  const clean = stripBearer(authToken)
  return abhaFetch(`/consent/request/${encodeURIComponent(consentRequestId)}/deny`, {
    method: "POST",
    body: { reason },
    headers: {
      ...requestMeta(),
      "X-CM-ID": ABDM_CM_ID,
      "X-AUTH-TOKEN": clean,
    },
  })
}

export async function getLinkedRecords(authToken, limit = 100) {
  try {
    const clean = stripBearer(authToken)
    if (!clean) return { success: false, error: "Auth token required", data: null }
    const data = await abhaFetch(`/links${qs({ limit })}`, {
      headers: {
        ...requestMeta(),
        "X-CM-ID": ABDM_CM_ID,
        "X-AUTH-TOKEN": clean,
      },
    })
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e.message, data: null }
  }
}

export async function searchFacilities(searchQuery) {
  if (!searchQuery) return []
  const data = await abhaFetch(
    `/providers${qs({ name: searchQuery, stateCode: -1, districtCode: -1 })}`,
  )
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

export async function initiateDiscovery(body, xAuthToken, hiuId = ABDM_HIU_ID) {
  return abhaFetch("/discover", {
    method: "POST",
    body,
    headers: {
      ...requestMeta(),
      "X-AUTH-TOKEN": withBearer(xAuthToken),
      "X-HIU-ID": hiuId,
      "X-CM-ID": ABDM_CM_ID,
    },
  })
}

export async function getDiscoveryStatus(txnId, xToken) {
  return abhaFetch(`/discover/status${qs({ transactionId: txnId })}`, {
    headers: {
      ...requestMeta(),
      "X-Token": withBearer(xToken),
    },
  })
}

export async function buildProfileFromResponses(
  abhaProfileResponse,
  phrProfileResponse,
  fallback = {},
) {
  const profileData = {
    ...(abhaProfileResponse?.data || {}),
    ...(phrProfileResponse?.data || {}),
  }
  return {
    abhaAddress: profileData.abhaAddress || fallback.abhaAddress || "",
    abhaNumber: profileData.abhaNumber || fallback.abhaNumber || "",
    fullName:
      profileData.fullName ||
      profileData.name ||
      fallback.fullName ||
      fallback.abhaAddress ||
      "",
    firstName: profileData.firstName || "",
    middleName: profileData.middleName || "",
    lastName: profileData.lastName || "",
    mobile: profileData.mobile || "",
    gender: profileData.gender || "",
    yearOfBirth: profileData.yearOfBirth || "",
    stateName: profileData.stateName || "",
    districtName: profileData.districtName || "",
    kycStatus: profileData.kycStatus || fallback.kycStatus || "",
    status: profileData.status || "ACTIVE",
    profilePhoto: profileData.profilePhoto || "",
    age: profileData.age || 0,
  }
}
