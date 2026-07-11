import { useEffect, useState } from "react"
import { Activity, Stethoscope } from "lucide-react"
import { resolveTeleIconCandidates } from "../../utils/telemedicine"

/**
 * Specialty / symptom icon with CDN (or API) image + Lucide fallback on error.
 * Mirrors RN IconGrid / IconGrid2 tele_icon assets; tries multiple URL candidates.
 */
export default function TeleIcon({
  item,
  kind = "speciality",
  /** Pixel size; omit or pass null to size via className / parent. */
  size = 48,
  className = "",
  imgClassName = "h-full w-full object-contain",
}) {
  const candidates = resolveTeleIconCandidates(item, kind)
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setIndex(0)
    setFailed(false)
  }, [item, kind])

  const src = !failed && candidates.length > 0 ? candidates[index] : ""
  const Fallback = kind === "symptom" ? Activity : Stethoscope
  const iconPx = size != null ? Math.max(14, Math.round(size * 0.4)) : 18
  const boxStyle = size != null ? { width: size, height: size } : undefined

  if (!src) {
    return (
      <span
        className={`inline-flex items-center justify-center text-[#1C39BB] ${className}`}
        style={boxStyle}
        aria-hidden
      >
        <Fallback size={iconPx} />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden ${className}`}
      style={boxStyle}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        className={imgClassName}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (index + 1 < candidates.length) {
            setIndex((i) => i + 1)
          } else {
            setFailed(true)
          }
        }}
      />
    </span>
  )
}
