/**
 * Government Schemes APIs — mirrors setuReactNative GovernmentSchemes screens.
 */
import { schemesUrl } from "../config/api"
import { authFetch } from "./http"

const PRIMARY = "#1F4B99"

export const SCHEMES_PRIMARY = PRIMARY

export const DEFAULT_CATEGORIES = [
  { id: "1", name: "Agriculture,Rural & Environment" },
  { id: "2", name: "Public Safety,Law & Justice" },
  { id: "3", name: "Banking,Financial Services and Insurance" },
  { id: "4", name: "Business & Entrepreneurship" },
  { id: "5", name: "Education & Learning" },
  { id: "6", name: "Health & Wellness" },
  { id: "7", name: "Housing & Shelter" },
  { id: "8", name: "Science, IT & Communications" },
  { id: "9", name: "Skills & Employment" },
  { id: "10", name: "Social welfare & Empowerment" },
  { id: "11", name: "Sports & Culture" },
  { id: "12", name: "Transport & Infrastructure" },
  { id: "13", name: "Travel & Tourism" },
  { id: "14", name: "Utility & Sanitation" },
  { id: "15", name: "Women and Child" },
]

export const STATE_NAME_TO_CODE = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CG",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OD",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TS",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UK",
  "West Bengal": "WB",
  "Andaman & Nicobar": "AN",
  Chandigarh: "CH",
  "Dadra & Nagar Haveli and Daman & Diu": "DN",
  Delhi: "DL",
  "Jammu & Kashmir": "JK",
  Ladakh: "LA",
  Lakshadweep: "LD",
  Puducherry: "PY",
}

export const STATE_NAMES = Object.keys(STATE_NAME_TO_CODE)

export const GENDER_OPTIONS = ["Male", "Female", "Transgender"]
export const MARITAL_OPTIONS = ["Married", "Never Married", "Divorced", "Separated", "Widowed"]
export const RESIDENCE_OPTIONS = ["Urban", "Rural", "Both"]
export const CASTE_OPTIONS = [
  "General",
  "Other Backward Class (OBC)",
  "Particularly Vulnerable Tribal Group (PVTG)",
  "Scheduled Caste (SC)",
  "Scheduled Tribe (ST)",
  "De-Notified, Nomadic, and Semi-Nomadic (DNT) communities",
]
export const YES_NO = ["Yes", "No"]
export const EMPLOYMENT_OPTIONS = [
  "Employed",
  "Self-Employed/ Entrepreneur",
  "Unemployed",
  "Student",
  "Retired",
  "Other",
]
export const OCCUPATIONS = [
  "No",
  "Ex Servicemen",
  "Safai Karamchari",
  "Health Worker",
  "Street Vendor",
  "Unorganized Worker",
  "Artist",
  "Sportsperson",
  "Journalist",
  "Tea and Ex- Tea Garden tribes",
  "Coir Worker",
  "Khadi Artisan",
  "Farmer",
  "Fishermen",
  "Artisans, Spinners & Weavers",
  "Teacher / Faculty",
  "Construction Worker",
  "Organized Worker",
]

const BACKEND_OCCUPATIONS = new Set([
  "Farmer",
  "Construction Worker",
  "Labourer",
  "Artisan",
  "Weaver",
  "Fisherman",
  "Street Vendor",
  "Domestic Worker",
  "Beedi Worker",
  "Driver",
  "Sanitation Worker",
])

const OCCUPATION_APP_TO_API = {
  No: "",
  Farmer: "Farmer",
  "Construction Worker": "Construction Worker",
  Fishermen: "Fisherman",
  Fisherman: "Fisherman",
  "Street Vendor": "Street Vendor",
  "street Vendor": "Street Vendor",
  "Safai Karamchari": "Sanitation Worker",
  "Safai Karmchari": "Sanitation Worker",
  "Artisans, Spinners & Weavers": "Weaver",
  "Khadi Artisan": "Artisan",
  "Khadi Artist": "Artisan",
  Artist: "Artisan",
  "Unorganized Worker": "Labourer",
  "Organized Worker": "Labourer",
  Labourer: "Labourer",
  Artisan: "Artisan",
  Weaver: "Weaver",
  "Domestic Worker": "Domestic Worker",
  "Beedi Worker": "Beedi Worker",
  Driver: "Driver",
  "Sanitation Worker": "Sanitation Worker",
}

