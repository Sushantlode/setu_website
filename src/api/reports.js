/**
 * Reports / Health Line APIs — mirrors setuReactNative Reports screens.
 */
import { reportsUrl, preventiveUrl, medUrl } from "../config/api"
import { authHeaders } from "./http"

const CLOUDFRONT_REPORTS =
  "https://d10pnqyli54qno.cloudfront.net/Reports/public/"

export const reportAsset = (path) => `${CLOUDFRONT_REPORTS}${path}`

/** RN tile `route` → website path slug under /app/reports/ */
export const TILE_ROUTE_TO_SLUG = {
  ViewReports: "view-reports",
  VitalSigns: "vital-signs",
  MedicationsList: "medications",
  Allergies: "allergies",
  Immunization: "immunization",
  LifeStyle: "lifestyle",
  CasePaper: "case-paper",
  BiomedicalImplants: "implants",
  LatestDocuments: "latest",
  MedicalDocumentsUpload: "upload",
}

export const FALLBACK_TILES = [
  {
    id: "view-reports",
    route: "ViewReports",
    title: "View Reports",
    subtitle: "Lab & health documents",
    imageUrl: reportAsset("view_reports.png"),
  },
  {
    id: "vital-signs",
    route: "VitalSigns",
    title: "Vital Signs",
    subtitle: "BP, SpO₂, pulse & more",
    imageUrl: reportAsset("vital_signs.png"),
  },
  {
    id: "medications",
    route: "MedicationsList",
    title: "Medications",
    subtitle: "Your medicine list",
    imageUrl: reportAsset("medications.png"),
  },
  {
    id: "allergies",
    route: "Allergies",
    title: "Allergies",
    subtitle: "Track known allergies",
    imageUrl: reportAsset("allergies.png"),
  },
  {
    id: "immunization",
    route: "Immunization",
    title: "Immunization",
    subtitle: "Vaccination history",
    imageUrl: reportAsset("immunization.png"),
  },
  {
    id: "lifestyle",
    route: "LifeStyle",
    title: "Lifestyle",
    subtitle: "Habits & wellness notes",
    imageUrl: reportAsset("lifestyle.png"),
  },
  {
    id: "case-paper",
    route: "CasePaper",
    title: "Case Paper",
    subtitle: "Clinical case notes",
    imageUrl: reportAsset("case_paper.png"),
  },
  {
    id: "implants",
    route: "BiomedicalImplants",
    title: "Implants",
    subtitle: "Biomedical implants",
    imageUrl: reportAsset("implants.png"),
  },
]

export function slugForTileRoute(route) {
  return TILE_ROUTE_TO_SLUG[route] || String(route || "").toLowerCase()
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

async function getJson(url, { token, refreshToken, timeout = 12000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: authHeaders(token, refreshToken),
    })
    const data = await response.json().catch(() => ({}))
    return { response, data }
  } finally {
    clearTimeout(timer)
  }
}

/** Soft-load home config; never throws for individual sections */
export async function loadReportsHome() {
  const [latest, tiles, upload, slides] = await Promise.all([
    getJson(reportsUrl("/reports/home/latest-all-reports"))
      .then(({ response, data }) =>
        response.ok && data?.success ? data.data : null,
      )
      .catch(() => null),
    getJson(reportsUrl("/reports/home/tiles"))
      .then(({ response, data }) =>
        response.ok && data?.success && Array.isArray(data.data)
          ? data.data
          : FALLBACK_TILES,
      )
      .catch(() => FALLBACK_TILES),
    getJson(reportsUrl("/reports/home/upload-documents"))
      .then(({ response, data }) =>
        response.ok && data?.success ? data.data : null,
      )
      .catch(() => null),
    getJson(reportsUrl("/reports/home/lifestyle-slides"))
      .then(({ response, data }) =>
        response.ok && data?.success && Array.isArray(data.data)
          ? data.data
          : [],
      )
      .catch(() => []),
  ])

  return {
    latestBanner: latest,
    tiles: tiles?.length ? tiles : FALLBACK_TILES,
    uploadBanner: upload,
    lifestyleSlides: slides,
  }
}

export async function getLatestDocumentsUiConfig() {
  const { response, data } = await getJson(
    reportsUrl("/ui-config/latest-documents-ui-config"),
  )
  if (response.ok && data?.success && data?.data) return data.data
  return {
    cardTitle: "Complete Medical Report",
    cardSubtitle:
      "Generate a comprehensive summary with all your medical records",
    buttonText: "View complete report",
    headerTitle: "Latest Reports",
    headerSubtitle: "Generate your complete medical history",
  }
}

