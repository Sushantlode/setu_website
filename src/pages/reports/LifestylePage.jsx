import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getLifestyleFields, getLifestyleHistory } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

export default function LifestylePage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fields, setFields] = useState([])
  const [history, setHistory] = useState(null)

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const [fieldDefs, hist] = await Promise.all([
        getLifestyleFields(),
        getLifestyleHistory(session.user_id, {
          token: session.token,
          refreshToken: session.refreshToken,
        }),
      ])
      setFields(fieldDefs)
      setHistory(hist)
    } catch (err) {
      setError(err?.message || "Failed to load lifestyle history")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const rows = (() => {
    if (!history) return []
    if (fields.length) {
      return fields
        .map((f) => {
          const key = f.field_key || f.key
          const label = f.label_en || f.label || key
          const value = history[key]
          if (value == null || String(value).trim() === "") return null
          return { label, value: String(value) }
        })
        .filter(Boolean)
    }
    return Object.entries(history)
      .filter(([k]) => !["id", "userId", "createdAt", "updatedAt"].includes(k))
      .map(([k, v]) => ({ label: k, value: String(v ?? "") }))
      .filter((r) => r.value.trim() !== "")
  })()

  return (
    <ReportsShell title="Lifestyle" subtitle="Habits & wellness">
      {loading ? (
        <ReportListSkeleton />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <ReportsEmpty
          title="No lifestyle data yet"
          subtitle="Update lifestyle details in the SETU mobile app to see them here."
        />
      ) : (
        <dl className="divide-y divide-[#E6EEF5] overflow-hidden rounded-2xl border border-[#E6EEF5] bg-white shadow-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <dt className="text-sm text-[#6C7A8C]">{row.label}</dt>
              <dd className="text-sm font-medium text-[#0E1C2F] sm:text-right">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </ReportsShell>
  )
}
