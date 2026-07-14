/**
 * Resolve dashboard / bottom-tab i18n keys to readable English (mirrors RN t(key)).
 * API often returns keys like `rate_us`, `about_us`, `dashboard.home` instead of labels.
 */

const LABEL_MAP = {
  rate_us: "Rate Us",
  about_us: "About Us",
  logout: "Logout",
  website: "Website",
  help: "Help",
  home: "Home",
  report: "Reports",
  reports: "Reports",
  calender: "Calendar",
  calendar: "Calendar",
  robo: "SetuChat",
  setuchat: "SetuChat",
  dashboardsos: "SOS",
  dashboardSOS: "SOS",
  "dashboard.home": "Home",
  "dashboard.welcome": "Welcome",
  "dashboard.report": "Reports",
  "dashboard.reports": "Reports",
  "navbar.profile": "Profile",
  "navbar.search": "Search",
  "navbar.bell": "Notifications",
  generic_medicine: "Generic Medicine",
  help_support: "Help & Support",
  rate_the_app: "Rate the App",
  language: "Language",
}

const ROUTE_LABELS = [
  { match: (r) => r.includes("dashboard") || r === "home", label: "Home" },
  { match: (r) => r.includes("report"), label: "Reports" },
  { match: (r) => r.includes("about"), label: "About Us" },
  { match: (r) => r.includes("rate") || r.includes("feedback"), label: "Rate Us" },
  { match: (r) => r.includes("schedule") || r.includes("calendar"), label: "Calendar" },
  { match: (r) => r.includes("setuchat") || r.includes("robo"), label: "SetuChat" },
  { match: (r) => r.includes("sos"), label: "SOS" },
]

function labelFromRoute(routeName) {
  const r = String(routeName || "").toLowerCase()
  const hit = ROUTE_LABELS.find((row) => row.match(r))
  return hit?.label || ""
}

/** True when string looks like an i18n key, not display copy. */
function looksLikeI18nKey(text) {
  const s = String(text || "").trim()
  if (!s) return false
  if (/\s/.test(s)) return false
  if (/^[A-Z][a-z]+([A-Z][a-z]+)+$/.test(s)) return false // SetuChat
  return /^[a-z][a-z0-9_.]*$/i.test(s) || s.includes(".") || s.includes("_")
}

function humanizeKey(key) {
  const stripped = String(key).replace(/^dashboard\./, "").replace(/^navbar\./, "")
  if (stripped.toLowerCase() === "setuchat") return "SetuChat"
  return stripped
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

/**
 * @param {string} raw — API `label` field
 * @param {string} [routeName] — API `route_name` fallback
 */
export function resolveAppLabel(raw, routeName) {
  const key = String(raw ?? "").trim()
  if (!key) return labelFromRoute(routeName) || "Menu"

  const lower = key.toLowerCase()
  if (LABEL_MAP[key]) return LABEL_MAP[key]
  if (LABEL_MAP[lower]) return LABEL_MAP[lower]

  if (!looksLikeI18nKey(key)) return key

  const fromRoute = labelFromRoute(routeName)
  if (fromRoute) return fromRoute

  return humanizeKey(key)
}
