import { Link } from "react-router-dom"
import { Smartphone, Upload } from "lucide-react"
import { ReportsShell } from "./ReportsShell"

export default function UploadDocumentsPage() {
  return (
    <ReportsShell title="Upload documents" subtitle="Medical documents">
      <div className="rounded-2xl border border-[#E6EEF5] bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF7FF] text-[#1E9BFF]">
          <Upload size={26} />
        </span>
        <h2 className="text-xl font-semibold text-[#0E1C2F]">
          Upload from the SETU app
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#6C7A8C]">
          Document upload with camera and file picker is available in the SETU
          mobile app. Documents you add there appear across your health records.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E6EEF5] px-4 py-2 text-sm text-[#6C7A8C]">
            <Smartphone size={16} />
            iOS & Android
          </span>
          <Link
            to="/app/reports"
            className="inline-flex rounded-full bg-[#1C39BB] px-5 py-2.5 text-sm font-medium text-white hover:opacity-95"
          >
            Back to Health Line
          </Link>
        </div>
      </div>
    </ReportsShell>
  )
}
