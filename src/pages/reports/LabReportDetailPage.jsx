import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { Download, ExternalLink } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  getLabReportByBooking,
  isUsableReportUrl,
} from "../../api/reports"
import { ReportListSkeleton } from "../../components/AppSkeleton"
import { ReportsEmpty, ReportsError, ReportsShell } from "./ReportsShell"

export default function LabReportDetailPage() {
  const { id: bookingId } = useParams()
  const location = useLocation()
  const { session } = useAuth()
  const preset = location.state?.report

  const [loading, setLoading] = useState(!preset?.report_url)
  const [error, setError] = useState("")
  const [reportUrl, setReportUrl] = useState(
    () => String(preset?.report_url || "").trim() || "",
  )
  const [meta, setMeta] = useState(preset || null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!bookingId || !session?.token) return
      const initial = String(preset?.report_url || "").trim()
      if (isUsableReportUrl(initial)) {
        setReportUrl(initial)
        setLoading(false)
      } else {
        setLoading(true)
      }
      try {
        const data = await getLabReportByBooking(bookingId, {
          token: session.token,
          refreshToken: session.refreshToken,
        })
        if (cancelled) return
        const fresh = String(data?.report_url ?? "").trim()
        if (isUsableReportUrl(fresh)) setReportUrl(fresh)
        setMeta((prev) => ({ ...prev, ...data }))
        if (!isUsableReportUrl(fresh) && !isUsableReportUrl(initial)) {
          setError("Report PDF is not available yet")
        }
      } catch (err) {
        if (cancelled) return
        if (!isUsableReportUrl(initial)) {
          setError(err?.message || "Could not load report")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookingId, session, preset?.report_url])

  const usable = isUsableReportUrl(reportUrl)

  return (
    <ReportsShell
      title="Lab report"
      subtitle={meta?.patient_name || meta?.booking_id || bookingId}
      backTo="/app/reports/lab-reports"
      maxWidth="max-w-5xl lg:max-w-6xl"
    >
      {loading ? (
        <ReportListSkeleton count={2} />
      ) : error && !usable ? (
        <ReportsError message={error} />
      ) : !usable ? (
        <ReportsEmpty
          title="Report not ready"
          subtitle="This booking does not have a downloadable PDF yet."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#1C39BB] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
            >
              <ExternalLink size={16} />
              Open in new tab
            </a>
            <a
              href={reportUrl}
              download={`report_${bookingId}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#D2DEFF] bg-white px-4 py-2 text-sm font-medium text-[#1C39BB] hover:bg-[#EEF3FF]"
            >
              <Download size={16} />
              Download
            </a>
            <Link
              to="/app/reports/lab-reports"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm text-[#6C7A8C] hover:text-[#0E1C2F]"
            >
              Back to list
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E6EEF5] bg-white shadow-sm">
            <iframe
              title="Lab report PDF"
              src={reportUrl}
              className="h-[min(80vh,900px)] w-full bg-[#F8F9FB]"
            />
          </div>
        </div>
      )}
    </ReportsShell>
  )
}
