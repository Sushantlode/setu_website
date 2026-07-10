import { beliefs, timeline, assets } from "../data/content"
import FadeIn from "./FadeIn"
import OptimizedImage from "./OptimizedImage"

export default function Mission() {
  return (
    <section id="about" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-setu-muted">
            About SETU
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal text-setu-charcoal sm:text-4xl lg:text-5xl">
              Health begins with awareness. Care begins with connection.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-setu-muted">
              SETU brings mothers, children, working adults, and seniors together
              under a seamless digital health platform — where prevention is
              prioritized, access is simplified, and care is personal.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-setu-muted">
              In India, many illnesses are detected late — not because care
              isn&apos;t available, but because it isn&apos;t accessible,
              coordinated, or preventive.
            </p>

            <div className="mt-10 space-y-4">
              {beliefs.map((belief, i) => (
                <FadeIn key={belief} delay={i * 0.1}>
                  <p className="font-serif text-xl italic text-setu-teal-dark sm:text-2xl">
                    {belief}
                  </p>
                </FadeIn>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="hover-border-beige overflow-hidden rounded-3xl bg-setu-sand">
              <OptimizedImage
                src={assets.aboutImage}
                alt="SETU team and healthcare work"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-48 w-full object-cover sm:h-56"
              />
              <div className="p-8 sm:p-10">
              <h3 className="font-serif text-2xl font-medium text-setu-charcoal">
                Journey of Impact
              </h3>
              <div className="mt-8 space-y-0">
                {timeline.map((item, i) => (
                  <div key={item.title} className="relative flex gap-6 pb-8 last:pb-0">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[19px] top-10 h-full w-px bg-setu-teal/20" />
                    )}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-setu-teal-dark text-xs font-bold text-setu-cream">
                      {item.year.slice(2)}
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-setu-muted">
                        {item.year}
                      </p>
                      <h4 className="mt-1 font-semibold text-setu-charcoal">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm leading-relaxed text-setu-muted">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
