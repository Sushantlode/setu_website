import { Navigate, useParams } from "react-router-dom"
import ViewReportsPage from "./ViewReportsPage"
import LabReportsPage from "./LabReportsPage"
import CasePapersPage from "./CasePapersPage"
import VitalSignsPage from "./VitalSignsPage"
import AllergiesPage from "./AllergiesPage"
import ImmunizationPage from "./ImmunizationPage"
import ImplantsPage from "./ImplantsPage"
import LifestylePage from "./LifestylePage"
import MedicationsPage from "./MedicationsPage"
import LatestDocumentsPage from "./LatestDocumentsPage"
import UploadDocumentsPage from "./UploadDocumentsPage"

const CATEGORY_PAGES = {
  "view-reports": ViewReportsPage,
  "lab-reports": LabReportsPage,
  "case-paper": CasePapersPage,
  "vital-signs": VitalSignsPage,
  allergies: AllergiesPage,
  immunization: ImmunizationPage,
  implants: ImplantsPage,
  lifestyle: LifestylePage,
  medications: MedicationsPage,
  latest: LatestDocumentsPage,
  upload: UploadDocumentsPage,
}

/** Route: /app/reports/:category */
export default function ReportsCategoryPage() {
  const { category } = useParams()
  const Page = CATEGORY_PAGES[category]
  if (!Page) return <Navigate to="/app/reports" replace />
  return <Page />
}
