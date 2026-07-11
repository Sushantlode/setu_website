import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getMedicationsForUser } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

export default function MedicationsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [prescriptions, setPrescriptions] = useState([])

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const data = await getMedicationsForUser(session.user_id, {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setPrescriptions(data.prescriptions || [])
    } catch (err) {
      setError(err?.message || "Failed to load medications")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <ReportsShell title="Medications" subtitle="Prescriptions">
      {loading ? (
        <ReportListSkeleton />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : prescriptions.length === 0 ? (
        <ReportsEmpty
          title="No medications yet"
          subtitle="Prescriptions from closed telemedicine visits will appear here."
          actionTo="/app/telemedicine/home"
          actionLabel="Book consultation"
        />
      ) : (
        <ul className="space-y-3">
          {prescriptions.map((item, i) => {
            const inv = item?.ipInvItemId || {}
            const name = inv.itemName || item.medicineName || "Medicine"
            const strength = inv.itemStrength || ""
            return (
              <li
                key={item.id ?? `${name}-${i}`}
                className="rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm"
              >
                <p className="font-semibold text-[#0E1C2F]">
                  {name}
                  {strength ? (
                    <span className="font-normal text-[#6C7A8C]">
                      {" "}
                      · {strength}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-[#6C7A8C]">
                  {[
                    item.ipQuantity != null ? `Qty: ${item.ipQuantity}` : null,
                    item.duration || null,
                    item.remark || null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Prescribed medicine"}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </ReportsShell>
  )
}
