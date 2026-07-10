import { ArrowRight } from "lucide-react"
import FadeIn from "./FadeIn"

const reasons = [
  {
    title: "Technology + Medical Expertise",
    description: "AI-assisted screening, telemedicine, and data analytics built with clinical rigor.",
  },
  {
    title: "Proven at Scale",
    description: "Deployed across 5+ regions — from single-day camps to statewide programs.",
  },
  {
    title: "Partnership Ready",
    description: "Unified platform connecting diagnostics, telemedicine, insurance, and community care.",
  },
]

export default function Partner() {
  return (
    <section className="bg-setu-sand py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-setu-muted">
              Why Partner With Us
            </p>
            <h2 className="mt-3 font-serif text-3xl font-normal text-setu-charcoal sm:text-4xl lg:text-5xl">
              Let&apos;s build healthier communities together
            </h2>
            <p className="mt-4 text-lg text-setu-muted">
              By partnering with SETU, you gain access to a unified platform
              enabling seamless collaboration, shared value, and measurable
              health improvement.
            </p>
            <a
              href="#contact"
              className="btn-primary btn-primary-green mt-8"
            >
              Start a Conversation
              <ArrowRight size={16} />
            </a>
          </FadeIn>

          <div className="space-y-4">
            {reasons.map((reason, i) => (
              <FadeIn key={reason.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-setu-stone/20 bg-setu-cream p-6 transition-all duration-300 hover:border-setu-stone/40">
                  <h3 className="font-semibold text-setu-charcoal">{reason.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-setu-muted">
                    {reason.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
