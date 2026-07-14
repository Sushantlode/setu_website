import { Outlet, Routes, Route } from "react-router-dom"
import MarketingPage from "./pages/MarketingPage"
import LoginPage from "./pages/LoginPage"
import RegisterProfilePage from "./pages/RegisterProfilePage"
import RegisterCompletePage from "./pages/RegisterCompletePage"
import AppLayout from "./layouts/AppLayout"
import AppDashboard from "./pages/AppDashboard"
import ModulePage from "./pages/ModulePage"
import SosHome from "./pages/sos/SosHome"
import SosContacts from "./pages/sos/SosContacts"
import SosProfile from "./pages/sos/SosProfile"
import ReportsHome from "./pages/reports/ReportsHome"
import ReportsCategoryPage from "./pages/reports/ReportsCategoryPage"
import ReportsDetailPage from "./pages/reports/ReportsDetailPage"
import ProtectedRoute from "./components/ProtectedRoute"
import TelemedicineHome from "./pages/telemedicine/TelemedicineHome"
import DoctorsList from "./pages/telemedicine/DoctorsList"
import DoctorDetail from "./pages/telemedicine/DoctorDetail"
import BookReview from "./pages/telemedicine/BookReview"
import BookingConfirmation from "./pages/telemedicine/BookingConfirmation"
import MyAppointments from "./pages/telemedicine/MyAppointments"
import BookTestHome from "./pages/booktest/BookTestHome"
import {
  BookTestPackageDetail,
  BookTestPackages,
} from "./pages/booktest/BookTestPackages"
import BookTestCart from "./pages/booktest/BookTestCart"
import BookTestPatient from "./pages/booktest/BookTestPatient"
import BookTestSlots from "./pages/booktest/BookTestSlots"
import BookTestCheckout from "./pages/booktest/BookTestCheckout"
import {
  BookTestOrderDetail,
  BookTestOrders,
} from "./pages/booktest/BookTestOrders"
import {
  BookTestFailure,
  BookTestSuccess,
} from "./pages/booktest/BookTestResult"
import BookTestSaved from "./pages/booktest/BookTestSaved"
import { BookTestProvider } from "./context/BookTestContext"
import GenericHome from "./pages/generic/GenericHome"
import {
  GenericCategory,
  GenericProductDetail,
} from "./pages/generic/GenericProducts"
import GenericCart from "./pages/generic/GenericCart"
import GenericCompare from "./pages/generic/GenericCompare"
import GenericPrescription from "./pages/generic/GenericPrescription"
import {
  GenericOrderDetail,
  GenericOrders,
} from "./pages/generic/GenericOrders"
import GenericRequests from "./pages/generic/GenericRequests"
import {
  GenericFailure,
  GenericSuccess,
} from "./pages/generic/GenericResult"
import { GenericMedicineProvider } from "./context/GenericMedicineContext"
import { MentalHealthProvider } from "./context/MentalHealthContext"
import MentalSubject from "./pages/mental/MentalSubject"
import MentalAssessments from "./pages/mental/MentalAssessments"
import MentalRunner from "./pages/mental/MentalRunner"
import MentalResults from "./pages/mental/MentalResults"
import MentalHistory from "./pages/mental/MentalHistory"
import MentalBookings from "./pages/mental/MentalBookings"
import MentalDevice from "./pages/mental/MentalDevice"
import MentalDeviceDetails from "./pages/mental/MentalDeviceDetails"
import MentalDeviceAddress from "./pages/mental/MentalDeviceAddress"
import MentalDeviceReview from "./pages/mental/MentalDeviceReview"
import MentalDeviceSuccess from "./pages/mental/MentalDeviceSuccess"
import MentalSolh from "./pages/mental/MentalSolh"
import MentalFaceScan from "./pages/mental/MentalFaceScan"

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
        <Route path="sos" element={<SosHome />} />
        <Route path="sos/contacts" element={<SosContacts />} />
        <Route path="sos/profile" element={<SosProfile />} />
        <Route path="reports" element={<ReportsHome />} />
        <Route path="reports/:category" element={<ReportsCategoryPage />} />
        <Route path="reports/:category/:id" element={<ReportsDetailPage />} />

        {/* Telemedicine stack — must be before :moduleId catch-all */}
        <Route path="telemedicine" element={<TelemedicineHome />} />
        <Route path="telemedicine/home" element={<TelemedicineHome />} />
        <Route path="telemedicine/doctors" element={<DoctorsList />} />
        <Route path="telemedicine/doctors/:id" element={<DoctorDetail />} />
        <Route path="telemedicine/book/:id" element={<BookReview />} />
        <Route path="telemedicine/confirmation" element={<BookingConfirmation />} />
        <Route path="telemedicine/appointments" element={<MyAppointments />} />
        <Route path="doctors" element={<TelemedicineHome />} />

        {/* Book Test stack — must be before :moduleId catch-all */}
        <Route
          path="book-tests"
          element={
            <BookTestProvider>
              <Outlet />
            </BookTestProvider>
          }
        >
          <Route index element={<BookTestHome />} />
          <Route path="home" element={<BookTestHome />} />
          <Route path="packages" element={<BookTestPackages />} />
          <Route path="packages/:code" element={<BookTestPackageDetail />} />
          <Route path="cart" element={<BookTestCart />} />
          <Route path="patient" element={<BookTestPatient />} />
          <Route path="slots" element={<BookTestSlots />} />
          <Route path="checkout" element={<BookTestCheckout />} />
          <Route path="orders" element={<BookTestOrders />} />
          <Route path="orders/:orderId" element={<BookTestOrderDetail />} />
          <Route path="saved" element={<BookTestSaved />} />
          <Route path="success" element={<BookTestSuccess />} />
          <Route path="failure" element={<BookTestFailure />} />
        </Route>

        {/* Generic Medicine stack — must be before :moduleId catch-all */}
        <Route
          path="generic-medicine"
          element={
            <GenericMedicineProvider>
              <Outlet />
            </GenericMedicineProvider>
          }
        >
          <Route index element={<GenericHome />} />
          <Route path="home" element={<GenericHome />} />
          <Route path="category/:categoryId" element={<GenericCategory />} />
          <Route path="products/:productId" element={<GenericProductDetail />} />
          <Route path="cart" element={<GenericCart />} />
          <Route path="compare" element={<GenericCompare />} />
          <Route path="prescription" element={<GenericPrescription />} />
          <Route path="orders" element={<GenericOrders />} />
          <Route path="orders/:orderId" element={<GenericOrderDetail />} />
          <Route path="requests" element={<GenericRequests />} />
          <Route path="success" element={<GenericSuccess />} />
          <Route path="failure" element={<GenericFailure />} />
        </Route>

        {/* Mental Health stack — must be before :moduleId catch-all */}
        <Route
          path="mental-health"
          element={
            <MentalHealthProvider>
              <Outlet />
            </MentalHealthProvider>
          }
        >
          <Route index element={<MentalSubject />} />
          <Route path="subject" element={<MentalSubject />} />
          <Route path="assessments" element={<MentalAssessments />} />
          <Route path="runner/:id" element={<MentalRunner />} />
          <Route path="results" element={<MentalResults />} />
          <Route path="history" element={<MentalHistory />} />
          <Route path="bookings" element={<MentalBookings />} />
          <Route path="device" element={<MentalDevice />} />
          <Route path="device/details" element={<MentalDeviceDetails />} />
          <Route path="device/address" element={<MentalDeviceAddress />} />
          <Route path="device/review" element={<MentalDeviceReview />} />
          <Route path="device/success" element={<MentalDeviceSuccess />} />
          <Route path="solh" element={<MentalSolh />} />
          <Route path="solh/test/:testId" element={<MentalSolh />} />
          <Route path="solh/:categoryId" element={<MentalSolh />} />
          <Route path="face-scan" element={<MentalFaceScan />} />
        </Route>

        <Route path=":moduleId" element={<ModulePage />} />
      </Route>
    </Routes>
  )
}
