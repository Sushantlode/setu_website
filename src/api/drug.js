/**
 * Drug Directory APIs — mirrors setuReactNative drugDirectory features.
 */
import { drugUrl } from "../config/api"
import { authFetch } from "./http"

export const DRUG_PRIMARY = "#1C39BB"
export const DRUG_ASSETS =
  "https://d10pnqyli54qno.cloudfront.net/DrugDirectory/public/"

export function drugAsset(path) {
  return `${DRUG_ASSETS}${String(path || "").replace(/^\//, "")}`
}

export const POPULAR_DRUGS = [
  { id: "184", name: "Atorvastatin" },
  { id: "108", name: "Amlodipine" },
  { id: "1116", name: "Levothyroxine" },
  { id: "1130", name: "Lisinopril" },
  { id: "1145", name: "Losartan" },
  { id: "1217", name: "Metformin" },
]

export const AZ_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export const CONSUMPTION_OPTIONS = [
  { value: "before_food", label: "Before Food" },
  { value: "after_food", label: "After Food" },
  { value: "with_food", label: "With Food" },
  { value: "empty_stomach", label: "Empty Stomach" },
  { value: "any_time", label: "Any Time" },
]

export const REMINDER_DAY_OPTIONS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
]

const DRUG_DETAIL_FIELD_ORDER = [
  "description",
  "indications",
  "dosage",
  "side_effects",
  "precautions",
  "contraindications",
  "warnings",
]

const DRUG_FIELD_LABELS = {
  description: "Description",
  indications: "Indications",
  dosage: "Dosage",
  side_effects: "Side effects",
  precautions: "Precautions",
  contraindications: "Contraindications",
  warnings: "Warnings",
}

const HIDDEN_DETAIL_KEYS = new Set([
  "source",
  "references_text",
  "full_text",
  "source_url",
  "created_at",
  "id",
  "drug_id",
  "ayurveda_id",
])

function qs(params = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === "") return
    sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ""
}

async function drugGet(path, params) {
  const response = await fetch(drugUrl(`${path}${qs(params)}`), {
    headers: { Accept: "application/json" },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.error || "Drug directory request failed")
  }
  return data
}

function pickPaginated(envelope) {
  const block = envelope?.data
  if (Array.isArray(block?.data)) {
    return {
      items: block.data,
      total: Number(block.total ?? block.data.length) || 0,
      totalPages: Number(block.totalPages ?? 1) || 1,
      currentPage: Number(block.currentPage ?? 1) || 1,
    }
  }
  if (Array.isArray(block)) {
    return { items: block, total: block.length, totalPages: 1, currentPage: 1 }
  }
  if (Array.isArray(envelope)) {
    return {
      items: envelope,
      total: envelope.length,
      totalPages: 1,
      currentPage: 1,
    }
  }
  return { items: [], total: 0, totalPages: 1, currentPage: 1 }
}

export async function fetchDrugsList({ page = 1, limit = 20 } = {}) {
  return pickPaginated(await drugGet("/drug", { page, limit }))
}

export async function searchDrugs({ query = "", page = 1, limit = 20 } = {}) {
  const q = String(query || "").trim()
  return pickPaginated(
    await drugGet("/drug/search", { page, limit, ...(q ? { q } : {}) }),
  )
}

export async function fetchDrugById(id) {
  const data = await drugGet(`/drug/${encodeURIComponent(String(id))}`)
  return data?.data ?? data
}

export async function fetchDrugBySlug(slug) {
  const data = await drugGet(`/drug/slug/${encodeURIComponent(String(slug))}`)
  return data?.data ?? data
}

export async function fetchAyurvedaList({
  page = 1,
  limit = 20,
  alphabet,
} = {}) {
  return pickPaginated(
    await drugGet("/ayurveda", {
      page,
      limit,
      ...(alphabet ? { alphabet } : {}),
    }),
  )
}

export async function searchAyurveda({ query = "", page = 1, limit = 20 } = {}) {
  const q = String(query || "").trim()
  return pickPaginated(
    await drugGet("/ayurveda/search", { page, limit, ...(q ? { q } : {}) }),
  )
}

export async function fetchAyurvedaById(id) {
  const data = await drugGet(`/ayurveda/${encodeURIComponent(String(id))}`)
  return data?.data ?? data
}

export async function fetchAyurvedaBySlug(slug) {
  const data = await drugGet(
    `/ayurveda/slug/${encodeURIComponent(String(slug))}`,
  )
  return data?.data ?? data
}

/** Unified hub search — drugs + ayurveda in parallel (same as DrugInfoHub). */
export async function searchHub(query, { limit = 10 } = {}) {
  const q = String(query || "").trim()
  if (!q) return []
  const [drugs, ayurveda] = await Promise.all([
    searchDrugs({ query: q, page: 1, limit }).catch(() => ({ items: [] })),
    searchAyurveda({ query: q, page: 1, limit }).catch(() => ({ items: [] })),
  ])
  return [
    ...drugs.items.map((item) => ({ ...item, kind: "drug" })),
    ...ayurveda.items.map((item) => ({ ...item, kind: "ayurveda" })),
  ]
}

