import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { impactStats } from "../data/content"

const SCROLL_REVEAL = 48

function AnimatedCounter({ value, suffix, active }) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!active || hasAnimated.current) return undefined

    hasAnimated.current = true
    const duration = 2000
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
    return undefined
  }, [active, value])

  const formatted = count.toLocaleString("en-IN")

  return (
    <span className="font-serif text-3xl font-normal text-setu-teal-dark sm:text-4xl lg:text-5xl">
      {formatted}
      {suffix}
    </span>
  )
}

export default function ImpactStats() {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY >= SCROLL_REVEAL) {
        setRevealed(true)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section
      id="impact"
      className="relative z-20 -mt-20 scroll-mt-24 pb-20 sm:-mt-24 lg:-mt-28 lg:pb-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={false}
          animate={
            revealed
              ? { opacity: 1, y: 0, pointerEvents: "auto" }
              : { opacity: 0, y: 28, pointerEvents: "none" }
          }
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-setu-stone/20 bg-white p-6 shadow-lg sm:p-10 lg:p-12"
        >
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {impactStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={false}
                animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.45, delay: revealed ? i * 0.08 : 0 }}
                className="text-center lg:text-left"
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} active={revealed} />
                <p className="mt-2 text-sm font-semibold text-setu-charcoal sm:text-base">
                  {stat.label}
                </p>
                <p className="mt-1 text-xs text-setu-muted sm:text-sm">{stat.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
