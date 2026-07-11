import { dashboardUrl, sosUrl } from "../config/api"
import { authHeaders } from "./http"

async function getJson(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeout ?? 8000)
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

/** GET /dashboard/dashboard/bottomapps */
export async function getBottomApps() {
  const t = Date.now()
  const { response, data } = await getJson(
    dashboardUrl(`/dashboard/bottomapps?t=${t}`),
    {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
  )
  if (response.ok && data && !data.hasError) {
    return data.data?.bottomApps || []
  }
  throw new Error(data?.message || "Failed to fetch bottom apps")
}

/** GET /dashboard/dashboard/banners */
export async function getDashboardBanners() {
  const { response, data } = await getJson(dashboardUrl("/dashboard/banners"))
  if (response.ok && data?.success) {
    return data.data?.banners || []
  }
  throw new Error(data?.message || "Failed to fetch banners")
}

/** GET /dashboard/dashboard/sliders (slider base already includes /dashboard) */
export async function getDashboardSliders() {
  const { response, data } = await getJson(dashboardUrl("/dashboard/sliders"))
  const raw = data?.data?.sliders || data?.data?.slider
  if (response.ok && data?.success && Array.isArray(raw)) {
    return raw
  }
  throw new Error(data?.message || "Failed to fetch sliders")
}

/** GET /sos/api/v1/sos/nearby-services */
export async function fetchNearbyServices(lang = "en") {
  const { response, data } = await getJson(
    sosUrl(`/sos/nearby-services?lang=${lang}`),
  )
  if (response.ok && data?.success && data?.data) {
    return data.data
  }
  throw new Error(data?.message || "Failed to fetch nearby services")
}

/** Soft-load dashboard extras; never throws */
export async function loadDashboardExtras({ token, refreshToken } = {}) {
  const headers = authHeaders(token, refreshToken)
  const [bottomApps, banners, sliders] = await Promise.all([
    getBottomApps().catch(() => []),
    getDashboardBanners().catch(() => []),
    getDashboardSliders().catch(() => []),
  ])
  return { bottomApps, banners, sliders, headers }
}
