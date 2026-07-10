import { useMemo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Smartphone, CheckCircle2 } from "lucide-react"
import { deployments, setuPlatform } from "../data/content"
import { getIndiaStatePaths, latLngToMapSvg, MAP_VIEWBOX } from "../data/indiaMap"
import FadeIn from "./FadeIn"
import OptimizedImage from "./OptimizedImage"

function getStateStyle(stateId, { activeStateId, hoveredStateId, hasDeployment }) {
  const isActive = stateId === activeStateId
  const isHovered = stateId === hoveredStateId && !isActive

  if (isActive) {
    return {
      fill: "rgba(229, 184, 135, 0.32)",
      stroke: "#e5b887",
      strokeWidth: 1.4,
    }
  }

  if (isHovered) {
    return {
      fill: hasDeployment ? "rgba(229, 184, 135, 0.18)" : "rgba(251, 249, 247, 0.1)",
      stroke: hasDeployment ? "#e5b887" : "rgba(229, 214, 194, 0.65)",
      strokeWidth: 1.1,
    }
  }

  return {
    fill: hasDeployment ? "rgba(251, 249, 247, 0.08)" : "rgba(251, 249, 247, 0.03)",
    stroke: "rgba(229, 214, 194, 0.38)",
    strokeWidth: 0.65,
  }
}

