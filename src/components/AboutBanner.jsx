import { assets } from "../data/content"
import FadeIn from "./FadeIn"
import OptimizedImage from "./OptimizedImage"

export default function AboutBanner() {
  return (
    <section className="relative w-full overflow-hidden">
      <FadeIn>
        <div className="relative aspect-[16/7] w-full sm:aspect-[21/9]">
          <OptimizedImage
            src={assets.aboutBanner}
            alt="SETU preventive health center in action"
            fetchPriority="high"
            sizes="100vw"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-setu-charcoal/70 via-setu-charcoal/45 to-setu-charcoal/25" />
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <p className="max-w-3xl text-center font-serif text-2xl font-normal leading-snug text-setu-cream sm:text-3xl lg:text-4xl">
              Health begins with awareness. Care begins with connection.
            </p>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}
