import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { appModules } from "../data/content"
import FadeIn from "./FadeIn"

export default function Initiatives() {
  const [active, setActive] = useState(0)
  const current = appModules[active]

  return (
    <section id="services" className="pb-16 sm:pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-setu-muted">
            What We Offer
          </p>
          <h2 className="mt-3 font-serif text-3xl font-medium text-setu-charcoal sm:text-4xl lg:text-5xl">
            Everything in the SETU app
          </h2>
          <p className="mt-4 text-lg text-setu-muted">
            Tap any module from the app dashboard to explore what it offers — the same
            services millions use on the SETU super app.
          </p>
        </FadeIn>

        <div className="mt-10 grid gap-8 sm:mt-16 lg:grid-cols-5 lg:gap-12">
          <FadeIn className="lg:col-span-2">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4">
              {appModules.map((module, i) => {
                const isActive = active === i

                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`group flex flex-col items-center rounded-2xl border p-3 text-center transition-all duration-300 sm:p-4 ${
                      isActive
                        ? "border-setu-coral/60 bg-setu-teal-dark text-setu-cream shadow-lg shadow-setu-teal-dark/15"
                        : "border-setu-stone/20 bg-white hover:border-setu-coral/40 hover:bg-setu-sand/50"
                    }`}
                  >
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${
                        isActive ? "bg-white/15" : "bg-setu-sand"
                      }`}
                    >
                      <img
                        src={module.icon}
                        alt=""
                        className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                        loading="lazy"
                      />
                    </span>
                    <span
                      className={`mt-2.5 line-clamp-2 text-[11px] font-semibold leading-tight sm:text-xs ${
                        isActive ? "text-setu-cream" : "text-setu-charcoal"
                      }`}
                    >
                      {module.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="lg:col-span-3">
            <div className="hover-border-beige relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-setu-stone/20 bg-white shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-full flex-col"
                >
                  <div className="relative flex shrink-0 flex-col items-center gap-4 bg-gradient-to-br from-setu-sand via-setu-cream to-setu-teal-light/40 px-4 py-6 text-center sm:h-56 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-8 sm:text-left">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-md ring-1 ring-setu-stone/15 sm:h-32 sm:w-32 sm:p-4">
                      <img
                        src={current.icon}
                        alt={current.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-xl text-setu-charcoal sm:text-2xl lg:text-3xl">
                        {current.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-setu-muted sm:text-base">
                        {current.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-8">
                    <p className="text-base leading-relaxed text-setu-muted">
                      {current.description}
                    </p>

                    {current.stats?.length > 0 && (
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-xs">
                        {current.stats.map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-xl bg-setu-sand/80 px-3 py-2.5 text-center"
                          >
                            <p className="font-serif text-lg text-setu-teal-dark">{stat.value}</p>
                            <p className="text-[11px] text-setu-muted">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {current.highlights?.length > 0 && (
                      <ul className="mt-5 space-y-2">
                        {current.highlights.map((point) => (
                          <li
                            key={point}
                            className="flex gap-2 text-sm leading-relaxed text-setu-muted"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-0.5 shrink-0 text-setu-coral-dark"
                            />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <a
                      href="#contact"
                      className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-setu-teal-dark transition-colors hover:text-setu-coral-dark"
                    >
                      Get started with SETU
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
