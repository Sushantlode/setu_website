import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { getVitalSigns } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#E6EEF5] bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-semibold text-[#0E1C2F]">{value ?? "—"}</p>
      <p className="mt-1 text-xs text-[#6C7A8C]">{label}</p>
    </div>
  )
}

export default function VitalSignsPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [vitals, setVitals] = useState(null)

  const load = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const data = await getVitalSigns(session.user_id, {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setVitals(data)
    } catch (err) {
      setError(err?.message || "Failed to load vital signs")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  const hasData =
    vitals &&
    (vitals.height ||
      vitals.weight ||
      vitals.bmi ||
      vitals.temperature ||
      vitals.bloodPressureSystolic ||
      vitals.pulse ||
      vitals.respiration ||
      vitals.oxygenSaturation)

  return (
    <ReportsShell title="Vital signs" subtitle="Health metrics">
      {loading ? (
        <ReportListSkeleton count={3} />
      ) : error ? (
        <ReportsError message={error} onRetry={load} />
      ) : !hasData ? (
        <ReportsEmpty
          title="No vital signs yet"
          subtitle="Add vitals in the SETU mobile app to see them here."
        />
      ) : (
        <div className="space-y-5">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[#0E1C2F]">
              Vital metrics
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Height (cm)" value={vitals.height ?? "—"} />
              <MetricCard label="Weight (kg)" value={vitals.weight ?? "—"} />
              <MetricCard label="BMI" value={vitals.bmi ?? "—"} />
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[#0E1C2F]">Vitals</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard
                label="Temperature"
                value={
                  vitals.temperature != null ? `${vitals.temperature}°` : "—"
                }
              />
              <MetricCard
                label="Blood pressure"
                value={`${vitals.bloodPressureSystolic ?? "—"}/${vitals.bloodPressureDiastolic ?? "—"}`}
              />
              <MetricCard label="Pulse (bpm)" value={vitals.pulse ?? "—"} />
              <MetricCard
                label="Respiration"
                value={vitals.respiration ?? "—"}
              />
              <MetricCard
                label="SpO₂ (%)"
                value={vitals.oxygenSaturation ?? "—"}
              />
              {vitals.bloodGlucose != null ? (
                <MetricCard label="Blood glucose" value={vitals.bloodGlucose} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </ReportsShell>
  )
}
