import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Download, Eye, Filter, X } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  formatReportDate,
  getPreventiveLabReports,
  isUsableReportUrl,
} from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

const TIME_RANGE_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
]

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const endOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)

function getDateRangeForFilter(label) {
  const now = new Date()
  switch (label) {
    case "Today":
      return { start: startOfDay(now), end: endOfDay(now) }
    case "Yesterday": {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) }
    }
    case "Last 7 Days": {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      return { start: startOfDay(start), end: endOfDay(now) }
    }
    case "Last 30 Days": {
      const start = new Date(now)
      start.setDate(start.getDate() - 29)
      return { start: startOfDay(start), end: endOfDay(now) }
    }
    case "This Month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: endOfDay(now),
      }
    case "Last Month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      }
    default:
      return null
  }
}

function reportMatchesDateRange(item, range) {
  if (!range) return true
  const raw = item?.booking_date || item?.created_at
  if (!raw) return false
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return false
  if (range.start && date < range.start) return false
  if (range.end && date > range.end) return false
  return true
}

export default function LabReportsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reports, setReports] = useState([])
  const [timeFilter, setTimeFilter] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)

  const load = useCallback(async () => {
    if (!session?.token) return
    setLoading(true)
    setError("")
    try {
      const list = await getPreventiveLabReports({
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setReports(list)
    } catch (err) {
      setError(err?.message || "Failed to load lab reports")
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    if (!timeFilter) return reports
    const range = getDateRangeForFilter(timeFilter)
    return reports.filter((item) => reportMatchesDateRange(item, range))
  }, [reports, timeFilter])

  const openDownload = (item) => {
    const url = String(item?.report_url ?? "").trim()
    if (!isUsableReportUrl(url)) return
    const a = document.createElement("a")
    a.href = url
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    a.download = `report_${item.booking_id || Date.now()}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <ReportsShell
      title="Lab reports"
      subtitle="View reports"
      backTo="/app/reports/view-reports"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#6C7A8C]">
          {filtered.length} report{filtered.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm text-[#0E1C2F]"
        >
          <Filter size={14} />
          Filter
        </button>
      </div>

      {timeFilter ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D1D5DB] bg-white px-3 py-1 text-sm text-[#0E1C2F]">
            {timeFilter}
            <button
              type="button"
              aria-label="Clear filter"
              onClick={() => setTimeFilter("")}
            >
              <X size={14} className="text-[#6C7A8C]" />
            </button>
          </span>
        </div>
      ) : null}

      {filterOpen ? (
        <div className="mb-4 rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[#0E1C2F]">Time range</p>
          <div className="flex flex-wrap gap-2">
            {TIME_RANGE_OPTIONS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setTimeFilter(label)
                  setFilterOpen(false)
                }}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  timeFilter === label
                    ? "border-[#1C39BB] bg-[#EEF3FF] text-[#1C39BB]"
                    : "border-[#D1D5DB] text-[#0E1C2F]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? (
        <ReportListSkeleton />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <ReportsEmpty
          title="No lab reports"
          subtitle="Book a test to receive digital lab reports here."
          actionTo="/app/book-tests"
          actionLabel="Book a test"
        />
      ) : (
        <ul className="divide-y divide-[#E5E7EB] overflow-hidden rounded-2xl border border-[#E6EEF5] bg-white shadow-sm">
          {filtered.map((item) => {
            const id = item.booking_id || item.id
            const canView = isUsableReportUrl(item.report_url)
            return (
              <li
                key={String(id)}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#111827]">
                    {item.patient_name || "Patient"}
                  </p>
                  <p className="text-sm text-[#6B7280]">
                    {formatReportDate(item.booking_date || item.created_at)}
                    {item.booking_id ? ` · ${item.booking_id}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {canView ? (
                    <Link
                      to={`/app/reports/lab-reports/${encodeURIComponent(id)}`}
                      state={{ report: item }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D2DEFF] text-[#1C39BB] hover:bg-[#EEF3FF]"
                      aria-label="View report"
                    >
                      <Eye size={18} />
                    </Link>
                  ) : (
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#D1D5DB]"
                      title="Report not ready"
                    >
                      <Eye size={18} />
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!canView}
                    onClick={() => openDownload(item)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D2DEFF] text-[#1C39BB] hover:bg-[#EEF3FF] disabled:border-[#E5E7EB] disabled:text-[#D1D5DB]"
                    aria-label="Download report"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ReportsShell>
  )
}
