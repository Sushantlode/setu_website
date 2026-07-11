import { Link, useLocation, useNavigate } from "react-router-dom"
import { CheckCircle2, CalendarDays } from "lucide-react"
import { formatShortDate } from "../../utils/telemedicine"

export default function BookingConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const confirmation = location.state?.confirmation

  if (!confirmation) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-setu-muted">No booking confirmation to show.</p>
        <Link
          to="/app/telemedicine/appointments"
          className="mt-4 inline-block text-sm font-medium text-[#1C39BB] hover:underline"
        >
          View appointments
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-[#D2DEFF] bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="mt-4 font-serif text-2xl text-setu-charcoal sm:text-3xl">
          Booking confirmed
        </h1>
        <p className="mt-2 text-sm text-setu-muted">
          Your telemedicine appointment has been scheduled successfully.
        </p>

        <dl className="mt-6 space-y-3 rounded-2xl bg-[#F7FAFF] px-4 py-4 text-left text-sm">
          {confirmation.doctorName ? (
            <div className="flex justify-between gap-3">
              <dt className="text-setu-muted">Doctor</dt>
              <dd className="font-medium text-setu-charcoal">
                {confirmation.doctorName}
              </dd>
            </div>
          ) : null}
          {confirmation.date ? (
            <div className="flex justify-between gap-3">
              <dt className="text-setu-muted">Date</dt>
              <dd className="font-medium text-setu-charcoal">
                {formatShortDate(confirmation.date)}
              </dd>
            </div>
          ) : null}
          {confirmation.timeSlot ? (
            <div className="flex justify-between gap-3">
              <dt className="text-setu-muted">Time</dt>
              <dd className="font-medium text-setu-charcoal">
                {confirmation.timeSlot}
              </dd>
            </div>
          ) : null}
          {confirmation.appointmentId ? (
            <div className="flex justify-between gap-3">
              <dt className="text-setu-muted">Appointment ID</dt>
              <dd className="font-medium text-setu-charcoal">
                {confirmation.appointmentId}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              navigate("/app/telemedicine/appointments", {
                state: {
                  bookingStatus: "success",
                  focusAppointmentId: confirmation.appointmentId,
                },
              })
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1C39BB] px-4 py-3 text-sm font-semibold text-white"
          >
            <CalendarDays size={16} />
            My appointments
          </button>
          <Link
            to="/app/telemedicine/home"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-[#D2DEFF] px-4 py-3 text-sm font-medium text-[#1C39BB]"
          >
            Find more doctors
          </Link>
        </div>
      </div>
    </main>
  )
}
