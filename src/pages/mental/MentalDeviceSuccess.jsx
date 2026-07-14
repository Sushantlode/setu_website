import { Link } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { MENTAL_ACCENT } from "../../api/mental"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { MentalShell } from "./MentalShell"

export default function MentalDeviceSuccess() {
  const { flow } = useMentalHealth()
  const booking = flow.lastBooking

  return (
    <MentalShell title="Booking confirmed" backTo="/app/mental-health/bookings" showHeaderActions>
      <div className="rounded-2xl border border-[#D1FAE5] bg-white px-6 py-12 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-[#0F766E]" size={48} />
        <p className="mt-4 text-xl font-bold text-[#0F172A]">Payment successful</p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Your stress device visit has been scheduled
          {booking?.date ? ` for ${booking.date}` : ""}
          {booking?.time ? ` at ${booking.time}` : ""}.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to="/app/mental-health/bookings"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: MENTAL_ACCENT }}
          >
            View bookings
          </Link>
          <Link
            to="/app/mental-health/assessments"
            className="rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#0F172A]"
          >
            Back to assessments
          </Link>
        </div>
      </div>
    </MentalShell>
  )
}