export async function getReportUiConfig({ token, refreshToken } = {}) {
  const { response, data } = await getJson(reportsUrl("/report-ui-config"), {
    token,
    refreshToken,
  })
  if (!response.ok) throw new Error(data?.message || "Failed to load report categories")
  return extractList(data)
}

export async function getUserReports(userId, { token, refreshToken } = {}) {
  const { response, data } = await getJson(
    reportsUrl(`/reports/user/${encodeURIComponent(userId)}`),
    { token, refreshToken },
  )
  if (!response.ok) throw new Error(data?.message || "Failed to load reports")
  return extractList(data)
}

/** Preventive health lab reports list — RN PreventiveLabReports */
export async function getPreventiveLabReports({ token, refreshToken } = {}) {
  const { response, data } = await getJson(
    preventiveUrl("/api/v1/reports"),
    { token, refreshToken, timeout: 20000 },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load lab reports")
  }
  return extractList(data)
}

export async function getLabReportByBooking(
  bookingId,
  { token, refreshToken } = {},
) {
  const { response, data } = await getJson(
    preventiveUrl(`/api/v1/reports/by-booking/${encodeURIComponent(bookingId)}`),
    { token, refreshToken },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load report")
  }
  return data?.data ?? data
}

export async function getVitalSigns(userId, { token, refreshToken } = {}) {
  const { response, data } = await getJson(
    reportsUrl(`/vital-signs-reports/user/${encodeURIComponent(userId)}`),
    { token, refreshToken },
  )
  if (!response.ok) throw new Error(data?.message || "Failed to load vital signs")
  const list = extractList(data)
  return list[0] || null
}

export async function getAllergies(userId, { token, refreshToken } = {}) {
  const { response, data } = await getJson(
    reportsUrl(`/allergies-reports/user/${encodeURIComponent(userId)}`),
    { token, refreshToken },
  )
  if (!response.ok) throw new Error(data?.message || "Failed to load allergies")
  return extractList(data)
}

export async function getImmunizations(
  userId,
  status,
  { token, refreshToken } = {},
) {
  const q = status ? `?status=${encodeURIComponent(status)}` : ""
  const { response, data } = await getJson(
    reportsUrl(`/immunizations/user/${encodeURIComponent(userId)}${q}`),
    { token, refreshToken },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load immunizations")
  }
  return extractList(data)
}

export async function getBiomedicalImplants(
  userId,
  { token, refreshToken } = {},
) {
  const { response, data } = await getJson(
    reportsUrl(`/biomedical-implants/user/${encodeURIComponent(userId)}`),
    { token, refreshToken },
  )
  if (!response.ok) throw new Error(data?.message || "Failed to load implants")
  return extractList(data)
}

export async function getLifestyleFields() {
  const { response, data } = await getJson(reportsUrl("/lifestyle-fields"))
  if (!response.ok) return []
  return extractList(data)
}

export async function getLifestyleHistory(
  userId,
  { token, refreshToken } = {},
) {
  const { response, data } = await getJson(
    reportsUrl(
      `/lifestyle-history-reports/user/${encodeURIComponent(userId)}`,
    ),
    { token, refreshToken },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load lifestyle history")
  }
  const list = extractList(data)
  return list[0] || null
}