function DeploymentPanel({ item, isPreview, isPlatform }) {
  if (isPlatform) {
    const platform = setuPlatform
    return (
      <motion.div
        key="platform"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="flex h-full flex-col"
      >
        <div className="relative h-48 w-full shrink-0 sm:h-52">
          <OptimizedImage
            src={platform.image}
            alt={platform.title}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-setu-teal-deep/85 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 text-setu-coral">
              <Smartphone size={16} />
              <span className="text-sm font-medium">Available across India</span>
            </div>
            <h3 className="mt-1 font-serif text-xl text-setu-cream">{platform.title}</h3>
            <p className="mt-1 text-xs text-setu-stone/70">{platform.tagline}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-setu-stone/80">{platform.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {platform.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-setu-cream/5 px-3 py-2.5 text-center"
              >
                <p className="font-serif text-lg text-setu-coral">{stat.value}</p>
                <p className="text-[11px] text-setu-stone/60">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {platform.services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-setu-cream/10 px-2.5 py-1 text-[11px] font-medium text-setu-stone/75"
              >
                {service}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {platform.gallery.map((src) => (
              <div key={src} className="aspect-[4/3] overflow-hidden rounded-lg">
                <OptimizedImage
                  src={src}
                  alt=""
                  sizes="120px"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col"
    >
      <div className="relative h-48 w-full shrink-0 sm:h-52">
        <OptimizedImage
          src={item.image}
          alt={item.name}
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-setu-teal-deep/85 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 text-setu-coral">
            <MapPin size={16} />
            <span className="text-sm font-medium">{item.location}</span>
          </div>
          <h3 className="mt-1 font-serif text-xl text-setu-cream">{item.name}</h3>
          {item.tagline && (
            <p className="mt-0.5 text-xs text-setu-stone/70">{item.tagline}</p>
          )}
        </div>
        {isPreview && (
          <div className="absolute right-4 top-4 rounded-full bg-setu-coral/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-setu-teal-deep">
            Preview
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <p className="text-sm text-setu-stone/60">{item.year}</p>
        <p className="mt-1 font-serif text-2xl text-setu-coral sm:text-3xl">{item.impact}</p>
        <p className="mt-3 text-sm leading-relaxed text-setu-stone/80">{item.description}</p>

        {item.highlights?.length > 0 && (
          <ul className="mt-4 space-y-2">
            {item.highlights.map((point) => (
              <li key={point} className="flex gap-2 text-xs leading-relaxed text-setu-stone/75">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-setu-coral/80" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {item.services?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-setu-cream/10 px-2.5 py-1 text-[11px] font-medium text-setu-stone/75"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        {item.gallery?.length > 1 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {item.gallery.slice(0, 3).map((src) => (
              <div key={src} className="aspect-[4/3] overflow-hidden rounded-lg">
                <OptimizedImage
                  src={src}
                  alt=""
                  sizes="120px"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function ImpactMap() {
  const [active, setActive] = useState(deployments[0])
  const [preview, setPreview] = useState(null)
  const [hoveredStateId, setHoveredStateId] = useState(null)
  const statePaths = useMemo(() => getIndiaStatePaths(), [])

  const deploymentsByState = useMemo(() => {
    const map = {}
    for (const d of deployments) {
      if (!map[d.stateId]) map[d.stateId] = []
      map[d.stateId].push(d)
    }
    return map
  }, [])

  const handleStateClick = useCallback(
    (stateId) => {
      const stateDeployments = deploymentsByState[stateId]
      if (!stateDeployments?.length) return

      const currentIdx = stateDeployments.findIndex((d) => d.id === active.id)
      if (currentIdx >= 0 && stateDeployments.length > 1) {
        setActive(stateDeployments[(currentIdx + 1) % stateDeployments.length])
      } else {
        setActive(stateDeployments[0])
      }
      setPreview(null)
    },
    [active.id, deploymentsByState],
  )

  const handleDeploymentHover = useCallback((deployment) => {
    setPreview(deployment)
    setHoveredStateId(deployment.stateId)
  }, [])

  const handleStateHover = useCallback(
    (stateId) => {
      setHoveredStateId(stateId)
      const stateDeployments = deploymentsByState[stateId]
      if (stateDeployments?.length) {
        setPreview(stateDeployments[0])
      } else {
        setPreview(null)
      }
    },
    [deploymentsByState],
  )

  const handleMapLeave = useCallback(() => {
    setHoveredStateId(null)
    setPreview(null)
  }, [])

  const displayed = preview || active
  const showPlatform = hoveredStateId && !deploymentsByState[hoveredStateId]?.length
  const hoveredState = hoveredStateId
    ? statePaths.find((s) => s.id === hoveredStateId)
    : null
  const hoveredDeployments = hoveredStateId ? deploymentsByState[hoveredStateId] : null

  return (
    <section id="impact-map" className="bg-setu-teal-deep text-setu-cream">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <FadeIn className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-setu-coral">
            Our Reach
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal sm:text-4xl lg:text-5xl">
            Impact across India
          </h2>
          <p className="mt-4 text-lg text-setu-stone/80">
            From Sundargarh, Odisha to Pune, Maharashtra — preventive care at scale, powered by the
            SETU super app with 15+ health services nationwide.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-8 lg:grid-cols-5">
          <FadeIn className="lg:col-span-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-setu-stone/10 bg-setu-teal-dark/40 lg:aspect-auto lg:min-h-[480px]">
              {hoveredState && (
                <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)] rounded-2xl bg-setu-teal-deep/95 px-4 py-3 text-setu-cream shadow-lg backdrop-blur-sm">
                  <p className="text-sm font-semibold">{hoveredState.label}</p>
                  {hoveredDeployments?.length ? (
                    <>
                      <p className="mt-0.5 text-xs text-setu-coral">
                        {hoveredDeployments.length} active project
                        {hoveredDeployments.length > 1 ? "s" : ""}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-setu-stone/75">
                        {hoveredDeployments[0].impact} — {hoveredDeployments[0].name}
                      </p>
                      {hoveredDeployments[0].tagline && (
                        <p className="mt-1 text-[11px] text-setu-stone/60">
                          {hoveredDeployments[0].tagline}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-xs leading-relaxed text-setu-stone/70">
                      SETU app available — telemedicine, lab tests, ABHA, schemes & more
                    </p>
                  )}
                </div>
              )}

              <svg
                viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                className="h-full w-full p-4 sm:p-6"
                aria-label="Map of India showing SETU deployment locations"
                onMouseLeave={handleMapLeave}
              >
                <g id="india-states">
                  {statePaths.map((state) => {
                    const hasDeployment = Boolean(deploymentsByState[state.id]?.length)
                    const style = getStateStyle(state.id, {
                      activeStateId: displayed.stateId,
                      hoveredStateId,
                      hasDeployment,
                    })

                    return (
                      <path
                        key={state.id}
                        id={state.id}
                        d={state.d}
                        aria-label={state.label}
                        role={hasDeployment ? "button" : undefined}
                        tabIndex={hasDeployment ? 0 : undefined}
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        strokeLinejoin="round"
                        className={`transition-all duration-300 ${
                          hasDeployment
                            ? "cursor-pointer hover:brightness-110"
                            : "cursor-default"
                        }`}
                        onMouseEnter={() => handleStateHover(state.id)}
                        onClick={() => handleStateClick(state.id)}
                        onKeyDown={(e) => {
                          if (hasDeployment && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            handleStateClick(state.id)
                          }
                        }}
                      />
                    )
                  })}
                </g>

                {deployments.map((d) => {
                  const { x, y } = latLngToMapSvg(d.lat, d.lng)
                  const selected = displayed.id === d.id
                  const stateHovered = hoveredStateId === d.stateId

                  return (
                    <g
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setActive(d)
                        setPreview(null)
                      }}
                      onMouseEnter={() => handleDeploymentHover(d)}
                    >
                      {selected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={12}
                          fill="none"
                          stroke="#e5b887"
                          strokeWidth={1}
                          opacity={0.75}
                        />
                      )}
                      {stateHovered && !selected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={8}
                          fill="none"
                          stroke="rgba(229, 184, 135, 0.5)"
                          strokeWidth={0.8}
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={selected ? 6 : stateHovered ? 5 : 4}
                        fill={selected ? "#e5b887" : "rgba(248, 242, 231, 0.9)"}
                        stroke={selected ? "#faf9f7" : "rgba(229, 214, 194, 0.5)"}
                        strokeWidth={0.8}
                        className="transition-all duration-300"
                      />
                    </g>
                  )
                })}
              </svg>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="lg:col-span-2">
            <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-setu-stone/10 bg-setu-teal-dark/40 backdrop-blur-sm">
              <AnimatePresence mode="wait">
                {showPlatform ? (
                  <DeploymentPanel key="platform" isPlatform />
                ) : (
                  <DeploymentPanel
                    key={displayed.id}
                    item={displayed}
                    isPreview={Boolean(preview)}
                  />
                )}
              </AnimatePresence>

              <div className="border-t border-setu-stone/10 px-6 py-4 sm:px-8">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-setu-stone/50">
                  Deployment locations
                </p>
                <div className="flex flex-wrap gap-2">
                  {deployments.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setActive(d)
                        setPreview(null)
                      }}
                      onMouseEnter={() => handleDeploymentHover(d)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                        displayed.id === d.id && !showPlatform
                          ? "bg-setu-coral text-setu-teal-deep"
                          : "bg-setu-cream/10 text-setu-stone/70 hover:bg-setu-cream/20"
                      }`}
                    >
                      {d.name}
                    </button>
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
