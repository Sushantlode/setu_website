/**
 * Mental Health APIs — mirrors setuReactNative mental health module.
 * MENTAL_BASE = /mental/api
 * v1 assessments = /mental/api/v1/*
 * bookings/slots = /mental/api/*
 * Solh proxy = /mental/api/mental-health/selfassessment/*
 */
import { CLOUDFRONT_BASE, mentalUrl } from "../config/api"
import { refreshAuthTokens } from "./auth"
import { authFetch, authHeaders } from "./http"

export const MENTAL_ACCENT = "#0F766E"
export const MENTAL_ASSETS = `${CLOUDFRONT_BASE}/Mental_health/global/public`

export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_Rgl75wP2oROCnL"

const BAND_COLOR_MAP = {
  red: "#EF4444",
  green: "#10B981",
  blue: "#3B82F6",
  orange: "#F97316",
  yellow: "#EAB308",
}

export function resolveBandDisplayColor(color) {
  if (!color) return "#6366F1"
  const raw = String(color).trim()
  const key = raw.toLowerCase()
  if (BAND_COLOR_MAP[key]) return BAND_COLOR_MAP[key]
  if (raw.startsWith("#")) return raw
  return "#6366F1"
}

function pickTruthy(source, ...keys) {
  if (!source || typeof source !== "object") return undefined
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value
    }
  }
  return undefined
}

function normalizeNextSteps(raw) {
  const steps = raw?.nextSteps ?? raw?.next_steps
  if (!Array.isArray(steps)) return []
  return steps.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
}

export function normalizeSubmissionRecord(raw) {
  if (!raw || typeof raw !== "object") return null

  const assessmentSource =
    typeof raw.assessment === "object" && raw.assessment !== null ? raw.assessment : {}
  const bandSource = typeof raw.band === "object" && raw.band !== null ? raw.band : {}
  const subjectSource =
    typeof raw.subject === "object" && raw.subject !== null ? raw.subject : {}

  const assessmentId =
    pickTruthy(raw, "assessmentId", "assessment_id") ??
    pickTruthy(assessmentSource, "id", "assessmentId")

  const assessmentTitle =
    pickTruthy(assessmentSource, "title", "name") ??
    pickTruthy(raw, "assessmentTitle", "title")

  const bandLabel =
    pickTruthy(raw, "bandLabel", "band_label") ??
    pickTruthy(bandSource, "label", "name")

  const bandColorRaw =
    pickTruthy(raw, "bandColor", "band_color") ?? pickTruthy(bandSource, "color")
  const bandColor = bandColorRaw ? resolveBandDisplayColor(bandColorRaw) : undefined

  const bandRecommendation =
    pickTruthy(raw, "bandRecommendation") ?? pickTruthy(bandSource, "recommendation")

  const totalScoreRaw = pickTruthy(raw, "totalScore", "total_score", "score")
  const totalScore =
    totalScoreRaw !== undefined && !Number.isNaN(Number(totalScoreRaw))
      ? Number(totalScoreRaw)
      : undefined

  return {
    ...raw,
    id: pickTruthy(raw, "id", "submissionId", "submission_id") ?? raw.id,
    createdAt: pickTruthy(raw, "createdAt", "created_at", "submittedAt"),
    totalScore,
    bandLabel,
    bandColor,
    bandRecommendation,
    assessmentId: assessmentId ?? assessmentSource.id,
    assessment: {
      ...assessmentSource,
      id: assessmentId ?? assessmentSource.id,
      title: assessmentTitle ?? assessmentSource.title,
      scoreBands:
        assessmentSource.scoreBands ??
        assessmentSource.score_bands ??
        raw.scoreBands ??
        [],
    },
    subject: {
      ...subjectSource,
      type: pickTruthy(subjectSource, "type") ?? pickTruthy(raw, "subjectType") ?? "self",
      name: pickTruthy(subjectSource, "name") ?? pickTruthy(raw, "subjectName"),
      relation: pickTruthy(subjectSource, "relation") ?? pickTruthy(raw, "subjectRelation"),
    },
    keyInsight: pickTruthy(raw, "keyInsight", "key_insight"),
    nextSteps: normalizeNextSteps(raw),
    band:
      bandLabel || bandColor || bandRecommendation
        ? {
            label: bandLabel,
            color: bandColor,
            recommendation: bandRecommendation,
          }
        : undefined,
  }
}