function numericUserId(userId) {
  const cleaned = String(userId ?? "").replace(/[^0-9]/g, "").trim()
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Resolve telemedicine patientUserId from EHS user id */
export async function getPatientByEhsUserId(
  userId,
  { token, refreshToken } = {},
) {
  const id = numericUserId(userId) ?? userId
  const { response, data } = await getJson(
    medUrl(`/setu_beta_ws/mst_patient/patientbyehsuserid/${id}`),
    { token, refreshToken },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Patient record not found")
  }
  return data
}

export async function getClosedAppointments(
  patientUserId,
  { token, refreshToken, page = 1, size = 20 } = {},
) {
  const { response, data } = await getJson(
    medUrl(
      `/telemedappointment/ehs/vccClosedAppoinmentByUserId?userId=${encodeURIComponent(patientUserId)}&page=${page}&size=${size}`,
    ),
    { token, refreshToken },
  )
  if (!response.ok) {
    throw new Error(data?.message || "Failed to load case papers")
  }
  return Array.isArray(data) ? data : extractList(data)
}

export async function getCasePapersForUser(
  userId,
  { token, refreshToken } = {},
) {
  const patient = await getPatientByEhsUserId(userId, { token, refreshToken })
  const patientUserId = patient?.patientUserId?.userId
  if (!patientUserId) return []

  const appointments = await getClosedAppointments(patientUserId, {
    token,
    refreshToken,
  })

  return appointments.map((a, index) => ({
    id: a.meetingId || a.appointmentId || index,
    appointmentId: a.appointmentId,
    visitNo: a.timelineId || a.visitId,
    visitDate: a.appointmentDate,
    issue: a.speciality || a.specility || "General",
    doctor: a.userFullname || a.doctorName || "Doctor",
    visitedOn: a.appointmentSlot,
    doctorImage: a.userProfileImage,
  }))
}

async function safeEmrGet(path, { token, refreshToken } = {}) {
  try {
    const { response, data } = await getJson(medUrl(`/setu_beta_ws${path}`), {
      token,
      refreshToken,
    })
    if (!response.ok) return []
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    return []
  } catch {
    return []
  }
}

export async function getCasePaperDetail(
  visitId,
  userId,
  { token, refreshToken } = {},
) {
  const [
    chiefComplaint,
    symptoms,
    vitals,
    diagnosis,
    investigations,
    prescriptions,
  ] = await Promise.all([
    safeEmrGet(`/temr_visit_chief_complaint/vccListbytimelineid/${visitId}`, {
      token,
      refreshToken,
    }),
    safeEmrGet(`/temr_visit_symptom/vccListbytimelineid/${visitId}`, {
      token,
      refreshToken,
    }),
    safeEmrGet(`/temr_vital/vccListbytimelineid/${visitId}`, {
      token,
      refreshToken,
    }),
    safeEmrGet(`/temr_visit_diagnosis/vccListbytimelineid/${visitId}`, {
      token,
      refreshToken,
    }),
    safeEmrGet(`/temr_visit_investigation/vccInvestigations/${visitId}`, {
      token,
      refreshToken,
    }),
    safeEmrGet(`/temr_visit_prescription/bytimelineid/${visitId}`, {
      token,
      refreshToken,
    }),
  ])

  let patient = null
  let visitInfo = { visitNo: visitId }
  try {
    patient = await getPatientByEhsUserId(userId, { token, refreshToken })
    const patientUserId = patient?.patientUserId?.userId || userId
    const appointments = await getClosedAppointments(patientUserId, {
      token,
      refreshToken,
    })
    const found = appointments.find(
      (a) =>
        String(a.timelineId || a.visitId) === String(visitId) ||
        String(a.appointmentId) === String(visitId),
    )
    if (found) {
      visitInfo = {
        visitNo: found.timelineId ?? found.visitId ?? visitId,
        visitDate: found.appointmentDate,
        issue: found.speciality || found.specility || "General",
        doctor: found.userFullname || found.doctorName || "Doctor",
        visitedOn: found.appointmentSlot,
        doctorImage: found.userProfileImage,
      }
    }
  } catch {
    // preview-only visit info
  }

  return {
    patient,
    visitInfo,
    chiefComplaint,
    symptoms,
    vitals,
    diagnosis,
    investigations,
    prescriptions,
  }
}

/** Medications across recent closed visits */
export async function getMedicationsForUser(
  userId,
  { token, refreshToken } = {},
) {
  const casePapers = await getCasePapersForUser(userId, {
    token,
    refreshToken,
  }).catch(() => [])

  const timelineIds = [
    ...new Set(
      casePapers
        .map((c) => c.visitNo)
        .filter((id) => id != null)
        .map(String),
    ),
  ].slice(0, 10)

  if (!timelineIds.length) return { visits: casePapers, prescriptions: [] }

  const batches = await Promise.all(
    timelineIds.map(async (tid) => {
      const list = await safeEmrGet(
        `/temr_visit_prescription/bytimelineid/${tid}`,
        { token, refreshToken },
      )
      return list.map((p) => ({ ...p, timelineId: tid }))
    }),
  )

  return {
    visits: casePapers,
    prescriptions: batches.flat(),
  }
}

/** Aggregate sections for Latest Documents / complete report view */
export async function fetchCompleteMedicalReportSections(
  userId,
  { token, refreshToken } = {},
) {
  const [
    allergies,
    vitals,
    lifestyleFields,
    lifestyleHistory,
    immunPending,
    immunConfirmed,
    biomedical,
    meds,
  ] = await Promise.all([
    getAllergies(userId, { token, refreshToken }).catch(() => []),
    getVitalSigns(userId, { token, refreshToken }).catch(() => null),
    getLifestyleFields().catch(() => []),
    getLifestyleHistory(userId, { token, refreshToken }).catch(() => null),
    getImmunizations(userId, "pending", { token, refreshToken }).catch(
      () => [],
    ),
    getImmunizations(userId, "confirmed", { token, refreshToken }).catch(
      () => [],
    ),
    getBiomedicalImplants(userId, { token, refreshToken }).catch(() => []),
    getMedicationsForUser(userId, { token, refreshToken }).catch(() => ({
      prescriptions: [],
    })),
  ])

  const sections = [
    {
      title: "Allergies",
      body: formatAllergies(allergies),
      count: allergies.length,
    },
    {
      title: "Vital Signs",
      body: formatVitals(vitals),
      count: vitals ? 1 : 0,
    },
    {
      title: "Lifestyle",
      body: formatLifestyle(lifestyleHistory, lifestyleFields),
      count: lifestyleHistory ? 1 : 0,
    },
    {
      title: "Immunizations",
      body: formatImmunizations(immunPending, immunConfirmed),
      count: immunPending.length + immunConfirmed.length,
    },
    {
      title: "Biomedical Implants",
      body: formatBiomedical(biomedical),
      count: biomedical.length,
    },
    {
      title: "Medications",
      body: formatMedications(meds.prescriptions || []),
      count: (meds.prescriptions || []).length,
    },
  ]

  const totalRecords = sections.reduce((n, s) => n + (s.count || 0), 0)
  return { sections, totalRecords }
}

function formatAllergies(items) {
  if (!items?.length) return "Not recorded"
  return items
    .map(
      (a, i) =>
        `${i + 1}. ${a.name || "—"} (${a.allergen || "—"}) — ${a.severity || "—"}: ${a.reaction || "—"}`,
    )
    .join("\n")
}

function formatVitals(v) {
  if (!v || !Object.keys(v).length) return "Not recorded"
  const parts = []
  if (v.height != null) parts.push(`Height: ${v.height} cm`)
  if (v.weight != null) parts.push(`Weight: ${v.weight} kg`)
  if (v.bmi != null) parts.push(`BMI: ${v.bmi}`)
  if (v.temperature != null) parts.push(`Temperature: ${v.temperature}°`)
  if (v.bloodPressureSystolic != null || v.bloodPressureDiastolic != null) {
    parts.push(
      `BP: ${v.bloodPressureSystolic ?? "—"}/${v.bloodPressureDiastolic ?? "—"} mmHg`,
    )
  }
  if (v.pulse != null) parts.push(`Pulse: ${v.pulse} bpm`)
  if (v.respiration != null) parts.push(`Respiration: ${v.respiration}/min`)
  if (v.oxygenSaturation != null) parts.push(`SpO₂: ${v.oxygenSaturation}%`)
  return parts.length ? parts.join(" · ") : "Not recorded"
}

function formatLifestyle(history, fields) {
  if (!history || !Object.keys(history).length) return "Not recorded"
  const defs = Array.isArray(fields) ? fields : []
  const lines = defs.length
    ? defs
        .map((f) => {
          const key = f.field_key || f.key
          const label = f.label_en || f.label || key || "Field"
          const val = history[key]
          return val != null && String(val).trim() !== ""
            ? `${label}: ${val}`
            : null
        })
        .filter(Boolean)
    : Object.entries(history)
        .filter(
          ([k]) => !["id", "userId", "createdAt", "updatedAt"].includes(k),
        )
        .map(([k, val]) => `${k}: ${val}`)
  return lines.length ? lines.join("\n") : "Not recorded"
}

function formatImmunizations(pending, confirmed) {
  const all = [...(pending || []), ...(confirmed || [])]
  if (!all.length) return "Not recorded"
  return all
    .map((item, i) => {
      const name =
        item.vaccineName || item.vaccine?.name || item.name || "Vaccine"
      const date = item.dateOfVaccination || item.scheduledDate || "—"
      const status = item.status || "—"
      return `${i + 1}. ${name} — ${date} (${status})`
    })
    .join("\n")
}

function formatBiomedical(items) {
  if (!items?.length) return "Not recorded"
  return items
    .map(
      (b, i) =>
        `${i + 1}. ${b.implantName || "—"} (${b.dateOfImplant || "—"}) — ${b.reasonForImplant || "—"}`,
    )
    .join("\n")
}

function formatMedications(prescriptions) {
  if (!prescriptions?.length) return "Not recorded"
  return prescriptions
    .map((p, i) => {
      const inv = p?.ipInvItemId || {}
      const name = inv.itemName || p.medicineName || "Medicine"
      const strength = inv.itemStrength ? ` ${inv.itemStrength}` : ""
      const qty = p.ipQuantity != null ? `, Qty: ${p.ipQuantity}` : ""
      return `${i + 1}. ${name}${strength}${qty}`
    })
    .join("\n")
}

export function isUsableReportUrl(value) {
  return /^https?:\/\/.+/i.test(String(value ?? "").trim())
}

export function formatReportDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
