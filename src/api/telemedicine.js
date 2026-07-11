import { medUrl, authUrl, apiUrl } from "../config/api"
import { authFetch } from "./http"
import {
  coerceTelemedicineList,
  filterSegment,
  parseDoctorsFilterPayload,
  todayIso,
} from "../utils/telemedicine"

const TELEMEDICINE_TEST_PAYMENT_RUPEES = 1

async function getJson(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 12000)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    })
    const data = await response.json().catch(() => ({}))
    return { response, data }
  } finally {
    clearTimeout(timeout)
  }
}

export async function getDoctorSpecialities() {
  const { response, data } = await getJson(medUrl("/doctors-specialty"))
  if (!response.ok) throw new Error(data?.message || "Failed to load specialities")
  return coerceTelemedicineList(data?.data)
}

export async function getSymptoms() {
  const { response, data } = await getJson(medUrl("/symptoms"))
  if (!response.ok) throw new Error(data?.message || "Failed to load symptoms")
  return coerceTelemedicineList(data?.data?.content ?? data?.data)
}

export async function getFilterOptions() {
  const [specialities, genders, languages, symptoms] = await Promise.all([
    getJson(medUrl("/doctors-specialty")).then(({ data }) =>
      coerceTelemedicineList(data?.data),
    ),
    getJson(medUrl("/gender")).then(({ data }) => coerceTelemedicineList(data?.data)),
    getJson(medUrl("/languages")).then(({ data }) =>
      coerceTelemedicineList(data?.data).filter((lang) => {
        const name = String(lang?.name || lang?.languageName || "").toLowerCase()
        return name !== "french" && name !== "arabic"
      }),
    ),
    getJson(medUrl("/symptoms")).then(({ data }) =>
      coerceTelemedicineList(data?.data?.content ?? data?.data),
    ),
  ])
  return { specialities, genders, languages, symptoms }
}

export async function getTelemedicineBanners() {
  const { response, data } = await getJson(medUrl("/telemedicine/banners"))
  if (!response.ok) return []
  return coerceTelemedicineList(data?.data?.banners ?? data?.data ?? data?.banners)
}

/**
 * POST /doctors/filter/{date}/{speciality}/{gender}/{lang}/{symptom}/{staff}/{page}/{limit}
 */
export async function filterDoctors({
  date = todayIso(),
  specialityIds = [],
  genderIds = [],
  langIds = [],
  symptomsId = [],
  staffId = [],
  page = 1,
  limit = 10,
  staffName = "",
  cityId = null,
  location = "",
} = {}) {
  const path = [
    "/doctors/filter",
    encodeURIComponent(date),
    encodeURIComponent(filterSegment(specialityIds)),
    encodeURIComponent(filterSegment(genderIds)),
    encodeURIComponent(filterSegment(langIds)),
    encodeURIComponent(filterSegment(symptomsId)),
    encodeURIComponent(filterSegment(staffId)),
    page,
    limit,
  ].join("/")

  const body = {
    staffName: staffName || "",
    location: location || "",
    staffIds: Array.isArray(staffId) ? staffId : [],
  }
  if (staffName) {
    body.name = staffName
    body.staff_name = staffName
  }
  if (cityId != null && cityId !== "") {
    body.city_id = cityId
  }

  const { response, data } = await getJson(medUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    timeout: 15000,
  })

  if (!response.ok && response.status >= 500) {
    throw new Error(data?.message || "Failed to load doctors")
  }

  return parseDoctorsFilterPayload(data)
}

export async function searchDoctorsTypeahead(query, limit = 20) {
  return filterDoctors({
    staffName: query,
    page: 1,
    limit,
  })
}

export async function getDoctorSlots({ staffId, dur = "20", currAppDate, dayOfWeek }) {
  const body = {
    staffId,
    dur: String(dur || "20"),
    dayOfWeek:
      dayOfWeek != null
        ? dayOfWeek
        : new Date(`${currAppDate}T12:00:00`).getDay(),
    currAppDate,
  }
  const { response, data } = await getJson(medUrl("/doctors/slots"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load slots")
  }
  const content = coerceTelemedicineList(data?.data?.content ?? data?.data ?? data?.content)
  return content
}

export async function fetchAmountBreakdown(amount = TELEMEDICINE_TEST_PAYMENT_RUPEES) {
  const url = apiUrl(`/amount-breakdown?amount=${encodeURIComponent(amount)}&unit=rupees`)
  const { response, data } = await getJson(url)
  if (!response.ok) {
    return {
      amount_payable: amount,
      platform_fee: 0,
      total_amount: amount,
      total_amount_paise: Math.round(Number(amount) * 100),
      fee_percentage: 0,
    }
  }
  return data?.data ?? data
}

export async function createPaymentOrder({ amountPaise, token, refreshToken }) {
  const { response, data } = await authFetch(authUrl("/createOrder"), {
    method: "POST",
    token,
    refreshToken,
    body: JSON.stringify({ amount: amountPaise, currency: "INR" }),
  })
  if (!response.ok) return null
  const orderId =
    data?.data?.id ||
    data?.data?.order_id ||
    data?.id ||
    data?.order_id ||
    data?.orderId ||
    null
  return orderId ? String(orderId) : null
}

export async function verifyPayment({ userId, paymentId, token, refreshToken }) {
  const { response, data } = await authFetch(apiUrl("/pay/verifyPayment"), {
    method: "POST",
    token,
    refreshToken,
    body: JSON.stringify({
      user_id: String(userId),
      payment_id: String(paymentId),
    }),
  })
  const ok =
    response.ok &&
    (data?.success === true ||
      data?.data?.success === true ||
      (data?.data && typeof data.data === "object" && data.data.success === true))
  return { ok, data }
}

export async function createAppointment(body, { token, refreshToken }) {
  const { response, data } = await authFetch(medUrl("/appointment"), {
    method: "POST",
    token,
    refreshToken,
    body: JSON.stringify(body),
  })
  return { response, data }
}

export async function saveTelemedAppointment(body, { token, refreshToken }) {
  const { response, data } = await authFetch(medUrl("/telemedappointment"), {
    method: "POST",
    token,
    refreshToken,
    body: JSON.stringify(body),
  })
  return { response, data }
}

export async function getUserAppointments({
  userId,
  token,
  refreshToken,
  upcomingPage = 1,
  pastPage = 1,
  limit = 10,
  lang = "en",
}) {
  const params = new URLSearchParams({
    userId: String(userId),
    upcomingPage: String(upcomingPage),
    upcomingLimit: String(limit),
    pastPage: String(pastPage),
    pastLimit: String(limit),
    lang,
  })
  const { response, data } = await authFetch(
    medUrl(`/telemedappointment/user?${params}`),
    { method: "GET", token, refreshToken },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load appointments")
  }
  const root = data?.data ?? data
  return {
    upcoming: coerceTelemedicineList(root?.upcoming?.data ?? root?.upcoming),
    past: coerceTelemedicineList(root?.past?.data ?? root?.past),
    totalUpcoming:
      Number(root?.totalUpcomingCount ?? root?.upcoming?.totalCount ?? 0) || 0,
    totalPast: Number(root?.totalPastCount ?? root?.past?.totalCount ?? 0) || 0,
  }
}

export async function cancelAppointment(appointmentId, { token, refreshToken }) {
  const { response, data } = await authFetch(
    medUrl(`/telemedappointment/cancel/${appointmentId}`),
    { method: "PATCH", token, refreshToken },
  )
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Could not cancel appointment")
  }
  return data
}

export { TELEMEDICINE_TEST_PAYMENT_RUPEES }
