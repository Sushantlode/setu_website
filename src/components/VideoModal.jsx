import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Skeleton } from "./Skeleton"

export default function VideoModal({ open, onClose, src, title }) {
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setVideoReady(false)
      setVideoError(false)
      return undefined
    }

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
  }, [open, src])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-setu-charcoal/90 p-4 backdrop-blur-sm"
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
                key={src}
                src={src}
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