function normalizeSubmissionsPayload(payload) {
  let list = []
  if (Array.isArray(payload)) list = payload
  else if (Array.isArray(payload?.submissions)) list = payload.submissions
  else if (Array.isArray(payload?.data)) list = payload.data
  else if (Array.isArray(payload?.data?.submissions)) list = payload.data.submissions
  return list.map(normalizeSubmissionRecord).filter(Boolean)
}

function authOpts(session) {
  return {
    token: session?.token,
    refreshToken: session?.refreshToken,
  }
}

function isAuthTokenError(message, status) {
  if (status !== 401 && status !== 403) return false
  const msg = String(message || "").toLowerCase()
  return (
    msg.includes("token") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("session")
  )
}

/**
 * Mental protected calls: try with access token first; on 401/403 refresh via
 * Auth (/auth/refreshToken) and retry once. Do not send refresh to Mental —
 * its REFRESH_SECRET often differs and returns "Invalid refresh token".
 */
async function mentalAuthRequest(path, session, init = {}) {
  if (!session?.token) {
    throw new Error("Please sign in again.")
  }

  const run = (token) =>
    authFetch(mentalUrl(path), {
      ...init,
      token,
    })

  let currentToken = session.token
  let { response, data } = await run(currentToken)

  // Proactively refresh if JWT is near expiry and first call failed auth
  if (!response.ok && isAuthTokenError(data?.message, response.status)) {
    try {
      const tokens = await refreshAuthTokens(session.refreshToken)
      currentToken = tokens.token
      ;({ response, data } = await run(currentToken))
    } catch (refreshErr) {
      throw new Error(
        refreshErr?.message || data?.message || "Session expired. Please sign in again.",
      )
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Mental health request failed")
  }
  return data?.data ?? data
}

async function mentalGet(path, session) {
  return mentalAuthRequest(path, session)
}

async function mentalMutate(method, path, body, session) {
  return mentalAuthRequest(path, session, {
    method,
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

function buildQuery(params = {}) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")
  return q ? `?${q}` : ""
}

/** GET /mental/api/v1/assessments */
export async function fetchAssessments() {
  const { response, data } = await authFetch(mentalUrl("/v1/assessments"))
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to load assessments")
  }
  const list = data?.data
  return Array.isArray(list) ? list : []
}

/** GET /mental/api/v1/assessments/:id */
export async function fetchAssessmentById(id) {
  const { response, data } = await authFetch(mentalUrl(`/v1/assessments/${id}`))
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to load assessment")
  }
  return data?.data
}

/** POST /mental/api/v1/assessments/:id/submit */
export async function submitAssessment(assessmentId, answers, subject, session) {
  const data = await mentalMutate(
    "POST",
    `/v1/assessments/${assessmentId}/submit`,
    { answers, subject },
    session,
  )
  return (
    normalizeSubmissionRecord({
      ...data,
      id: data?.submissionId ?? data?.id,
    }) ?? data
  )
}

/** GET /mental/api/v1/submissions (fallback: /v1/assessments/submissions) */
export async function fetchSubmissions(session, createdAt) {
  const qs = createdAt ? `?createdAt=${encodeURIComponent(createdAt)}` : ""
  try {
    const data = await mentalGet(`/v1/submissions${qs}`, session)
    return normalizeSubmissionsPayload(data)
  } catch (err) {
    const msg = String(err?.message || "")
    if (/route not found/i.test(msg)) {
      const data = await mentalGet(`/v1/assessments/submissions${qs}`, session)
      return normalizeSubmissionsPayload(data)
    }
    throw err
  }
}

export async function getTimeSlots(params = {}) {
  const qs = buildQuery(params)
  const { response, data } = await authFetch(mentalUrl(`/time-slots${qs}`))
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to load time slots")
  }
  return data?.data || []
}

export async function createBooking(payload, session) {
  return mentalMutate("POST", "/bookings", payload, session)
}

export async function getMyBookings(session) {
  const userId = session?.user_id
  if (!userId) throw new Error("User ID missing")
  return mentalGet(`/bookings/my-bookings?userId=${encodeURIComponent(userId)}`, session)
}

