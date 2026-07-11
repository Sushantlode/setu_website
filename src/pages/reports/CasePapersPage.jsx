import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { formatReportDate, getCasePapersForUser } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

export default function CasePapersPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const list = await getCasePapersForUser(session.user_id, {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setItems(list)
    } catch (err) {
      setError(err?.message || "Failed to load case papers")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ReportsShell title="Case paper" subtitle="Clinical notes">
      {loading ? (
        <ReportListSkeleton />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <ReportsEmpty
          title="No case papers yet"
          subtitle="Closed telemedicine visits will appear here with clinical notes."
          actionTo="/app/telemedicine/home"
          actionLabel="Book consultation"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const visitId = item.visitNo || item.appointmentId
            return (
              <li key={String(item.id)}>
                <Link
                  to={`/app/reports/case-paper/${encodeURIComponent(visitId)}`}
                  state={{ preview: item }}
                  className="flex items-center gap-3 rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm transition hover:border-[#1E9BFF]/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0E1C2F]">
                      {item.doctor}
                    </p>
                    <p className="text-sm text-[#6C7A8C]">
                      {item.issue}
                      {item.visitDate
                        ? ` · ${formatReportDate(item.visitDate)}`
                        : ""}
                    </p>
                    {item.visitedOn ? (
                      <p className="mt-0.5 text-xs text-[#6C7A8C]">
                        Slot: {item.visitedOn}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight size={18} className="text-[#6C7A8C]" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </ReportsShell>
  )
}
