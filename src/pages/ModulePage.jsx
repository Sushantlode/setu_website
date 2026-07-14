import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Check } from "lucide-react"
import { appModules } from "../data/content"

export default function ModulePage() {
  const { moduleId } = useParams()
  const module = appModules.find((m) => m.id === moduleId)

  if (!module) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-setu-muted">Module not found.</p>
        <Link to="/app" className="mt-4 inline-block text-setu-teal hover:underline">
          Back to dashboard
        </Link>
      </main>
    )
  }

  const accent = module.accent || "#1C39BB"

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-8 sm:px-6 lg:max-w-7xl lg:px-8 lg:py-8">
      <Link
        to="/app"
        className="mb-6 inline-flex items-center gap-2 text-sm text-setu-muted transition-colors hover:text-setu-charcoal"
      >
        <ArrowLeft size={16} />
        Dashboard
      </Link>

      <div className="overflow-hidden rounded-[1.75rem] border border-setu-stone/15 bg-white shadow-sm">
        <div
          className="relative overflow-hidden px-6 py-8 text-white sm:px-8"
          style={{
            background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, #0b1220) 100%)`,
          }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <img src={module.icon} alt="" className="h-12 w-12 object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                SETU Module
              </p>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl">{module.title}</h1>
              <p className="mt-2 text-white/85">{module.tagline}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="leading-relaxed text-setu-muted">{module.description}</p>

            <ul className="mt-6 space-y-3">
              {module.highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-setu-charcoal">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: accent }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {module.stats?.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {module.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="min-w-[7rem] rounded-2xl bg-setu-sand/80 px-4 py-3 text-center"
                  >
                    <p className="text-xl font-semibold text-setu-charcoal">{stat.value}</p>
                    <p className="text-xs text-setu-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-setu-muted">
              What you can do
            </p>
            {(module.actions || []).map((action) => (
              <div
                key={action.label}
                className="rounded-2xl border border-setu-stone/15 bg-setu-cream px-4 py-4"
              >
                <p className="font-medium text-setu-charcoal">{action.label}</p>
                <p className="mt-1 text-sm text-setu-muted">{action.hint}</p>
              </div>
            ))}

            <Link
              to="/app"
              className="btn-primary btn-primary-dark mt-2 flex w-full items-center justify-center gap-2"
            >
              Back to home
            </Link>
            <Link
              to="/#services"
              className="btn-primary btn-outline-dark flex w-full items-center justify-center"
            >
              Learn more on website
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
