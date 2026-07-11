/** Telemedicine list / doctor helpers (ported from RN telemedicine utils). */

import { CLOUDFRONT_BASE } from "../config/api"

/**
 * RN FindDoctors CANONICAL_SPECIALITIES — API name fragments → home display labels.
 * Icons resolve via iconKey / SPECIALITY_ICON_NAME (CDN files use display/icon names).
 */
export const CANONICAL_SPECIALITIES = {
  "General Physician (MBBS)": ["FAMILY PHYSICIAN", "Family Physician", "General Practitioner"],
  Gynecologist: ["Gynaecologist", "Obstetrics & Gynaecology"],
  Pediatrician: ["Pediatrician"],
  Dermatologist: ["Dermatologist"],
  Psychiatrist: ["Psychiatrist"],
  Psychologist: ["Psychologist"],
  Dietician: ["Diabetologist", "Dietician", "Nutritionist"],
  Cardiologist: ["Cardiologist", "Cardiology", "Cardio"],
  Orthopedic: ["Orthopedics and Sports Injuries", "Orthopedic"],
  Dentist: ["Dentist", "Dental Surgeon", "Dental"],
  Gastroenterologist: ["General Surgeon"],
  Neurologist: ["Neurologist"],
}

/** Display / API label → tele_icon asset basename (before space→underscore). */
const SPECIALITY_ICON_NAME = {
  // RN FindDoctors SPECIALITY_ICON_NAME
  Dietician: "Diabetologist",
  Dentist: "ENT Specialist",
  // Raw API labels → CDN filenames that exist
  "Family Physician": "General Physician (MBBS)",
  "FAMILY PHYSICIAN": "General Physician (MBBS)",
  "General Practitioner": "General Physician (MBBS)",
  "General Practitioner PNG": "General Physician (MBBS)",
  "General Physician": "General Physician (MBBS)",
  Gynaecologist: "Gynecologist",
  "Obstetrics & Gynaecology": "Gynecologist",
  Nutritionist: "Diabetologist",
  Diabetologist: "Diabetologist",
  "E.N.T. Surgeon": "ENT Specialist",
  "E.N.T. SURGEON": "ENT Specialist",
  "ENT Specialist": "ENT Specialist",
  "Orthopedics and Sports Injuries": "Orthopedic",
  "General Surgeon": "Gastroenterologist",
}

/**
 * Symptom display / API name → CDN tele_icon basename.
 * CDN is case-sensitive (Skin_Rash works; Skin_rash 403). Prefer names that HEAD as 200.
 */
const SYMPTOM_ICON_NAME = {
  // Title-case CDN files
  "Skin rash": "Skin Rash",
  "skin rash": "Skin Rash",
  "Joint pain": "Joint Pain",
  "joint pain": "Joint Pain",
  // Compound API labels → existing tele_icon assets
  "Chills , Cold , Fever": "Fever",
  "Anxiety, Depression": "Anxiety",
  "Mental Stress , Depression": "Depression",
  "Constipation , Diarrhea": "Diarrhea",
  "Headache , Migraine": "Migraine",
  "Hairfall , Acne, Skin Rash": "Acne",
  "Stomach Pain , Gastritis": "Stomach pain",
  "Heart disease": "Heart disease",
  "Stomach pain": "Stomach pain",
}

