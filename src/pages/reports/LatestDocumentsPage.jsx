import { useCallback, useEffect, useState } from "react"
import { Printer } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  fetchCompleteMedicalReportSections,
  getLatestDocumentsUiConfig,
} from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

export default function LatestDocumentsPage() {
  const { session } = useAuth()
  const [uiLoading, setUiLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uiConfig, setUiConfig] = useState(null)
  const [sections, setSections] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const config = await getLatestDocumentsUiConfig()
        if (!cancelled) setUiConfig(config)
      } finally {
        if (!cancelled) setUiLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const generate = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    setError("")
    try {
      const data = await fetchCompleteMedicalReportSections(session.user_id, {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setSections(data.sections)
      setTotalRecords(data.totalRecords)
    } catch (err) {
      setError(err?.message || "Failed to generate complete report")
      setSections(null)
    } finally {
      setLoading(false)
    }
  }, [session])

  const onPrint = () => {
    window.print()
  }

  return (
    <ReportsShell
      title={uiConfig?.headerTitle || "Latest reports"}
      subtitle={uiConfig?.headerSubtitle || "Complete medical history"}
    >
      {uiLoading ? (
        <ReportListSkeleton count={2} />
      ) : (
        <>
          <div className="mb-5 rounded-2xl border border-[#E6EEF5] bg-white p-5 shadow-sm print:hidden">
            <p className="text-lg font-semibold text-[#0E1C2F]">
              {uiConfig?.cardTitle || "Complete Medical Report"}
            </p>
            <p className="mt-2 text-sm text-[#6C7A8C]">
              {uiConfig?.cardSubtitle ||
                "View a comprehensive summary of allergies, vitals, lifestyle, immunizations, implants, and medications."}
            </p>
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="mt-4 inline-flex rounded-full bg-[#1E9BFF] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {loading
                ? "Generating…"
                : uiConfig?.buttonText || "View complete report"}
            </button>
          </div>

          {error ? <ReportsError message={error} onRetry={generate} /> : null}

          {loading ? <ReportListSkeleton count={4} /> : null}

          {sections && !loading ? (
            sections.every((s) => s.count === 0) ? (
              <ReportsEmpty
                title="No medical records yet"
                subtitle="Add health data in the SETU app, then generate your complete report here."
              />
            ) : (
              <div className="space-y-4" id="complete-medical-report">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                  <p className="text-sm text-[#6C7A8C]">
                    {totalRecords} record{totalRecords === 1 ? "" : "s"} ·{" "}
                    {new Date().toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={onPrint}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D2DEFF] bg-white px-4 py-2 text-sm font-medium text-[#1C39BB] hover:bg-[#EEF3FF]"
                  >
                    <Printer size={16} />
                    Print / Save PDF
                  </button>
                </div>

                <div className="rounded-2xl border border-[#E6EEF5] bg-white p-5 shadow-sm print:border-0 print:shadow-none">
                  <h2 className="font-serif text-2xl text-[#0E1C2F]">
                    Complete Medical Report
                  </h2>
                  <p className="mt-1 text-sm text-[#6C7A8C]">
                    Generated {new Date().toLocaleString()} · User{" "}
                    {session?.user_id}
                  </p>
                  <div className="mt-6 space-y-5">
                    {sections.map((section) => (
                      <section key={section.title}>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1C39BB]">
                          {section.title}
                        </h3>
                        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#0E1C2F]">
                          {section.body}
                        </pre>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : null}
        </>
      )}
    </ReportsShell>
  )
}