export async function cancelMyBooking(id, reason, session) {
  return mentalMutate("PATCH", `/bookings/${id}/cancel`, reason ? { reason } : {}, session)
}

export async function deleteMyBooking(id, session) {
  return mentalMutate("DELETE", `/bookings/${id}/self`, null, session)
}

export async function getAddresses(session) {
  const data = await mentalGet("/v1/addresses", session)
  return Array.isArray(data) ? data : []
}

export async function createAddress(body, session) {
  return mentalMutate("POST", "/v1/addresses", body, session)
}

export async function deleteAddress(addressId, session) {
  return mentalMutate("DELETE", `/v1/addresses/${addressId}`, null, session)
}

function solhHeaders(session, extra = {}) {
  const bearer = String(session?.token || "").replace(/^Bearer\s+/i, "")
  return authHeaders(session?.token, session?.refreshToken, {
    ...(bearer ? { "access-token": bearer } : {}),
    ...extra,
  })
}

async function solhFetch(path, session, init = {}) {
  const response = await fetch(mentalUrl(`/mental-health/selfassessment/${path}`), {
    ...init,
    headers: {
      ...solhHeaders(session, init.headers),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Self-assessment request failed")
  }
  return data
}

export async function fetchSolhCategories(session) {
  return solhFetch("categories", session)
}

export async function fetchSolhList(categoryId, session) {
  return solhFetch(`list?categoryId=${encodeURIComponent(categoryId)}`, session)
}

export async function fetchSolhDetails(selfassessmentId, session) {
  return solhFetch(
    `details?selfassessmentId=${encodeURIComponent(selfassessmentId)}`,
    session,
  )
}

export async function submitSolhAssessment(selfassessmentId, payload, session) {
  return solhFetch(`submit?selfassessmentId=${encodeURIComponent(selfassessmentId)}`, session, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export async function fetchSolhTaken(session) {
  return solhFetch("taken", session)
}

export async function fetchSolhResult(selfassessmentId, id, session) {
  return solhFetch(
    `result?selfassessmentId=${encodeURIComponent(selfassessmentId)}&id=${encodeURIComponent(id)}`,
    session,
  )
}

/** Register B2B client for face scan */
export async function registerFaceScanUser(session) {
  const { response, data } = await authFetch(
    mentalUrl("/mental-health/b2b/client-users/register"),
    {
      method: "POST",
      ...authOpts(session),
      body: JSON.stringify({ usertoken: session?.token }),
    },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Face-scan registration failed")
  }
  return data?.data ?? data
}

export async function analyzeFaceScanBlob(blob, session) {
  const form = new FormData()
  form.append("file", blob, "facescan.jpg")
  const headers = {}
  if (session?.token) headers.Authorization = `Bearer ${session.token}`
  if (session?.refreshToken) {
    headers["x-refresh-token"] = session.refreshToken
    headers["X-REFRESH-TOKEN"] = session.refreshToken
  }
  const response = await fetch(mentalUrl("/mental-health/streffie/analyze"), {
    method: "POST",
    headers,
    body: form,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.message || "Face scan failed")
  }
  return data?.data ?? data
}

export function mentalAsset(fileName) {
  return `${MENTAL_ASSETS}/${fileName}`
}

export function sortQuestions(assessment) {
  const questions = Array.isArray(assessment?.questions) ? [...assessment.questions] : []
  return questions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function sortOptions(options) {
  const list = Array.isArray(options) ? [...options] : []
  return list.sort((a, b) => (Number(a.value) ?? 0) - (Number(b.value) ?? 0))
}

export const DEVICE_FEES = {
  deviceFee: 10,
  visitFee: 10,
  taxPercent: 18,
  platformFee: 0,
}

export function computeDeviceTotal({
  deviceFee = DEVICE_FEES.deviceFee,
  visitFee = DEVICE_FEES.visitFee,
  taxPercent = DEVICE_FEES.taxPercent,
  platformFee = DEVICE_FEES.platformFee,
} = {}) {
  const taxAmount = Math.round(((deviceFee + visitFee) * taxPercent) / 100)
  const subtotal = deviceFee + visitFee + taxAmount
  const total = Math.round((subtotal + platformFee) * 100) / 100
  return { deviceFee, visitFee, taxAmount, taxPercent, platformFee, subtotal, total }
}
