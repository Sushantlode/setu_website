import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { DRUG_PRIMARY } from "../../api/drug"

export function DrugShell({
  title,
  backTo = "/app/drug-directory",
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
    <main className="min-h-full bg-[#F7F8FC]">
      <div
        className="border-b border-[#E5E7EB]"
        style={{ backgroundColor: DRUG_PRIMARY }}
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
            {title || "Drug Directory"}
          </h1>
          <div className="flex min-w-16 justify-end">{rightAction}</div>
        </div>
      </div>
      <div
        className={`mx-auto ${maxWidth} px-4 py-4 sm:px-6 sm:py-6 lg:px-8 ${className}`}
      >
        {children}
      </div>
    </main>
  )
}

export function DrugListItem({ title, meta, description, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition hover:border-[#1C39BB]/40"
    >
      {icon ? (
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#1C39BB]">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[#1C1C1C]">{title}</span>
        {meta ? (
          <span className="mt-0.5 block text-xs font-medium text-[#1C39BB]">
            {meta}
          </span>
        ) : null}
        {description ? (
          <span className="mt-1 block text-sm text-[#6B7280] line-clamp-2">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  )
}

export function DetailSections({ sections }) {
  if (!sections?.length) {
    return (
      <p className="py-8 text-center text-sm text-[#6B7280]">
        No detailed information available for this medicine.
      </p>
    )
  }
  return (
    <div className="space-y-3">
      {sections.map((sec) => (
        <section
          key={sec.key}
          className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
        >
          <h3 className="mb-2 text-sm font-bold text-[#1C39BB]">{sec.label}</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
            {sec.text}
          </p>
        </section>
      ))}
    </div>
  )
}
