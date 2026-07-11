export function Skeleton({ className = "", dark = false, app = false, ...props }) {
  const tone = app
    ? "skeleton-shimmer-app"
    : dark
      ? "skeleton-shimmer-dark"
      : "skeleton-shimmer"

  return (
    <div className={`${tone} ${className}`} aria-hidden="true" {...props} />
  )
}

export function SkeletonText({ lines = 3, className = "", dark = false, app = false }) {
  const widths = ["w-full", "w-full", "w-4/5", "w-3/5"]

  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          dark={dark}
          app={app}
          className={`h-3 rounded-md ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = "", app = false }) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border ${
        app ? "border-[#D2DEFF] bg-white" : "border-setu-stone/15 bg-white"
      } ${className}`}
    >
      <Skeleton app={app} className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton app={app} className="h-5 w-2/3 rounded-md" />
        <SkeletonText lines={2} app={app} />
      </div>
    </div>
  )
}
