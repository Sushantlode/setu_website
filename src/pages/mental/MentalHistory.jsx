import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { fetchSubmissions, MENTAL_ACCENT, resolveBandDisplayColor } from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { MentalShell } from "./MentalShell"

export default function MentalHistory() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchSubmissions(session)
        if (!cancelled) setItems(list)
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load history")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  return (
    <MentalShell
      title="My tests"
      backTo="/app/mental-health/assessments"
      showHeaderActions
      activeAction="history"
    >
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#E5E7EB]" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
          <p>{error}</p>
          {/token|session|sign in/i.test(error) ? (
            <Link to="/login" className="mt-3 inline-block font-semibold underline">
              Sign in again
            </Link>
          ) : null}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-12 text-center">
          <p className="font-semibold text-[#0F172A]">No submissions yet</p>
          <p className="mt-1 text-sm text-[#6B7280]">Complete a self-check to see results here.</p>
          <Link
            to="/app/mental-health/assessments"
            className="mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: MENTAL_ACCENT }}
          >
            Start assessment
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const color = resolveBandDisplayColor(item.bandColor || item.band?.color)
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0F172A]">
                      {item.assessment?.title || "Assessment"}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {item.bandLabel || item.band?.label || "—"}
                  </span>
                </div>
                {item.totalScore !== undefined && item.totalScore !== null ? (
                  <p className="mt-2 text-sm text-[#4B5563]">Score: {item.totalScore}</p>
                ) : null}
                {item.keyInsight ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[#6B7280]">{item.keyInsight}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </MentalShell>
  )
}
