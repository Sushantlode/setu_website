/**
 * SOS APIs — mirrors setuReactNative SOS screens.
 */
import { resolveStorageImageUrl, sosUrl } from "../config/api"
import { authFetch } from "./http"

const DEFAULT_LANG = "en"

async function sosGet(path, { token, refreshToken } = {}) {
  const { response, data } = await authFetch(sosUrl(path), {
    token,
    refreshToken,
  })
  if (response.ok && data?.success) {
    return data.data
  }
  throw new Error(data?.message || data?.error || "SOS request failed")
}

async function sosMutate(method, path, body, { token, refreshToken } = {}) {
  const { response, data } = await authFetch(sosUrl(path), {
    method,
    token,
    refreshToken,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (response.ok && data?.success !== false) {
    return data.data ?? data
  }
  throw new Error(data?.message || data?.error || "SOS request failed")
}

export const FALLBACK_QUICK_ACTIONS = [
  {
    titleText: "POLICE",
    subtitleText: "Call Police",
    contactNumber: "100",
    iconName: "local-police",
    gradientStartColor: "#718DFF",
    gradientEndColor: "#2144D4",
  },
  {
    titleText: "AMBULANCE",
    subtitleText: "Request Ambulance",
    contactNumber: "108",
    iconName: "ambulance",
    gradientStartColor: "#FF9999",
    gradientEndColor: "#D80E0E",
  },
  {
    titleText: "WOMEN SAFETY",
    subtitleText: "SOS for Women",
    contactNumber: "112",
    iconName: "female",
    gradientStartColor: "#E2B6FC",
    gradientEndColor: "#8C46B5",
  },
]

export const FALLBACK_NEARBY_SERVICES = [
  { titleText: "HOSPITALS", iconName: "hospital-o", searchKeyword: "hospitals" },
  { titleText: "DOCTORS", iconName: "person-search", searchKeyword: "doctors" },
  {
    titleText: "MEDICAL STORES",
    iconName: "medical-services",
    searchKeyword: "pharmacy",
  },
  {
    titleText: "PATHOLOGY LABS",
    iconName: "science",
    searchKeyword: "pathology lab",
  },
  { titleText: "AMBULANCE", iconName: "ambulance", searchKeyword: "ambulance services" },
  {
    titleText: "POLICE STATION",
    iconName: "local-police",
    searchKeyword: "police station",
  },
  {
    titleText: "SECURITY SERVICES",
    iconName: "shield-checkmark-outline",
    searchKeyword: "security services",
  },
]

export const DEFAULT_HELP_BUTTON = {
  buttonText: "HELP",
  buttonColor: "#EA080E",
  buttonSize: 160,
}

function normalizeBottomImage(data) {
  if (!data) return null
  return {
    ...data,
    imageUrl: resolveStorageImageUrl(data.imageUrl || data.image_url),
  }
}

export async function fetchSosQuickActions(lang = DEFAULT_LANG) {
  try {
    const data = await sosGet(`/sos/quick-actions?lang=${lang}`)
    return Array.isArray(data) && data.length ? data : FALLBACK_QUICK_ACTIONS
  } catch {
    return FALLBACK_QUICK_ACTIONS
  }
}

export async function fetchSosHelpButton(lang = DEFAULT_LANG) {
  try {
    const data = await sosGet(`/sos/help-button?lang=${lang}`)
    return { ...DEFAULT_HELP_BUTTON, ...data }
  } catch {
    return DEFAULT_HELP_BUTTON
  }
}

export async function fetchSosNearbyServices(lang = DEFAULT_LANG) {
  try {
    const data = await sosGet(`/sos/nearby-services?lang=${lang}`)
    return Array.isArray(data) && data.length ? data : FALLBACK_NEARBY_SERVICES
  } catch {
    return FALLBACK_NEARBY_SERVICES
  }
}

export async function fetchSosPersonalProfileModule(lang = DEFAULT_LANG) {
  try {
    return await sosGet(`/sos-home/personal-profile?lang=${lang}`)
  } catch {
    return {
      title: "Personal Profile",
      description: "Complete your personal details",
      iconName: "person-outline",
    }
  }
}

export async function fetchSosEmergencyContactsModule(lang = DEFAULT_LANG) {
  try {
    return await sosGet(`/sos-home/emergency-contacts?lang=${lang}`)
  } catch {
    return {
      title: "Emergency Contacts",
      description: "Your registered emergency contacts",
      iconName: "people-outline",
    }
  }
}

export async function fetchSosBottomImage(lang = DEFAULT_LANG) {
  try {
    const data = await sosGet(`/sos/bottom-image?lang=${lang}`)
    return normalizeBottomImage(data)
  } catch {
    return null
  }
}

export async function loadSosHome(lang = DEFAULT_LANG) {
  const [
    quickActions,
    helpButton,
    nearbyServices,
    personalProfileModule,
    emergencyContactsModule,
    bottomImage,
  ] = await Promise.all([
    fetchSosQuickActions(lang),
    fetchSosHelpButton(lang),
    fetchSosNearbyServices(lang),
    fetchSosPersonalProfileModule(lang),
    fetchSosEmergencyContactsModule(lang),
    fetchSosBottomImage(lang),
  ])

  return {
    quickActions,
    helpButton,
    nearbyServices,
    personalProfileModule,
    emergencyContactsModule,
    bottomImage,
  }
}

export async function fetchEmergencyContacts(userId, auth) {
  const data = await sosGet(`/emergency-contacts/user/${userId}`, auth)
  return Array.isArray(data) ? data : []
}

export async function createEmergencyContact(payload, auth) {
  return sosMutate("POST", "/emergency-contacts", payload, auth)
}

export async function updateEmergencyContact(contactId, payload, auth) {
  return sosMutate("PUT", `/emergency-contacts/${contactId}`, payload, auth)
}

export async function deleteEmergencyContact(contactId, auth) {
  return sosMutate("DELETE", `/emergency-contacts/${contactId}`, null, auth)
}

export async function sendSosAlert(body, auth) {
  return sosMutate("POST", "/sos/alert", body, auth)
}

/** Browser geolocation → Google Maps URL (same shape as RN). */
export function buildMapsUrl(latitude, longitude) {
  return `https://maps.google.com/?q=${latitude},${longitude}`
}

export function openMapsSearch(query) {
  const q = encodeURIComponent(String(query || "").trim() || "emergency services near me")
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener,noreferrer")
}

export function buildDoctorMapsQuery(specialty, location) {
  const spec = String(specialty || "").trim()
  const loc = String(location || "").trim()
  if (spec && loc) return `${spec} doctor in ${loc}`
  if (spec) return `${spec} doctor near me`
  if (loc) return `doctor in ${loc}`
  return "doctors near me"
}

export async function getBrowserLocationUrl() {
  if (!navigator?.geolocation) return null

  const getPosition = (options) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options)
    })

  try {
    const position = await getPosition({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5000,
    })
    const { latitude, longitude } = position.coords
    return buildMapsUrl(latitude, longitude)
  } catch {
    try {
      const position = await getPosition({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 15000,
      })
      const { latitude, longitude } = position.coords
      return buildMapsUrl(latitude, longitude)
    } catch {
      return null
    }
  }
}

export function sosUserFromSession(session) {
  if (!session) return { userId: null, userName: "User", userPhone: "" }
  const userId = Number(session.user_id) || null
  const userName =
    [session.first_name, session.username].filter(Boolean).join(" ").trim() ||
    session.username ||
    "User"
  const userPhone = session.mobile ? String(session.mobile) : ""
  return { userId, userName, userPhone }
}
