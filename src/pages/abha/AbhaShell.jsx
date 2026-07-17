import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { ABHA_PRIMARY } from "../../api/abha"

export function AbhaShell({
  title,
  backTo = "/app/abha",
  onBack = null,
  children,
  className = "",
  maxWidth = "max-w-lg",
  showBack = true,
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
    <main className="app-shell-main" style={{ backgroundColor: "#F5F6FA" }}>
      <div
        className="app-shell-header rounded-b-2xl border-b border-[#2F387E]/20"
        style={{ backgroundColor: ABHA_PRIMARY }}
      >
        <div
          className={`mx-auto flex min-h-11 items-center gap-2 ${maxWidth} px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3`}
        >
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="tap-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm text-white/90 hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <span className="w-10 shrink-0 sm:w-16" />
          )}
          <h1 className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-white sm:text-lg">
            {title || "ABHA"}
          </h1>
          <div className="flex min-w-10 justify-end sm:min-w-16">{rightAction}</div>
        </div>
      </div>
      <div
        className={`mx-auto ${maxWidth} px-3 py-3 sm:px-6 sm:py-6 ${className}`}
      >
        {children}
      </div>
    </main>
  )
}
