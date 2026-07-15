import { NavLink, useNavigate } from "react-router-dom"
import { ArrowLeft, Dumbbell, Home, Salad, User } from "lucide-react"
import { FITNESS_PRIMARY } from "../../api/fitness"

const TABS = [
  { to: "/app/fitness/home", label: "Home", icon: Home },
  { to: "/app/fitness/workout", label: "Workout", icon: Dumbbell },
  { to: "/app/fitness/food", label: "Food", icon: Salad },
  { to: "/app/fitness/profile", label: "Profile", icon: User },
]

export function FitnessShell({
  title,
  backTo = "/app/fitness/home",
  onBack = null,
  children,
  className = "",
  maxWidth = "max-w-3xl",
  showBack = true,
  showTabs = true,
  rightAction = null,
}) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack()
      return
    }
    if (backTo) {
      navigate(backTo)
      return
    }
    navigate(-1)
  }

  return (
    <main className="min-h-full pb-20" style={{ backgroundColor: "#F5F7FA" }}>
      <div
        className="rounded-b-2xl border-b border-emerald-900/10"
        style={{ backgroundColor: FITNESS_PRIMARY }}
      >
        <div
          className={`mx-auto flex items-center gap-3 ${maxWidth} px-4 py-3 sm:px-6`}
        >
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <span className="w-16" />
          )}
          <h1 className="flex-1 truncate text-center text-base font-semibold text-white sm:text-lg">
            {title || "Fitness"}
          </h1>
          <div className="flex min-w-16 justify-end">{rightAction}</div>
        </div>
      </div>

      <div className={`mx-auto ${maxWidth} px-4 py-4 sm:px-6 sm:py-6 ${className}`}>
        {children}
      </div>

      {showTabs && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] bg-white/95 backdrop-blur">
          <div className={`mx-auto grid max-w-3xl grid-cols-4 px-2 py-2`}>
            {TABS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
                    isActive ? "text-[#10B981]" : "text-[#6B7280]"
                  }`
                }
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </main>
  )
}
