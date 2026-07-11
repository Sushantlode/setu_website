import { Skeleton, SkeletonText } from "./Skeleton"

/** Full-screen session boot while AuthContext validates. */
export function AppBootSkeleton() {
  return (
    <div
      className="flex min-h-svh flex-col bg-[#F7FAFF]"
      aria-busy="true"
      aria-label="Loading SETU app"
    >
      <div className="h-16 bg-setu-charcoal px-4 sm:px-6">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3">
          <Skeleton dark className="h-8 w-20 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton dark className="h-3 w-28 rounded-md" />
            <Skeleton dark className="h-2.5 w-36 rounded-md" />
          </div>
          <Skeleton dark className="h-9 w-9 rounded-full sm:w-24" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 lg:px-8">
        <Skeleton app className="mb-2 h-3 w-16 rounded-full" />
        <Skeleton app className="mb-5 h-8 w-48 rounded-xl sm:w-64" />
        <Skeleton app className="mb-5 h-36 w-full rounded-2xl sm:h-48" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton app className="h-16 w-16 rounded-2xl sm:h-20 sm:w-20" />
              <Skeleton app className="h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Dashboard while banners / extras load. */
export function DashboardSkeleton() {
  return (
    <main
      className="relative isolate min-h-full overflow-hidden bg-setu-cream"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <Skeleton app className="mb-7 h-36 w-full rounded-2xl sm:mb-8 sm:h-48 md:h-56" />

        <div className="mb-4 sm:mb-5">
          <Skeleton app className="h-4 w-20 rounded-md" />
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:mb-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2.5 rounded-2xl border border-setu-stone/30 bg-white/60 px-3 py-4 sm:min-h-[8.5rem]"
            >
              <Skeleton app className="h-14 w-14 rounded-2xl sm:h-16 sm:w-16" />
              <Skeleton app className="h-3 w-20 rounded-md" />
            </div>
          ))}
        </div>

        <Skeleton app className="mb-4 h-[4.5rem] w-full rounded-2xl sm:mb-5" />
        <Skeleton app className="h-44 w-full rounded-2xl" />
      </div>
    </main>
  )
}

/** Telemedicine home specialties / symptoms grid. */
export function TelemedicineHomeSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading telemedicine">
      <Skeleton app className="h-36 w-full rounded-2xl sm:h-44" />

      <section>
        <div className="mb-3 space-y-2">
          <Skeleton app className="h-6 w-36 rounded-lg" />
          <Skeleton app className="h-3 w-56 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#D2DEFF] bg-[#F7FAFF] px-3 py-4"
            >
              <Skeleton app className="mx-auto mb-2 h-10 w-10 rounded-full" />
              <Skeleton app className="mx-auto h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 space-y-2">
          <Skeleton app className="h-6 w-28 rounded-lg" />
          <Skeleton app className="h-3 w-48 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#D2DEFF] bg-white px-3 py-4"
            >
              <Skeleton app className="mx-auto mb-2 h-10 w-10 rounded-full" />
              <Skeleton app className="mx-auto h-3 w-14 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function DoctorCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#D2DEFF] bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Skeleton app className="h-16 w-16 shrink-0 rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <Skeleton app className="h-4 w-40 rounded-md" />
          <Skeleton app className="h-3 w-28 rounded-md" />
          <Skeleton app className="h-3 w-36 rounded-md" />
          <Skeleton app className="h-3 w-24 rounded-md" />
        </div>
      </div>
      <Skeleton app className="h-10 w-full rounded-full sm:w-24" />
    </div>
  )
}

export function DoctorListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading doctors">
      {Array.from({ length: count }).map((_, i) => (
        <DoctorCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DoctorDetailSkeleton() {
  return (
    <main
      className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading doctor"
    >
      <Skeleton app className="mb-5 h-4 w-28 rounded-md" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton app className="h-28 w-28 shrink-0 rounded-3xl sm:h-32 sm:w-32" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton app className="h-7 w-56 rounded-xl" />
          <Skeleton app className="h-4 w-36 rounded-md" />
          <SkeletonText lines={2} app className="max-w-md" />
          <div className="flex gap-2 pt-1">
            <Skeleton app className="h-6 w-16 rounded-full" />
            <Skeleton app className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-[#D2DEFF] bg-[#F7FAFF] p-4 sm:p-5">
        <Skeleton app className="mb-4 h-5 w-40 rounded-md" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} app className="h-16 w-[4.75rem] shrink-0 rounded-2xl" />
          ))}
        </div>
        <SlotSkeleton className="mt-5" />
      </section>
    </main>
  )
}

export function SlotSkeleton({ className = "" }) {
  return (
    <div className={`space-y-4 ${className}`} aria-busy="true" aria-label="Loading slots">
      {Array.from({ length: 3 }).map((_, group) => (
        <div key={group}>
          <Skeleton app className="mb-2 h-3 w-20 rounded-md" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 - group }).map((_, i) => (
              <Skeleton key={i} app className="h-9 w-20 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AppointmentListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading appointments">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#D2DEFF] bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton app className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton app className="h-4 w-40 rounded-md" />
              <Skeleton app className="h-3 w-28 rounded-md" />
              <Skeleton app className="h-3 w-48 rounded-md" />
            </div>
            <Skeleton app className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Reports home (Health Line) while tiles / banners load. */
export function ReportsHomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading reports">
      <div className="mb-6 space-y-2 text-center">
        <Skeleton app className="mx-auto h-4 w-40 rounded-md" />
        <Skeleton app className="mx-auto h-3 w-56 rounded-md" />
      </div>
      <Skeleton app className="mb-4 h-20 w-full rounded-2xl" />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#E6EEF5] bg-white p-4"
          >
            <Skeleton app className="mb-3 h-12 w-12 rounded-xl" />
            <Skeleton app className="mb-2 h-4 w-24 rounded-md" />
            <Skeleton app className="h-3 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton app className="h-20 w-full rounded-2xl" />
    </div>
  )
}

export function ReportListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#E6EEF5] bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton app className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton app className="h-4 w-40 rounded-md" />
              <Skeleton app className="h-3 w-28 rounded-md" />
            </div>
            <Skeleton app className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
