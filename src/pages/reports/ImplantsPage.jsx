import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { formatReportDate, getBiomedicalImplants } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

export default function ImplantsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const list = await getBiomedicalImplants(session.user_id, {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setItems(list)
    } catch (err) {
      setError(err?.message || "Failed to load implants")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ReportsShell title="Biomedical implants" subtitle="Health records">
      {loading ? (
        <ReportListSkeleton />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <ReportsEmpty
          title="No implants recorded"
          subtitle="Add implant details in the SETU mobile app to see them here."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li
              key={item.id ?? i}
              className="rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-[#0E1C2F]">
                {item.implantName || "Implant"}
              </p>
              <p className="mt-1 text-sm text-[#6C7A8C]">
                {item.dateOfImplant
                  ? formatReportDate(item.dateOfImplant)
                  : "Date not set"}
              </p>
              {item.reasonForImplant ? (
                <p className="mt-2 text-sm text-[#0E1C2F]">
                  {item.reasonForImplant}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </ReportsShell>
  )
}
