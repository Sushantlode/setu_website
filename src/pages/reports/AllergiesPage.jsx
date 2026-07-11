import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getAllergies } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

function severityClass(raw) {
  const s = String(raw || "").toLowerCase()
  if (s.includes("severe") || s.includes("high")) {
    return "bg-red-100 text-red-700"
  }
  if (s.includes("moderate")) return "bg-orange-100 text-orange-700"
  return "bg-emerald-100 text-emerald-700"
}

export default function AllergiesPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const list = await getAllergies(session.user_id, {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setItems(list)
    } catch (err) {
      setError(err?.message || "Failed to load allergies")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ReportsShell title="Allergies" subtitle="Health records">
      {loading ? (
        <ReportListSkeleton />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <ReportsEmpty
          title="No allergies added yet"
          subtitle="Track allergies in the SETU mobile app to stay safe and informed."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const name =
              item.name ||
              (typeof item.allergen === "string" ? item.allergen : null) ||
              "Allergy"
            return (
              <li
                key={item.id ?? name}
                className="rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#0E1C2F]">{name}</p>
                    {item.category ? (
                      <p className="text-sm text-[#6C7A8C]">{item.category}</p>
                    ) : null}
                  </div>
                  {item.severity ? (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${severityClass(item.severity)}`}
                    >
                      {item.severity}
                    </span>
                  ) : null}
                </div>
                {item.reaction ? (
                  <p className="mt-2 text-sm text-[#6C7A8C]">
                    Reaction:{" "}
                    <span className="text-[#0E1C2F]">{item.reaction}</span>
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </ReportsShell>
  )
}
