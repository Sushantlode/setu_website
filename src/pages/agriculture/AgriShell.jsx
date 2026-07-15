import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { AGRI_PRIMARY } from "../../api/agri"

export function AgriShell({
  title,
  backTo = "/app/agriculture",
  onBack = null,
  children,
  className = "",
  maxWidth = "max-w-3xl lg:max-w-5xl",
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
    <main className="min-h-full" style={{ backgroundColor: "#F5F8F3" }}>
      <div className="border-b border-[#D9E3D7]" style={{ backgroundColor: AGRI_PRIMARY }}>
        <div className={`mx-auto flex items-center gap-3 ${maxWidth} px-4 py-3 sm:px-6`}>
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
            {title || "Agri Connect"}
          </h1>
          <div className="flex min-w-16 justify-end">{rightAction}</div>
        </div>
      </div>
      <div className={`mx-auto ${maxWidth} px-4 py-4 sm:px-6 sm:py-6 lg:px-8 ${className}`}>
        {children}
      </div>
    </main>
  )
}