const CASTE_APP_TO_API = {
  General: "General",
  "Other Backward Class (OBC)": "Other Backward Class (OBC)",
  "Particularly Vulnerable Tribal Group (PVTG)":
    "Particularly Vulnerable Tribal Group (PVTG)",
  "Scheduled Caste (SC)": "Scheduled Caste (SC)",
  "Scheduled Tribe (ST)": "Scheduled Tribe (ST)",
  "De-Notified, Nomadic, and Semi-Nomadic (DNT) communities":
    "Denotified And Semi-Nomadic Tribes (DNT)",
  "Denotified And Semi-Nomadic Tribes (DNT)":
    "Denotified And Semi-Nomadic Tribes (DNT)",
  DNT: "Denotified And Semi-Nomadic Tribes (DNT)",
  SC: "Scheduled Caste (SC)",
  ST: "Scheduled Tribe (ST)",
  OBC: "Other Backward Class (OBC)",
  PVTG: "Particularly Vulnerable Tribal Group (PVTG)",
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

function normalizeSchemesPayload(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.schemes)) return payload.schemes
  return []
}

function normalizeToList(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim()
        if (item?.parts) {
          return item.parts
            .map((p) => (typeof p === "string" ? p : p?.value || ""))
            .join("")
            .trim()
        }
        if (item?.text) return String(item.text).trim()
        return String(item || "").trim()
      })
      .filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(/\n|•|;/)
      .map((s) => s.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
  }
  return []
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeAgeForApi(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1 || n > 150) return ""
  return n
}

export function normalizeYesNoForApi(value) {
  if (value === "Yes" || value === "No") return value
  return ""
}

export function normalizeOccupationForApi(value) {
  const raw = String(value ?? "").trim()
  if (!raw || raw === "No") return ""
  if (Object.prototype.hasOwnProperty.call(OCCUPATION_APP_TO_API, raw)) {
    return OCCUPATION_APP_TO_API[raw]
  }
  if (BACKEND_OCCUPATIONS.has(raw)) return raw
  return raw
}

export function normalizeCasteForApi(value) {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  if (Object.prototype.hasOwnProperty.call(CASTE_APP_TO_API, raw)) {
    return CASTE_APP_TO_API[raw]
  }
  return raw
}

function capWord(s) {
  if (!s || typeof s !== "string") return ""
  const t = s.trim()
  if (!t) return ""
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

export function buildMyschemeProfileFields(userDetails = {}) {
  const u = userDetails && typeof userDetails === "object" ? userDetails : {}
  return {
    gender: u.gender ?? "",
    age: normalizeAgeForApi(u.age),
    caste: normalizeCasteForApi(u.caste ?? u.category),
    beneficiaryState: u.beneficiaryState ?? u.stateName ?? u.state ?? "",
    residence: capWord(u.residence ?? ""),
    maritalStatus: u.maritalStatus ?? "",
    employmentStatus: u.employmentStatus ?? "",
    occupation: normalizeOccupationForApi(u.occupation),
    isStudent: u.isStudent ?? "",
    minority: u.minority ?? "",
    disability: u.disability ?? "",
    isBpl: u.isBpl ?? "",
    isGovEmployee: normalizeYesNoForApi(u.isGovEmployee),
    isEconomicDistress: normalizeYesNoForApi(
      u.isEconomicDistress ?? u.economicDistress,
    ),
  }
}

export function mapMyschemeSearchHits(hits, lang = "en") {
  const useEng = lang === "en"
  return (hits || []).map((hit) => {
    const f = hit?.fields || {}
    return {
      id: hit.id || Math.random().toString(36).slice(2),
      title: useEng
        ? f.schemeNameEng || f.schemeName || f.schemename || "Untitled Scheme"
        : f.schemeName || f.schemeNameEng || f.schemename || "Untitled Scheme",
      description: useEng
        ? f.briefDescriptionEng || f.briefDescription || f.description || ""
        : f.briefDescription || f.briefDescriptionEng || f.description || "",
      level: f.level || "Unknown",
      tags: [
        ...new Set(
          [f.level, f.beneficiaryState?.[0], f.schemeCategory?.[0]].filter(Boolean),
        ),
      ],
      slug: f.slug || f.slug_ci || f.schemeSlug || null,
    }
  })
}

export function parseMyschemeSearchResponse(response, lang = "en") {
  const responseRoot = response?.data?.data || response?.data || response || {}
  const hitsRoot = responseRoot?.hits || {}
  const totalHits =
    responseRoot?.summary?.total ??
    responseRoot?.total ??
    hitsRoot?.page?.total ??
    hitsRoot?.total ??
    0
  const hits = hitsRoot?.items || []
  const pageData = hitsRoot?.page || {}

  return {
    items: mapMyschemeSearchHits(hits, lang),
    page: pageData,
    total: Number(totalHits) || 0,
  }
}

export function normalizeSavedSearchParams(
  params,
  { lang = "en", from = 0, size = 10, keyword = "", sort = "" } = {},
) {
  const p = params && typeof params === "object" ? params : {}
  const profile = buildMyschemeProfileFields({
    gender: p.gender,
    age: p.age,
    caste: p.caste,
    beneficiaryState: p.beneficiaryState,
    residence: p.residence,
    maritalStatus: p.maritalStatus,
    employmentStatus: p.employmentStatus,
    occupation: p.occupation,
    isStudent: p.isStudent,
    minority: p.minority,
    disability: p.disability,
    isBpl: p.isBpl,
    isGovEmployee: p.isGovEmployee,
    economicDistress: p.isEconomicDistress ?? p.economicDistress,
  })

  return {
    ...profile,
    from,
    size,
    lang: (lang || p.lang) ?? "en",
    keyword: p.keyword ?? keyword ?? "",
    sort: p.sort ?? sort ?? "",
  }
}

async function schemesGet(path, { token, refreshToken, params } = {}) {
  const { response, data } = await authFetch(schemesUrl(`${path}${qs(params)}`), {
    token,
    refreshToken,
  })
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Schemes request failed")
  }
  return data
}

