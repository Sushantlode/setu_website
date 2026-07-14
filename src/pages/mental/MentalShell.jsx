import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ClipboardList, CalendarDays } from "lucide-react"
import { MENTAL_ACCENT } from "../../api/mental"

export function MentalShell({
  title,
  backTo = "/app/mental-health",
  children,
  className = "",
  showHeaderActions = false,
  /** Hide matching header shortcut: "history" | "bookings" */
  activeAction = null,
}) {
  const navigate = useNavigate()

  return (
    <main className="min-h-full bg-[#F4FBF9]">
      <div className={`mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6 lg:max-w-5xl lg:px-8 ${className}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (backTo) navigate(backTo)
              else navigate(-1)
            }}
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] transition-colors hover:text-[#0F172A]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {showHeaderActions ? (
            <div className="flex items-center gap-1">
              {activeAction !== "history" ? (
                <Link
                  to="/app/mental-health/history"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: MENTAL_ACCENT }}
                  title="My tests"
                >
                  <ClipboardList size={14} />
                  <span className="hidden sm:inline">My tests</span>
                </Link>
              ) : null}
              {activeAction !== "bookings" ? (
                <Link
                  to="/app/mental-health/bookings"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/30 px-3 py-1.5 text-xs font-semibold text-[#0F766E]"
                  title="My bookings"
                >
                  <CalendarDays size={14} />
                  <span className="hidden sm:inline">Bookings</span>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {title ? (
          <h1 className="mb-5 text-xl font-bold text-[#0F172A] sm:text-2xl">{title}</h1>
        ) : null}

        {children}
      </div>
    </main>
  )
}
