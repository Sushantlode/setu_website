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
    <main className="min-h-full" style={{ backgroundColor: "#F5F6FA" }}>
      <div
        className="rounded-b-2xl border-b border-[#2F387E]/20"
        style={{ backgroundColor: ABHA_PRIMARY }}
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
            {title || "ABHA"}
          </h1>
          <div className="flex min-w-16 justify-end">{rightAction}</div>
        </div>
      </div>
      <div
        className={`mx-auto ${maxWidth} px-4 py-4 sm:px-6 sm:py-6 ${className}`}
      >
        {children}
      </div>
    </main>
  )
}
