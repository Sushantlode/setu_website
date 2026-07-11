import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { getReportUiConfig, getUserReports } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

const SHOW_ONLY_LAB_REPORT = true

function isLabReportCategory(key, title) {
  const normKey = String(key || "").toLowerCase()
  const normTitle = String(title || "").toLowerCase()
  return normKey.includes("lab") || normTitle.includes("lab")
}

export default function ViewReportsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uiConfig, setUiConfig] = useState([])
  const [reportData, setReportData] = useState([])

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const [config, reports] = await Promise.all([
        getReportUiConfig({
          token: session.token,
          refreshToken: session.refreshToken,
        }),
        getUserReports(session.user_id, {
          token: session.token,
          refreshToken: session.refreshToken,
        }).catch(() => []),
      ])
      setUiConfig(config)
      setReportData(reports)
    } catch (err) {
      setError(err?.message || "Failed to load report categories")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const cards = useMemo(() => {
    const counts = {}
    uiConfig.forEach((c) => {
      counts[c.key] = 0
    })
    const norm = (v) => String(v || "").toLowerCase()
    reportData.forEach((r) => {
      const t = norm(
        r?.ReportType?.name || r?.reportType || r?.type || r?.category || "",
      )
      uiConfig.forEach((config) => {
        if (
          t.includes(config.key) ||
          t.includes(String(config.title || "").toLowerCase())
        ) {
          counts[config.key] = (counts[config.key] || 0) + 1
        }
      })
    })
    return uiConfig.map((config) => ({
      key: config.key,
      title: config.title,
      count: counts[config.key] || 0,
      icon: config.icon_url,
    }))
  }, [uiConfig, reportData])

  const visible = SHOW_ONLY_LAB_REPORT
    ? cards.filter((c) => isLabReportCategory(c.key, c.title))
    : cards

  return (
    <ReportsShell title="Reports" subtitle="View reports">
      {loading ? (
        <ReportListSkeleton count={3} />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <ReportsEmpty
          title="No report categories"
          subtitle="Lab reports will appear here when available."
          actionTo="/app/book-tests"
          actionLabel="Book a test"
        />
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <Link
              key={c.key}
              to={
                isLabReportCategory(c.key, c.title)
                  ? "/app/reports/lab-reports"
                  : `/app/reports/view-reports/${encodeURIComponent(c.key)}`
              }
              className="flex items-center gap-4 rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm transition hover:border-[#1C39BB]/30"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F0F2FF]">
                {c.icon ? (
                  <img
                    src={c.icon}
                    alt=""
                    className="h-7 w-7 object-contain"
                  />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-[#1A3DBE]">{c.title}</p>
                {c.count > 0 ? (
                  <p className="text-sm text-[#757575]">
                    {c.count} report{c.count === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
              <ChevronRight size={18} className="text-[#6C7A8C]" />
            </Link>
          ))}
        </div>
      )}
    </ReportsShell>
  )
}
