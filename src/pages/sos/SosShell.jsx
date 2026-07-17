import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const BG = "bg-[#FEFEFE]"

export function SosShell({
  title,
  backTo = "/app",
  children,
  className = "",
  maxWidth = "max-w-3xl lg:max-w-5xl",
  showBack = true,
}) {
  const navigate = useNavigate()

  return (
    <main className={`app-shell-main ${BG}`}>
      <div className={`mx-auto ${maxWidth} px-3 py-3 sm:px-6 sm:py-6 lg:px-8 ${className}`}>
        {showBack ? (
          <button
            type="button"
            onClick={() => {
              if (backTo) navigate(backTo)
              else navigate(-1)
            }}
            className="tap-target mb-4 inline-flex items-center gap-2 text-sm text-[#6B7280] transition-colors hover:text-[#1C1C1C]"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        ) : null}

        {title ? (
          <h1 className="mb-4 text-center text-xl font-bold text-[#1C1C1C] sm:mb-6">{title}</h1>
        ) : null}

        {children}
      </div>
    </main>
  )
}
