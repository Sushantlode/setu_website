import { useState } from "react"
import { Skeleton } from "./Skeleton"

export default function OptimizedImage({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  loading = "lazy",
  fetchPriority,
  sizes,
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <span className={`relative block h-full w-full overflow-hidden ${wrapperClassName}`}>
      {!loaded && !failed && <Skeleton className="absolute inset-0 rounded-none" />}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </span>
  )
}
