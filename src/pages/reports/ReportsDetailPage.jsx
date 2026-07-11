import { Navigate, useParams } from "react-router-dom"
import LabReportDetailPage from "./LabReportDetailPage"
import CasePaperDetailPage from "./CasePaperDetailPage"

/** Route: /app/reports/:category/:id */
export default function ReportsDetailPage() {
  const { category } = useParams()

  if (category === "lab-reports") return <LabReportDetailPage />
  if (category === "case-paper") return <CasePaperDetailPage />

  return <Navigate to={`/app/reports/${category || ""}`} replace />
}
