import { Routes, Route } from "react-router-dom"
import MarketingPage from "./pages/MarketingPage"
import LoginPage from "./pages/LoginPage"
import RegisterProfilePage from "./pages/RegisterProfilePage"
import RegisterCompletePage from "./pages/RegisterCompletePage"
import AppLayout from "./layouts/AppLayout"
import AppDashboard from "./pages/AppDashboard"
import ModulePage from "./pages/ModulePage"
import SosPage from "./pages/SosPage"
import ReportsHome from "./pages/reports/ReportsHome"
import ReportsCategoryPage from "./pages/reports/ReportsCategoryPage"
import ReportsDetailPage from "./pages/reports/ReportsDetailPage"
import ProtectedRoute from "./components/ProtectedRoute"
import TelemedicineWelcome from "./pages/telemedicine/TelemedicineWelcome"
import TelemedicineHome from "./pages/telemedicine/TelemedicineHome"
import DoctorsList from "./pages/telemedicine/DoctorsList"
import DoctorDetail from "./pages/telemedicine/DoctorDetail"
import BookReview from "./pages/telemedicine/BookReview"
import BookingConfirmation from "./pages/telemedicine/BookingConfirmation"
import MyAppointments from "./pages/telemedicine/MyAppointments"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/register/profile" element={<RegisterProfilePage />} />
      <Route path="/register/complete" element={<RegisterCompletePage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppDashboard />} />
        <Route path="sos" element={<SosPage />} />
        <Route path="reports" element={<ReportsHome />} />
        <Route path="reports/:category" element={<ReportsCategoryPage />} />
        <Route path="reports/:category/:id" element={<ReportsDetailPage />} />

        {/* Telemedicine stack — must be before :moduleId catch-all */}
        <Route path="telemedicine" element={<TelemedicineWelcome />} />
        <Route path="telemedicine/home" element={<TelemedicineHome />} />
        <Route path="telemedicine/doctors" element={<DoctorsList />} />
        <Route path="telemedicine/doctors/:id" element={<DoctorDetail />} />
        <Route path="telemedicine/book/:id" element={<BookReview />} />
        <Route path="telemedicine/confirmation" element={<BookingConfirmation />} />
        <Route path="telemedicine/appointments" element={<MyAppointments />} />
        <Route path="doctors" element={<TelemedicineWelcome />} />

        <Route path=":moduleId" element={<ModulePage />} />
      </Route>
    </Routes>
  )
}
