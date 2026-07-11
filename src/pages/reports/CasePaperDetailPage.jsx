import { useEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { formatReportDate, getCasePaperDetail } from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#1C39BB]">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Lines({ items, render }) {
  if (!items?.length) {
    return <p className="text-sm text-[#6C7A8C]">Not recorded</p>
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-[#0E1C2F]">
          {render(item, i)}
        </li>
      ))}
    </ul>
  )
}

export default function CasePaperDetailPage() {
  const { id: visitId } = useParams()
  const location = useLocation()
  const preview = location.state?.preview
  const { session } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!visitId || !session?.user_id) return
      setLoading(true)
      setError("")
      try {
        const data = await getCasePaperDetail(visitId, session.user_id, {
          token: session.token,
          refreshToken: session.refreshToken,
        })
        if (!cancelled) setDetail(data)
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load case paper")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [visitId, session])

  const visit = detail?.visitInfo || preview || {}
  const patient = detail?.patient

  return (
    <ReportsShell
      title="Case paper"
      subtitle={visit.doctor || "Visit detail"}
      backTo="/app/reports/case-paper"
    >
      {loading ? (
        <ReportListSkeleton count={4} />
      ) : error ? (
        <ReportsError message={error} />
      ) : !detail ? (
        <ReportsEmpty title="Case paper not found" />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm">
            <p className="font-semibold text-[#0E1C2F]">
              {visit.doctor || "Doctor"}
            </p>
            <p className="mt-1 text-sm text-[#6C7A8C]">
              {visit.issue || "General"}
              {visit.visitDate ? ` · ${formatReportDate(visit.visitDate)}` : ""}
            </p>
            {patient?.patientName || patient?.firstName ? (
              <p className="mt-2 text-sm text-[#0E1C2F]">
                Patient:{" "}
                {patient.patientName ||
                  [patient.firstName, patient.lastName].filter(Boolean).join(" ")}
              </p>
            ) : null}
          </div>

          <Section title="Chief complaints">
            <Lines
              items={detail.chiefComplaint}
              render={(item) =>
                item.chiefComplaint ||
                item.complaint ||
                item.name ||
                JSON.stringify(item)
              }
            />
          </Section>

          <Section title="Symptoms">
            <Lines
              items={detail.symptoms}
              render={(item) =>
                item.symptomName || item.symptom || item.name || "—"
              }
            />
          </Section>

          <Section title="Vitals">
            <Lines
              items={detail.vitals}
              render={(item) => {
                const bp =
                  item.systolic || item.diastolic
                    ? `BP ${item.systolic ?? "—"}/${item.diastolic ?? "—"}`
                    : null
                const parts = [
                  bp,
                  item.pulse != null ? `Pulse ${item.pulse}` : null,
                  item.temperature != null ? `Temp ${item.temperature}` : null,
                  item.spo2 != null ? `SpO₂ ${item.spo2}` : null,
                  item.weight != null ? `Weight ${item.weight}` : null,
                ].filter(Boolean)
                return parts.length ? parts.join(" · ") : "Recorded"
              }}
            />
          </Section>

          <Section title="Diagnosis">
            <Lines
              items={detail.diagnosis}
              render={(item) =>
                item.diagnosisName ||
                item.diagnosis ||
                item.name ||
                item.icdDescription ||
                "—"
              }
            />
          </Section>

          <Section title="Investigations">
            <Lines
              items={detail.investigations}
              render={(item) =>
                item.investigationName ||
                item.testName ||
                item.name ||
                "—"
              }
            />
          </Section>

          <Section title="Prescriptions">
            <Lines
              items={detail.prescriptions}
              render={(item) => {
                const inv = item?.ipInvItemId || {}
                const name = inv.itemName || item.medicineName || "Medicine"
                const strength = inv.itemStrength ? ` ${inv.itemStrength}` : ""
                return `${name}${strength}`
              }}
            />
          </Section>
        </div>
      )}
    </ReportsShell>
  )
}