/** RN SPECIALITY_SYMPTOMS_MAP — curated home symptom chips. */
export const SPECIALITY_SYMPTOMS_MAP = {
  "General Physician (MBBS)": [
    "Fever",
    "Cold",
    "Cough",
    "Body pain",
    "Weakness",
    "Fatigue",
    "Headache",
  ],
  Gynecologist: [
    "Irregular periods",
    "Menstrual pain",
    "Pregnancy issues",
    "PCOS",
    "White discharge",
    "Menopause symptoms",
  ],
  Pediatrician: [
    "Child fever",
    "Vaccination",
    "Child cough",
    "Poor appetite",
    "Growth concerns",
  ],
  Dermatologist: [
    "Acne",
    "Skin rash",
    "Hair fall",
    "Eczema",
    "Psoriasis",
    "Fungal infection",
  ],
  Psychiatrist: [
    "Depression",
    "Anxiety",
    "Bipolar disorder",
    "Sleep disorder",
    "Addiction",
  ],
  Psychologist: [
    "Stress",
    "Anxiety",
    "Behavioral issues",
    "Counselling",
    "Relationship issues",
  ],
  Dietician: [
    "High blood sugar",
    "Low blood sugar",
    "Frequent urination",
    "Excessive thirst",
    "Diabetes management",
  ],
  Cardiologist: [
    "Chest pain",
    "High blood pressure",
    "Heart palpitations",
    "Shortness of breath",
    "Heart disease",
  ],
  Orthopedic: ["Joint pain", "Back pain", "Knee pain", "Fracture", "Arthritis"],
  Dentist: [
    "Tooth pain",
    "Gum bleeding",
    "Tooth decay",
    "Bad breath",
    "Jaw pain",
    "Sensitive teeth",
  ],
  Gastroenterologist: [
    "Stomach pain",
    "Acidity",
    "Constipation",
    "Diarrhea",
    "Indigestion",
  ],
  Neurologist: [
    "Migraine",
    "Seizures",
    "Stroke symptoms",
    "Numbness",
    "Memory loss",
  ],
}

function cloudFrontBase() {
  return String(CLOUDFRONT_BASE || "").replace(/\/$/, "")
}

/** Format name the way RN IconGrid / IconGrid2 does, then encode for the web. */
export function formatTeleIconBasename(name, { stripParens = true } = {}) {
  if (!name) return ""
  let formatted = String(name).trim().replace(/\s+/g, "_")
  if (stripParens) formatted = formatted.replace(/[()]/g, "")
  return formatted
}

/**
 * CloudFront tele_icon URL from a specialty/symptom display name.
 * Matches RN IconGrid / IconGrid2 path: Appointment/global/public/tele_icon/{Name}.png
 */
export function teleIconUrlFromName(name, { stripParens = true } = {}) {
  const formatted = formatTeleIconBasename(name, { stripParens })
  if (!formatted) return ""
  const base = cloudFrontBase()
  // encodeURI keeps underscores; encodes & and other unsafe chars (RN FastImage is looser).
  return `${base}/Appointment/global/public/tele_icon/${encodeURI(formatted)}.png`
}

/** Title-Case each underscore segment — CDN has Skin_Rash / Joint_Pain, not Skin_rash. */
function titleCaseBasename(basename) {
  return String(basename)
    .split("_")
    .map((part) => {
      if (!part) return part
      if (part.length <= 4 && part === part.toUpperCase()) return part
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join("_")
}

function lookupIconAlias(name, map) {
  if (!name) return name
  if (map[name]) return map[name]
  const lower = String(name).toLowerCase()
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === lower) return v
  }
  return name
}

function resolveIconSourceName(item, kind) {
  const displayName =
    item?.iconKey ||
    item?.specialityName ||
    item?.specialtyName ||
    item?.symptomName ||
    item?.name ||
    item?.title ||
    ""

  if (kind === "speciality") {
    return lookupIconAlias(displayName, SPECIALITY_ICON_NAME)
  }
  return lookupIconAlias(displayName, SYMPTOM_ICON_NAME)
}

/**
 * Ordered CDN URL candidates for a specialty/symptom (RN path + casing variants).
 * TeleIcon walks these on onError before Lucide fallback.
 */
export function resolveTeleIconCandidates(item, kind = "speciality") {
  if (!item) return []

  const apiUrl =
    item.iconUrl ||
    item.icon_url ||
    item.imageUrl ||
    item.image_url ||
    (typeof item.icon === "string" && item.icon.startsWith("http") ? item.icon : "") ||
    (typeof item.specialityImage === "string" &&
    item.specialityImage.startsWith("http")
      ? item.specialityImage
      : "") ||
    ""

  if (apiUrl) return [String(apiUrl)]

  const mapped = resolveIconSourceName(item, kind)
  if (!mapped) return []

  const stripParens = kind === "speciality"
  const primary = formatTeleIconBasename(mapped, { stripParens })
  if (!primary) return []

  const basenames = [primary]
  const titled = titleCaseBasename(primary)
  if (titled && titled !== primary) basenames.push(titled)

  // Symptoms: also try without stripping odd punctuation leftovers
  if (kind === "symptom") {
    const loose = formatTeleIconBasename(mapped, { stripParens: false })
    if (loose && !basenames.includes(loose)) basenames.push(loose)
  }

  const base = cloudFrontBase()
  const urls = []
  for (const bn of basenames) {
    urls.push(`${base}/Appointment/global/public/tele_icon/${encodeURI(bn)}.png`)
  }
  return [...new Set(urls)]
}

