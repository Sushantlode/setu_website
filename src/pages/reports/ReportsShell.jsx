import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, FileText } from "lucide-react"

const BG = "bg-[#DDF3FF]"

export function ReportsShell({
  title,
  subtitle,
  backTo = "/app/reports",
  children,
  className = "",
  maxWidth = "max-w-3xl lg:max-w-5xl",
}) {
  const navigate = useNavigate()

  return (
    <main className={`min-h-full ${BG}`}>
      <div className={`mx-auto ${maxWidth} px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
        <button
          type="button"
          onClick={() => {
            if (backTo) navigate(backTo)
            else navigate(-1)
          }}
          className="mb-5 inline-flex items-center gap-2 text-sm text-[#6C7A8C] transition-colors hover:text-[#0E1C2F]"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {(title || subtitle) && (
          <div className="mb-6">
            {subtitle ? (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1E9BFF]">
                {subtitle}
              </p>
            ) : null}
            {title ? (
              <h1 className="mt-1 font-serif text-3xl text-[#0E1C2F]">{title}</h1>
            ) : null}
          </div>
        )}

        {children}
      </div>
    </main>
  )
}

export function ReportsEmpty({
  title = "No records yet",
  subtitle = "When you have data in the SETU app, it will show up here.",
  actionTo,
  actionLabel,
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#E6EEF5] bg-white px-6 py-14 text-center shadow-sm">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF7FF] text-[#1E9BFF]">
        <FileText size={26} />
      </span>
      <p className="text-lg font-semibold text-[#0E1C2F]">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-[#6C7A8C]">{subtitle}</p>
      {actionTo && actionLabel ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-full bg-[#1C39BB] px-5 py-2.5 text-sm font-medium text-white hover:opacity-95"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

export function ReportsError({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
      <p className="text-sm text-red-700">{message || "Something went wrong"}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-[#1C39BB] underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
