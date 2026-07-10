export function Skeleton({ className = "", dark = false, ...props }) {
  return (
    <div
      className={`${dark ? "skeleton-shimmer-dark" : "skeleton-shimmer"} ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className = "", dark = false }) {
  const widths = ["w-full", "w-full", "w-4/5", "w-3/5"]

  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} dark={dark} className={`h-3 rounded-md ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-setu-stone/15 bg-white ${className}`}>
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-5 w-2/3 rounded-md" />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}