export function resolveDrugName(item) {
  return (
    item?.generic_name ||
    item?.name ||
    item?.genericName ||
    item?.title ||
    item?.drug_name ||
    "Medicine"
  )
}

export function resolveAyurvedaName(item) {
  return item?.name || item?.title || item?.generic_name || "Ayurvedic medicine"
}

export function pickShortDescription(item) {
  const raw =
    item?.description ||
    item?.indications ||
    item?.short_description ||
    item?.summary ||
    ""
  const text = String(raw).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  if (!text) return ""
  return text.length > 120 ? `${text.slice(0, 120)}…` : text
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim()
}

/** Build ordered detail sections from `details[]` (RN Drugs.js parity). */
export function buildDetailSections(raw) {
  const root = raw?.data && typeof raw.data === "object" ? raw.data : raw
  if (!root) return { title: "Medicine", sections: [] }

  const title = resolveDrugName(root) || resolveAyurvedaName(root)
  const details = Array.isArray(root.details) ? root.details : []

  if (details.length === 0) {
    const sections = []
    for (const field of DRUG_DETAIL_FIELD_ORDER) {
      const text = stripHtml(root[field])
      if (!text) continue
      sections.push({
        key: field,
        label: DRUG_FIELD_LABELS[field] || field,
        text,
      })
    }
    return { title, sections, raw: root }
  }

  const sections = []
  details.forEach((row, idx) => {
    if (!row || typeof row !== "object") return
    let descriptionNorm = ""
    for (const field of DRUG_DETAIL_FIELD_ORDER) {
      if (HIDDEN_DETAIL_KEYS.has(field)) continue
      const text = stripHtml(row[field])
      if (!text) continue
      if (field === "description") descriptionNorm = text
      if (field === "indications" && text === descriptionNorm) continue
      sections.push({
        key: `d${idx}-${field}`,
        label: DRUG_FIELD_LABELS[field] || field.replace(/_/g, " "),
        text,
      })
    }
    Object.keys(row).forEach((field) => {
      if (HIDDEN_DETAIL_KEYS.has(field)) return
      if (DRUG_DETAIL_FIELD_ORDER.includes(field)) return
      const text = stripHtml(row[field])
      if (!text) return
      sections.push({
        key: `d${idx}-${field}`,
        label: field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        text,
      })
    })
  })

  return { title, sections, raw: root }
}

/** Reminders — auth required */
export async function fetchReminders({ token, refreshToken, activeOnly } = {}) {
  const { response, data } = await authFetch(
    drugUrl(`/reminders${qs(activeOnly ? { active_only: true } : {})}`),
    { token, refreshToken },
  )
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to load reminders")
  }
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.data?.data)) return data.data.data
  if (Array.isArray(data)) return data
  return []
}

export async function createReminder(body, { token, refreshToken } = {}) {
  const { response, data } = await authFetch(drugUrl("/reminders"), {
    method: "POST",
    token,
    refreshToken,
    body: JSON.stringify(body),
  })
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to create reminder")
  }
  return data?.data ?? data
}

export async function updateReminder(id, body, { token, refreshToken } = {}) {
  const { response, data } = await authFetch(
    drugUrl(`/reminders/${encodeURIComponent(id)}`),
    {
      method: "PUT",
      token,
      refreshToken,
      body: JSON.stringify(body),
    },
  )
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to update reminder")
  }
  return data?.data ?? data
}

export async function deleteReminder(id, { token, refreshToken } = {}) {
  const { response, data } = await authFetch(
    drugUrl(`/reminders/${encodeURIComponent(id)}`),
    { method: "DELETE", token, refreshToken },
  )
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to delete reminder")
  }
  return data
}

export async function toggleReminder(id, { token, refreshToken } = {}) {
  const { response, data } = await authFetch(
    drugUrl(`/reminders/${encodeURIComponent(id)}/toggle`),
    { method: "PATCH", token, refreshToken },
  )
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || "Failed to toggle reminder")
  }
  return data?.data ?? data
}

const RECENT_KEY = "setu_drug_recent_searches"

export function loadRecentDrugSearches() {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.slice(0, 8) : []
  } catch {
    return []
  }
}

export function addRecentDrugSearch(entry) {
  try {
    const prev = loadRecentDrugSearches().filter(
      (x) => String(x.id) !== String(entry.id),
    )
    const next = [entry, ...prev].slice(0, 8)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    return next
  } catch {
    return [entry]
  }
}

export function clearRecentDrugSearches() {
  try {
    localStorage.removeItem(RECENT_KEY)
  } catch {
    /* ignore */
  }
}
