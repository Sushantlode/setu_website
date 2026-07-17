import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import OptimizedImage from "./OptimizedImage"

function PhotoLightbox({ open, images, index, onClose, onChange }) {
  const current = images[index]
  const thumbStripRef = useRef(null)
  const touchStartX = useRef(null)

  const goPrev = useCallback(() => {
    onChange((index - 1 + images.length) % images.length)
  }, [images.length, index, onChange])

  const goNext = useCallback(() => {
    onChange((index + 1) % images.length)
  }, [images.length, index, onChange])

  useEffect(() => {
    if (!open) return undefined
    document.body.style.overflow = "hidden"
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose, goPrev, goNext])

  useEffect(() => {
    if (!open || !thumbStripRef.current) return
    const strip = thumbStripRef.current
    const active = strip.querySelector("[data-active='true']")
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [open, index])

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (e) => {
    const start = touchStartX.current
    if (start == null) return
    const delta = (e.changedTouches[0]?.clientX ?? start) - start
    if (delta > 48) goPrev()
    else if (delta < -48) goNext()
    touchStartX.current = null
  }

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col bg-setu-charcoal/97 backdrop-blur-md"
          style={{
            paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))",
            paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
            paddingLeft: "max(0.25rem, env(safe-area-inset-left, 0px))",
            paddingRight: "max(0.25rem, env(safe-area-inset-right, 0px))",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Field photo gallery"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-setu-cream">All field photos</p>
              <p className="text-xs text-setu-sand/70">
                {index + 1} of {images.length} — swipe or use arrows
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-target shrink-0 rounded-full border border-white/15 bg-white/10 p-2 text-setu-sand hover:bg-white/20"
              aria-label="Close gallery"
            >
              <X size={20} />
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-14"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={goPrev}
              className="tap-target absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg hover:bg-black/60 sm:left-4 sm:h-11 sm:w-11"
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>

            <img
              key={current.thumb}
              src={current.full || current.thumb}
              alt={current.alt}
              className="max-h-[min(52vh,520px)] max-w-full select-none object-contain sm:max-h-[min(58vh,640px)]"
              draggable={false}
              onError={(e) => {
                if (current.thumb && e.currentTarget.src !== current.thumb) {
                  e.currentTarget.src = current.thumb
                }
              }}
            />

            <button
              type="button"
              onClick={goNext}
              className="tap-target absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white shadow-lg hover:bg-black/60 sm:right-4 sm:h-11 sm:w-11"
              aria-label="Next photo"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="shrink-0 border-t border-white/10 px-3 py-3 sm:px-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-setu-sand/50">
              All photos
            </p>
            <div
              ref={thumbStripRef}
              className="touch-scroll flex gap-2 overflow-x-auto pb-1"
            >
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  data-active={i === index ? "true" : "false"}
                  onClick={() => onChange(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-16 sm:w-16 ${
                    i === index
                      ? "border-setu-coral ring-2 ring-setu-coral/30"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                >
                  <img
                    src={image.thumb}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default function DeploymentFieldPhotos({ manifestUrl, title = "Field photos" }) {
  const [images, setImages] = useState([])
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const trackRef = useRef(null)

  useEffect(() => {
    if (!manifestUrl) return undefined
    let cancelled = false
    fetch(manifestUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.images?.length) setImages(data.images)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [manifestUrl])

  const scrollToIndex = useCallback((index) => {
    const track = trackRef.current
    if (!track) return
    const slide = track.querySelector("[data-slide]")
    if (!slide) return
    const gap = 8
    const slideWidth = slide.getBoundingClientRect().width + gap
    track.scrollTo({ left: index * slideWidth, behavior: "smooth" })
    setActiveIndex(index)
  }, [])

  const step = (direction) => {
    const next = Math.max(0, Math.min(images.length - 1, activeIndex + direction))
    scrollToIndex(next)
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track || !images.length) return undefined

    const onScroll = () => {
      const slide = track.querySelector("[data-slide]")
      if (!slide) return
      const gap = 8
      const slideWidth = slide.getBoundingClientRect().width + gap
      const idx = Math.round(track.scrollLeft / slideWidth)
      setActiveIndex(Math.max(0, Math.min(images.length - 1, idx)))
    }

    track.addEventListener("scroll", onScroll, { passive: true })
    return () => track.removeEventListener("scroll", onScroll)
  }, [images.length])

  const openLightbox = (index = 0) => setLightboxIndex(index)

  if (!images.length) return null

  return (
    <div className="mt-5 border-t border-setu-stone/10 pt-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-setu-stone/50">
            {title}
          </p>
          <p className="mt-1 text-xs text-setu-stone/60">{images.length} photos from the field</p>
        </div>
        <button
          type="button"
          onClick={() => openLightbox(activeIndex)}
          className="shrink-0 rounded-full border border-setu-coral/35 px-3 py-1.5 text-xs font-medium text-setu-coral transition hover:border-setu-coral hover:bg-setu-coral/10 hover:text-setu-beige"
        >
          View all
        </button>
      </div>

      <div className="relative mt-3">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={activeIndex <= 0}
          className="tap-target absolute -left-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-setu-stone/20 bg-setu-teal-deep/95 text-setu-cream shadow-sm transition hover:border-setu-coral/50 disabled:pointer-events-none disabled:opacity-30 sm:-left-2 sm:h-9 sm:w-9"
          aria-label="Previous photos"
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={trackRef}
          className="touch-scroll flex gap-2 overflow-x-auto scroll-smooth px-7 sm:px-8"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              data-slide
              onClick={() => openLightbox(i)}
              className="aspect-[4/3] w-[42%] shrink-0 snap-start overflow-hidden rounded-lg border border-setu-stone/15 transition hover:border-setu-coral/45 sm:w-[31%]"
              aria-label={image.alt}
            >
              <OptimizedImage
                src={image.thumb}
                alt={image.alt}
                sizes="120px"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={activeIndex >= images.length - 1}
          className="tap-target absolute -right-1 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-setu-stone/20 bg-setu-teal-deep/95 text-setu-cream shadow-sm transition hover:border-setu-coral/50 disabled:pointer-events-none disabled:opacity-30 sm:-right-2 sm:h-9 sm:w-9"
          aria-label="Next photos"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] text-setu-stone/50">
        {activeIndex + 1} of {images.length}
      </p>

      <PhotoLightbox
        open={lightboxIndex !== null}
        images={images}
        index={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  )
}