async function schemesMutate(
  method,
  path,
  body,
  { token, refreshToken, params } = {},
) {
  const { response, data } = await authFetch(
    schemesUrl(`${path}${qs(params)}`),
    {
      method,
      token,
      refreshToken,
      body: body != null ? JSON.stringify(body) : undefined,
    },
  )
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Schemes request failed")
  }
  return data
}

/** GET /api/schemes?scheme_type=&limit=&page= */
export async function fetchSchemesList({
  schemeType = "central",
  page = 1,
  limit = 50000,
  token,
  refreshToken,
} = {}) {
  const data = await schemesGet("/api/schemes", {
    token,
    refreshToken,
    params: { scheme_type: schemeType, page, limit },
  })
  return normalizeSchemesPayload(data)
}

/** GET /api/schemes/filter?type=state&state_code= */
export async function fetchStateSchemes({
  stateCode,
  page = 1,
  limit = 20,
  token,
  refreshToken,
} = {}) {
  const data = await schemesGet("/api/schemes/filter", {
    token,
    refreshToken,
    params: {
      type: "state",
      state_code: stateCode,
      page,
      limit,
    },
  })
  const items = normalizeSchemesPayload(data)
  return {
    items,
    total: Number(data?.total ?? items.length) || items.length,
    page: Number(data?.page ?? page) || page,
  }
}

/** Schemes in a central category (sector match, same as RN schemesSlice). */
export async function fetchSchemesBySector(categoryName, auth = {}) {
  const all = await fetchSchemesList({ schemeType: "central", ...auth })
  return all.filter((s) => s.sector === categoryName)
}

/** GET /api/schemes/slug/:slug */
export async function fetchSchemeBySlug(slug, { token, refreshToken, lang } = {}) {
  const data = await schemesGet(`/api/schemes/slug/${encodeURIComponent(slug)}`, {
    token,
    refreshToken,
    params: lang ? { lang } : undefined,
  })
  const s = data?.data || data
  const sNorm = s?.normalized || {}
  const sRaw = s?.raw?.data?.en?.schemeContent || {}

  const benefitsRaw =
    sNorm.benefits ||
    s.benefits ||
    (Array.isArray(sRaw.benefits)
      ? sRaw.benefits
          .flatMap((b) => (b.children || []).map((c) => c.children?.[0]?.text))
          .filter(Boolean)
      : [])

  const applicationRaw =
    sNorm.application_process ||
    s.application_process ||
    (Array.isArray(sRaw.application_process)
      ? sRaw.application_process[0]?.process?.map((p) => p.children?.[0]?.text)
      : [])

  return {
    id: s.id,
    slug: s.slug || slug,
    title: s.title || sNorm.title || "Untitled Scheme",
    description: stripHtml(
      s.description || sNorm.details || "No description available.",
    ),
    details: normalizeToList(
      sNorm.details ||
        s.details ||
        sRaw.detailedDescription_md ||
        sRaw.briefDescription ||
        s.description,
    ).map(stripHtml),
    benefits: normalizeToList(benefitsRaw).map(stripHtml),
    eligibility: normalizeToList(
      sNorm.eligibility ||
        s.eligibility ||
        sRaw.eligibilityCriteria?.eligibilityDescription_md ||
        sRaw.eligibilityDescription,
    ).map(stripHtml),
    application_process: normalizeToList(applicationRaw).map(stripHtml),
    documentsRequired: normalizeToList(
      sNorm.documents_required ||
        s.documents_required ||
        sNorm.documentsRequired ||
        s.documentsRequired,
    ).map(stripHtml),
    state:
      s.state_code ||
      sNorm.extra?.level ||
      sNorm.extra?.state ||
      s.state ||
      "Unknown",
    sector: s.sector || sNorm.sector || sNorm.category || "General",
    scheme_type: s.scheme_type || "central",
    external_id: s.external_id || s.scheme_external_id || s.id || "",
  }
}