/**
 * Resolve specialty/symptom icon URL (first candidate).
 * Prefer API-provided image fields; else build CDN path from name (RN parity).
 */
export function resolveTeleIconUrl(item, kind = "speciality") {
  return resolveTeleIconCandidates(item, kind)[0] || ""
}

/**
 * RN FindDoctors normalizeSpecialities — home grid uses canonical labels + iconKey.
 */
export function normalizeTeleSpecialities(apiSpecialities = []) {
  const list = coerceTelemedicineList(apiSpecialities)
  const result = []
  Object.entries(CANONICAL_SPECIALITIES).forEach(([displayName, apiNames]) => {
    const match = list.find((s) =>
      apiNames.some((apiName) =>
        String(s.specialityName || s.specialtyName || s.name || "")
          .toLowerCase()
          .includes(apiName.toLowerCase()),
      ),
    )
    const iconKey = SPECIALITY_ICON_NAME[displayName] ?? displayName
    if (match) {
      result.push({ ...match, specialityName: displayName, iconKey })
    } else {
      result.push({
        specialityId: `virtual-${displayName}`,
        specialityName: displayName,
        iconKey,
        iconUrl: null,
        isVirtual: true,
      })
    }
  })
  return result
}

/**
 * RN FindDoctors normalizeSymptoms — keep curated chips that exist in the API.
 * Also attaches iconKey when SYMPTOM_ICON_NAME has a better CDN basename.
 */
export function normalizeTeleSymptoms(apiSymptoms = [], normalizedSpecialities = []) {
  const symptomsList = coerceTelemedicineList(apiSymptoms)
  const allowed = new Set()
  const specs =
    normalizedSpecialities?.length > 0
      ? normalizedSpecialities
      : Object.keys(SPECIALITY_SYMPTOMS_MAP).map((specialityName) => ({
          specialityName,
        }))
  specs.forEach((spec) => {
    const names = SPECIALITY_SYMPTOMS_MAP[spec.specialityName] || []
    names.forEach((s) => allowed.add(s.toLowerCase()))
  })

  const matched = symptomsList.filter((sym) =>
    allowed.has(String(sym.symptomName || sym.name || "").toLowerCase()),
  )

  // Prefer curated matches; if API has few overlaps, also surface showInSymtoms
  // rows that map to a known CDN icon so the home grid isn't sparse.
  const byId = new Map(matched.map((s) => [s.symptomId ?? s.id, s]))
  const extras = symptomsList.filter((sym) => {
    if (!sym?.showInSymtoms) return false
    const id = sym.symptomId ?? sym.id
    if (byId.has(id)) return false
    const name = sym.symptomName || sym.name || ""
    return Boolean(SYMPTOM_ICON_NAME[name] || lookupIconAlias(name, SYMPTOM_ICON_NAME) !== name)
  })

  return [...matched, ...extras].map((sym) => {
    const name = sym.symptomName || sym.name || ""
    const iconKey = lookupIconAlias(name, SYMPTOM_ICON_NAME)
    return iconKey !== name ? { ...sym, iconKey } : sym
  })
}

export function coerceTelemedicineList(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  if (typeof value === "object") {
    for (const key of ["list", "content", "data", "items", "records"]) {
      if (Array.isArray(value[key])) return value[key]
    }
  }
  return []
}

export function formatDoctorRatingDisplay(raw) {
  if (raw == null || raw === "" || String(raw).toLowerCase() === "null") {
    return null
  }
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return n.toFixed(1)
}

