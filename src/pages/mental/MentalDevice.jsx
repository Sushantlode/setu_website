import { Link, useNavigate } from "react-router-dom"
import { MENTAL_ACCENT, mentalAsset } from "../../api/mental"
import { MentalShell } from "./MentalShell"

const STEPS = [
  "Book a slot for device screening",
  "Technician arrives at your address",
  "Non-invasive stress quantification",
  "View real-time wellness insights",
  "Discuss results with a specialist if needed",
]

export default function MentalDevice() {
  const navigate = useNavigate()

  return (
    <MentalShell title="Stress device" backTo="/app/mental-health/assessments" showHeaderActions>
      <div className="overflow-hidden rounded-2xl border border-[#D1FAE5] bg-white shadow-sm">
        <img
          src={mentalAsset("action.png")}
          alt="Stress quantification device"
          className="max-h-56 w-full object-contain bg-[#ECFDF5]"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
        <div className="p-5">
          <p className="text-lg font-bold text-[#0F172A]">At-home stress screening</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            Book a technician-assisted visit with SETU’s stress quantification device for
            real-time emotional wellness insights at home.
          </p>

          <p className="mt-5 text-sm font-semibold text-[#0F172A]">How it works</p>
          <ol className="mt-2 space-y-2">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-[#4B5563]">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: MENTAL_ACCENT }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => navigate("/app/mental-health/device/details")}
            className="mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: MENTAL_ACCENT }}
          >
            Book now
          </button>
          <Link
            to="/app/mental-health/bookings"
            className="mt-3 block text-center text-sm font-medium text-[#0F766E]"
          >
            View my bookings
          </Link>
        </div>
      </div>
    </MentalShell>
  )
}
