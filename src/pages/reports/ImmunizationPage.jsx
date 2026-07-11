import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { formatReportDate, getImmunizations } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

export default function ImmunizationPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("confirmed")
  const [pending, setPending] = useState([])
  const [confirmed, setConfirmed] = useState([])

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const [p, c] = await Promise.all([
        getImmunizations(session.user_id, "pending", {
          token: session.token,
          refreshToken: session.refreshToken,
        }),
        getImmunizations(session.user_id, "confirmed", {
          token: session.token,
          refreshToken: session.refreshToken,
        }),
      ])
      setPending(p)
      setConfirmed(c)
    } catch (err) {
      setError(err?.message || "Failed to load immunizations")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const list = tab === "pending" ? pending : confirmed

  return (
    <ReportsShell title="Immunization" subtitle="Vaccination history">
      <div className="mb-4 flex gap-2 rounded-full border border-[#E6EEF5] bg-white p-1">
        {[
          { id: "confirmed", label: "Confirmed" },
          { id: "pending", label: "Pending" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-[#1C39BB] text-white"
                : "text-[#6C7A8C] hover:text-[#0E1C2F]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ReportListSkeleton />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : list.length === 0 ? (
        <ReportsEmpty
          title={`No ${tab} immunizations`}
          subtitle="Vaccination records from the SETU app will show up here."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((item, i) => {
            const name =
              item.vaccineName ||
              item.vaccine?.name ||
              item.name ||
              "Vaccine"
            const date = item.dateOfVaccination || item.scheduledDate
            return (
              <li
                key={item.id ?? `${name}-${i}`}
                className="rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm"
              >
                <p className="font-semibold text-[#0E1C2F]">{name}</p>
                <p className="mt-1 text-sm text-[#6C7A8C]">
                  {date ? formatReportDate(date) : "Date not set"}
                  {item.status ? ` · ${item.status}` : ""}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </ReportsShell>
  )
}