export function normalizeDoctorListItem(raw) {
  if (!raw) return null
  const staff_id = raw.staff_id ?? raw.staffId ?? raw.id ?? null
  const ratingSource = raw.average_rating ?? raw.rating
  const expSource = raw.exp ?? raw.experience

  return {
    ...raw,
    staff_id,
    name: raw.name ?? raw.staffName ?? raw.doctorName ?? raw.displayName ?? "Doctor",
    sname:
      raw.sname ??
      raw.specialityName ??
      raw.specialtyName ??
      raw.staffSpeciality ??
      raw.specialization ??
      "",
    education: raw.education ?? raw.qualification ?? "MBBS",
    city_name: raw.city_name ?? raw.cityName ?? "",
    imageName: raw.imageName ?? raw.image_name ?? raw.profileImage,
    rating: ratingSource,
    average_rating: raw.average_rating ?? raw.rating ?? null,
    exp:
      expSource != null && String(expSource).trim() !== ""
        ? String(expSource).trim()
        : null,
    staffMinDuration: raw.staffMinDuration ?? raw.duration ?? "20",
  }
}

export function parseDoctorsFilterPayload(payload) {
  const root = payload ?? {}
  const data = root?.data ?? root

  const rawList =
    (Array.isArray(data?.list) && data.list) ||
    (Array.isArray(data?.doctors) && data.doctors) ||
    (Array.isArray(data?.content) && data.content) ||
    (Array.isArray(root?.list) && root.list) ||
    []

  const list = rawList.map(normalizeDoctorListItem).filter(Boolean)

  const rawTotal =
    data?.totalRecords ??
    data?.total_records ??
    data?.totalCount ??
    data?.total_count ??
    data?.total ??
    data?.totalElements ??
    data?.recordCount ??
    root?.totalRecords ??
    root?.total

  const totalRecords = Number(rawTotal)
  return {
    list,
    totalRecords: Number.isFinite(totalRecords) && totalRecords >= 0 ? totalRecords : 0,
  }
}

const DOCTOR_IMAGE_BASE = "https://doctor.setuai.com/patientimage"

export function doctorImageUrl(doctor) {
  if (!doctor) return ""
  const photo = doctor.photo || doctor.imageUrl || doctor.image_url
  if (photo && String(photo).startsWith("http")) return String(photo)
  const name = doctor.imageName || doctor.image_name || doctor.profileImage
  if (name) return `${DOCTOR_IMAGE_BASE}/${name}`
  return ""
}

/** Empty filter segment → single space (RN URL pattern). */
export function filterSegment(ids) {
  if (!ids || (Array.isArray(ids) && ids.length === 0)) return " "
  if (Array.isArray(ids)) return ids.join(",")
  const s = String(ids).trim()
  return s || " "
}

export function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function isoToDmy(iso) {
  const [y, m, d] = String(iso || "").split("-")
  if (!y || !m || !d) return ""
  return `${d}-${m}-${y}`
}

export function dmyToIso(dmy) {
  const [d, m, y] = String(dmy || "").split("-")
  if (!y || !m || !d) return ""
  return `${y}-${m}-${d}`
}

export function addDaysIso(iso, days) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return todayIsoFromDate(d)
}

function todayIsoFromDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function formatShortDate(iso) {
  try {
    const d = new Date(`${iso}T12:00:00`)
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  } catch {
    return iso
  }
}

export function slotPeriod(slotStr) {
  const match = String(slotStr || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return "other"
  let hour = Number(match[1])
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hour !== 12) hour += 12
  if (ampm === "AM" && hour === 12) hour = 0
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}

export function isPastSlot(isoDate, timeSlot) {
  if (!isoDate || !timeSlot) return false
  const start = String(timeSlot).split("-")[0]?.trim()
  if (!start) return false
  const match = start.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return false
  let hour = Number(match[1])
  const min = Number(match[2])
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hour !== 12) hour += 12
  if (ampm === "AM" && hour === 12) hour = 0
  const slotDate = new Date(`${isoDate}T00:00:00`)
  slotDate.setHours(hour, min, 0, 0)
  return slotDate.getTime() < Date.now()
}

