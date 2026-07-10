import { ChartLine, BrainCircuit } from "lucide-react"
import { innovationFeatures } from "../data/content"
import FadeIn from "./FadeIn"
import OptimizedImage from "./OptimizedImage"

const iconMap = {
  chart: ChartLine,
  brain: BrainCircuit,
}

export default function Devices() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-setu-muted">
            Innovation
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal text-setu-charcoal sm:text-4xl lg:text-5xl">
            Predictive analytics for smarter care
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-setu-muted">
            Turn health data into actionable insights — identifying trends and risks
            before they become emergencies.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {innovationFeatures.map((feature, i) => {
            const Icon = iconMap[feature.icon]
            return (
              <FadeIn key={feature.id} delay={i * 0.1}>
                <article className="group relative overflow-hidden rounded-3xl transition-transform duration-500 hover:scale-[1.01]">
                  <div className="relative lg:min-h-[320px]">
                    <OptimizedImage
                      src={feature.image}
                      alt={feature.title}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-setu-teal-deep/95 via-setu-teal-deep/70 to-setu-teal-deep/40" />
                    <div className="relative p-8 sm:p-10">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-setu-cream/15 text-setu-cream backdrop-blur-sm">
                        <Icon size={28} />
                      </span>
                      <h3 className="mt-6 font-serif text-2xl font-normal text-setu-cream sm:text-3xl">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm font-medium text-setu-stone/80">
                        {feature.tagline}
                      </p>
                      <p className="mt-4 max-w-md leading-relaxed text-setu-stone/70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </article>
              </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}
