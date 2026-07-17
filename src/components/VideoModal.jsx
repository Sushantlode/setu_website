import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Skeleton } from "./Skeleton"

export default function VideoModal({ open, onClose, src, title, sources }) {
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const playlist =
    sources?.length > 0
      ? sources
      : src
        ? [{ src, label: "Video" }]
        : []

  const current = playlist[activeIndex]

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setActiveIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setVideoReady(false)
      setVideoError(false)
      return undefined
    }

    setVideoReady(false)
    setVideoError(false)

    const video = videoRef.current
    if (!video) return undefined

    video.load()

    const markReady = () => setVideoReady(true)
    const handleError = () => setVideoError(true)

    video.addEventListener("loadedmetadata", markReady)
    video.addEventListener("loadeddata", markReady)
    video.addEventListener("canplay", markReady)
    video.addEventListener("error", handleError)

    video.play().catch(() => {})

    return () => {
      video.removeEventListener("loadedmetadata", markReady)
      video.removeEventListener("loadeddata", markReady)
      video.removeEventListener("canplay", markReady)
      video.removeEventListener("error", handleError)
      video.pause()
    }
  }, [open, current?.src])

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-setu-charcoal/90 backdrop-blur-sm"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top, 0px))",
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
            paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
            paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="text-sm font-medium text-setu-cream">{title}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-setu-stone transition-colors hover:bg-white/10 hover:text-setu-cream"
                aria-label="Close video"
              >
                <X size={20} />
              </button>
            </div>

            {playlist.length > 1 && (
              <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
                {playlist.map((item, index) => (
                  <button
                    key={item.src}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      index === activeIndex
                        ? "bg-setu-coral text-setu-cream"
                        : "bg-white/10 text-setu-stone hover:bg-white/15 hover:text-setu-cream"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative aspect-video w-full bg-black">
              {!videoReady && !videoError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
                  <Skeleton className="absolute inset-0 rounded-none" dark />
                  <p className="relative text-sm text-setu-stone">Loading video…</p>
                </div>
              )}
              {videoError && (
                <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
                  <p className="text-sm text-setu-stone">
                    Unable to play this video. Please try again later.
                  </p>
                </div>
              )}
              <video
                ref={videoRef}
                key={current.src}
                src={current.src}
                controls
                playsInline
                preload="auto"
                className={`h-full w-full ${
                  videoReady && !videoError ? "opacity-100" : "opacity-0"
                }`}
              >
                Your browser does not support video playback.
              </video>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