/** Same Jitsi host the RN MeetingWebView loads. */
export const JITSI_MEET_BASE = "https://meet.setuai.com"

function parseAppointmentSlot(slotStr) {
  if (!slotStr) return null
  const sStr = String(slotStr).replace(/\s+/g, " ").trim()
  const ampm =
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(sStr)
  if (ampm) {
    let [, sh, sm, sap, eh, em, eap] = ampm
    sh = Number(sh)
    sm = Number(sm)
    eh = Number(eh)
    em = Number(em)
    const to24 = (h, ap) => (/am/i.test(ap) ? h % 12 : (h % 12) + 12)
    return { start: { h: to24(sh, sap), m: sm }, end: { h: to24(eh, eap), m: em } }
  }
  const hhmm = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/.exec(sStr)
  if (hhmm) {
    const [, sh, sm, eh, em] = hhmm
    return {
      start: { h: Number(sh), m: Number(sm) },
      end: { h: Number(eh), m: Number(em) },
    }
  }
  return null
}

function buildDateWithTime(dateStr, h, m) {
  try {
    let d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) d = new Date(String(dateStr).replace(/-/g, "/"))
    if (Number.isNaN(d.getTime())) return null
    d.setHours(h, m, 0, 0)
    return d
  } catch {
    return null
  }
}

/** RN MyAppointment deriveTimes — slot start/end Date objects. */
export function deriveAppointmentTimes(appointmentDate, appointmentSlot) {
  const parsed = parseAppointmentSlot(appointmentSlot)
  if (!parsed || !appointmentDate) return { start: null, end: null }
  const start = buildDateWithTime(appointmentDate, parsed.start.h, parsed.start.m)
  const end = buildDateWithTime(appointmentDate, parsed.end.h, parsed.end.m)
  if (
    !start ||
    !end ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return { start: null, end: null }
  }
  return { start, end }
}

/**
 * RN getJoinPhases: Join enabled from 10 min before start through slot end.
 */
export function getJoinPhases(appointmentDate, appointmentSlot) {
  const { start, end } = deriveAppointmentTimes(appointmentDate, appointmentSlot)
  if (!start || !end) return { isPreWindow: false, isDuringSlot: false }
  const startMinus10 = new Date(start.getTime() - 10 * 60 * 1000)
  const now = new Date()
  return {
    isPreWindow: now >= startMinus10 && now < start,
    isDuringSlot: now >= start && now <= end,
  }
}

function isBlankMeetingId(value) {
  if (value == null) return true
  const s = String(value).trim()
  return !s || s === "undefined" || s === "null"
}

/**
 * Resolve the Jitsi URL the RN app opens in MeetingWebView.
 * API enrich builds `https://meet.setuai.com/EHS{meetingId}`.
 */
export function resolveMeetingLink(appt) {
  if (!appt || typeof appt !== "object") return ""

  const raw = appt.meetingLink || appt.meeting_link
  if (typeof raw === "string" && raw.trim()) {
    const link = raw.trim()
    const broken =
      /\/EHS(?:undefined|null)?$/i.test(link) ||
      /\/EHS\s*$/i.test(link)
    if (!broken && /^https?:\/\//i.test(link)) return link
  }

  const meetingId = appt.meetingId ?? appt.meeting_id
  if (!isBlankMeetingId(meetingId)) {
    return `${JITSI_MEET_BASE}/EHS${String(meetingId).trim()}`
  }
  return ""
}

const DOCTOR_CACHE_KEY = "setu_telemedicine_doctor"

export function cacheDoctor(doctor) {
  if (!doctor?.staff_id) return
  try {
    sessionStorage.setItem(DOCTOR_CACHE_KEY, JSON.stringify(doctor))
  } catch {
    /* ignore */
  }
}

export function readCachedDoctor(staffId) {
  try {
    const raw = sessionStorage.getItem(DOCTOR_CACHE_KEY)
    if (!raw) return null
    const doctor = JSON.parse(raw)
    if (staffId && String(doctor?.staff_id) !== String(staffId)) return null
    return doctor
  } catch {
    return null
  }
}