/** POST /api/schemes/myscheme/search */
export async function searchMyscheme(body, { token, refreshToken } = {}) {
  const data = await schemesMutate("POST", "/api/schemes/myscheme/search", body, {
    token,
    refreshToken,
  })
  return parseMyschemeSearchResponse(data, body?.lang || "en")
}

/** GET /api/schemes/myscheme/searches */
export async function fetchMyschemeSearches(userId, page = 1, auth = {}) {
  const data = await schemesGet("/api/schemes/myscheme/searches", {
    ...auth,
    params: { user_id: userId, page },
  })
  return data
}

/** POST /api/schemes/myscheme/searches */
export async function saveMyschemeSearch(body, auth = {}) {
  return schemesMutate("POST", "/api/schemes/myscheme/searches", body, auth)
}

/** DELETE /api/schemes/myscheme/searches/:id */
export async function deleteMyschemeSearch(searchId, userId, auth = {}) {
  return schemesMutate(
    "DELETE",
    `/api/schemes/myscheme/searches/${searchId}`,
    null,
    { ...auth, params: { user_id: userId } },
  )
}

/** POST /api/schemes/interests */
export async function submitSchemeInterest(payload, auth = {}) {
  return schemesMutate("POST", "/api/schemes/interests", payload, auth)
}

/** GET /api/schemes/interests/me */
export async function fetchMyInterests(auth = {}) {
  const data = await schemesGet("/api/schemes/interests/me", auth)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.interests)) return data.interests
  return []
}

/** DELETE /api/schemes/interests/:id */
export async function deleteInterest(id, auth = {}) {
  return schemesMutate("DELETE", `/api/schemes/interests/${id}`, null, auth)
}

/** First-word title search (home), same as RN GovernmentSchemesScreen. */
export function filterSchemesByFirstWord(schemes, query) {
  const q = String(query || "")
    .toLowerCase()
    .trim()
  if (!q) return []
  const seen = new Set()
  return schemes.filter((scheme) => {
    const title = String(scheme?.title || "")
      .toLowerCase()
      .trim()
    const firstWord = title.split(/\s+/)[0] || ""
    if (!firstWord.startsWith(q)) return false
    const key = String(
      scheme?.slug ||
        `${scheme?.title}-${scheme?.scheme_type}-${scheme?.state_code || ""}`,
    ).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const WIZARD_KEY = "setu_schemes_find_wizard"

export function loadWizardDraft() {
  try {
    const raw = sessionStorage.getItem(WIZARD_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveWizardDraft(partial) {
  try {
    const prev = loadWizardDraft()
    const next = { ...prev, ...partial }
    sessionStorage.setItem(WIZARD_KEY, JSON.stringify(next))
    return next
  } catch {
    return partial
  }
}

export function clearWizardDraft() {
  try {
    sessionStorage.removeItem(WIZARD_KEY)
  } catch {
    /* ignore */
  }
}

export function wizardDraftToUserDetails(draft = {}) {
  return {
    gender: draft.gender,
    age: draft.age,
    maritalStatus: draft.maritalStatus,
    state: draft.state,
    stateName: draft.state,
    beneficiaryState: draft.state,
    residence: draft.residence,
    caste: draft.caste,
    minority: draft.minority,
    disability: draft.disability,
    isStudent: draft.isStudent,
    employmentStatus: draft.employmentStatus,
    isGovEmployee: draft.isGovEmployee,
    isBpl: draft.isBpl,
    occupation: draft.occupation,
    isEconomicDistress: draft.isEconomicDistress,
  }
}
