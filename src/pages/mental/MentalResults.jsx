import { Link, useNavigate } from "react-router-dom"
import { CalendarDays, ClipboardList, Stethoscope } from "lucide-react"
import { MENTAL_ACCENT, resolveBandDisplayColor } from "../../api/mental"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { MentalShell } from "./MentalShell"

export default function MentalResults() {
  const navigate = useNavigate()
  const { lastResult } = useMentalHealth()

  if (!lastResult) {
    return (
      <MentalShell title="Results" backTo="/app/mental-health/assessments">
        <p className="text-sm text-[#6B7280]">No recent result. Take an assessment first.</p>
        <Link
          to="/app/mental-health/assessments"
          className="mt-4 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          Browse assessments
        </Link>
      </MentalShell>
    )
  }

  const bandColor = resolveBandDisplayColor(
    lastResult.bandColor || lastResult.band?.color,
  )
  const bandLabel = lastResult.bandLabel || lastResult.band?.label || "Result"
  const recommendation =
    lastResult.bandRecommendation || lastResult.band?.recommendation || ""
  const score = lastResult.totalScore
  const bands = lastResult.scoreBands || lastResult.assessment?.scoreBands || []

  return (
    <MentalShell title="Your results" backTo="/app/mental-health/assessments">
      <p className="mb-4 text-sm text-[#6B7280]">
        {lastResult.assessmentTitle || lastResult.assessment?.title || "Assessment"}
      </p>

      <div
        className="rounded-2xl p-6 text-center text-white shadow-sm"
        style={{ backgroundColor: bandColor }}
      >
        <p className="text-sm font-medium uppercase tracking-wide opacity-90">Score band</p>
        <p className="mt-1 text-3xl font-extrabold">{bandLabel}</p>
        {score !== undefined && score !== null ? (
          <p className="mt-2 text-lg font-semibold opacity-95">Score: {score}</p>
        ) : null}
      </div>

      {lastResult.keyInsight ? (
        <div className="mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-semibold text-[#0F172A]">Key insight</p>
          <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{lastResult.keyInsight}</p>
        </div>
      ) : null}

      {recommendation ? (
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-semibold text-[#0F172A]">Recommendation</p>
          <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{recommendation}</p>
        </div>
      ) : null}

      {Array.isArray(lastResult.nextSteps) && lastResult.nextSteps.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-semibold text-[#0F172A]">Next steps</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4B5563]">
            {lastResult.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {bands.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-semibold text-[#0F172A]">Score scale</p>
          <ul className="mt-3 space-y-2">
            {bands.map((b) => (
              <li key={`${b.label}-${b.minScore}`} className="flex items-center gap-3 text-sm">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: resolveBandDisplayColor(b.color) }}
                />
                <span className="font-medium text-[#0F172A]">{b.label}</span>
                <span className="text-[#6B7280]">
                  {b.minScore}–{b.maxScore}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => navigate("/app/mental-health/device")}
          className="flex items-center gap-3 rounded-2xl border border-[#D1FAE5] bg-white p-4 text-left"
        >
          <CalendarDays className="text-[#0F766E]" size={20} />
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Book stress device</p>
            <p className="text-xs text-[#6B7280]">At-home screening</p>
          </div>
        </button>
        <Link
          to="/app/telemedicine"
          className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4"
        >
          <Stethoscope className="text-[#0F766E]" size={20} />
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Talk to a doctor</p>
            <p className="text-xs text-[#6B7280]">Telemedicine</p>
          </div>
        </Link>
        <Link
          to="/app/mental-health/history"
          className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4"
        >
          <ClipboardList className="text-[#0F766E]" size={20} />
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">View history</p>
            <p className="text-xs text-[#6B7280]">Past submissions</p>
          </div>
        </Link>
      </div>
    </MentalShell>
  )
}
