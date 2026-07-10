import { Skeleton, SkeletonCard, SkeletonText } from "./Skeleton"

function SectionHeading() {
  return (
    <div className="max-w-2xl space-y-3">
      <Skeleton className="h-3 w-28 rounded-full" />
      <Skeleton className="h-10 w-full max-w-lg rounded-xl" />
      <Skeleton className="h-10 w-4/5 max-w-md rounded-xl" />
      <SkeletonText lines={2} className="max-w-xl" />
    </div>
  )
}

export default function PageSkeleton() {
  return (
    <div className="min-h-svh bg-setu-cream" aria-busy="true" aria-label="Loading SETU website">
      <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <Skeleton className="h-14 w-full max-w-4xl rounded-full" />
      </div>

      <main>
        <section className="relative min-h-screen bg-setu-teal-deep">
          <Skeleton className="absolute inset-0 rounded-none" dark />
          <div className="absolute inset-0 bg-setu-charcoal/40" />
          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-6 pb-28 pt-36 lg:px-8">
            <div className="max-w-3xl space-y-5">
              <Skeleton className="h-3 w-36 rounded-full" dark />
              <Skeleton className="h-12 w-full rounded-xl" dark />
              <Skeleton className="h-12 w-5/6 rounded-xl" dark />
              <SkeletonText lines={2} className="max-w-xl" dark />
              <div className="flex gap-4 pt-2">
                <Skeleton className="h-11 w-36 rounded-full" dark />
                <Skeleton className="h-11 w-44 rounded-full" dark />
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-16 pb-20 lg:-mt-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="rounded-3xl border border-setu-stone/15 bg-white p-8 sm:p-12">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3 text-center lg:text-left">
                    <Skeleton className="mx-auto h-10 w-24 rounded-lg lg:mx-0" />
                    <Skeleton className="mx-auto h-4 w-32 rounded-md lg:mx-0" />
                    <Skeleton className="mx-auto h-3 w-28 rounded-md lg:mx-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24 lg:pb-32">
          <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
            <SectionHeading />
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
              <SkeletonCard className="min-h-[380px]" />
            </div>
          </div>
        </section>

        <section className="bg-setu-teal-deep py-24 lg:py-32">
          <div className="mx-auto max-w-7xl space-y-16 px-6 lg:px-8">
            <div className="max-w-2xl space-y-3">
              <Skeleton className="h-3 w-24 rounded-full" dark />
              <Skeleton className="h-10 w-full max-w-md rounded-xl" dark />
              <SkeletonText lines={2} dark />
            </div>
            <div className="grid gap-8 lg:grid-cols-5">
              <Skeleton className="aspect-[4/3] rounded-3xl lg:col-span-3 lg:min-h-[480px]" dark />
              <Skeleton className="rounded-3xl lg:col-span-2 lg:min-h-[480px]" dark />
            </div>
          </div>
        </section>

        <Skeleton className="aspect-[21/9] w-full rounded-none" />

        <section className="py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:px-8">
            <SectionHeading />
            <Skeleton className="min-h-[420px] rounded-3xl" />
          </div>
        </section>

        <section className="bg-setu-sand/50 py-24 lg:py-32">
          <div className="mx-auto max-w-7xl space-y-10 px-6 lg:px-8">
            <SectionHeading />
            <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
            <div className="grid gap-6 sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </section>

        <section className="py-24 lg:py-32">
          <div className="mx-auto max-w-7xl space-y-10 px-6 lg:px-8">
            <SectionHeading />
            <div className="grid gap-6 md:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </section>

        <section className="bg-setu-teal-deep py-24 lg:py-32">
          <div className="mx-auto max-w-3xl space-y-8 px-6 text-center lg:px-8">
            <Skeleton className="mx-auto h-10 w-64 rounded-xl" dark />
            <SkeletonText lines={3} className="mx-auto max-w-xl" dark />
            <Skeleton className="mx-auto h-11 w-40 rounded-full" dark />
          </div>
        </section>

        <section className="py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">
            <SectionHeading />
            <div className="space-y-4 rounded-3xl border border-setu-stone/15 bg-white p-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-setu-stone/20 bg-setu-teal-deep py-12">
        <div className="mx-auto max-w-7xl space-y-8 px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-24 rounded-md" dark />
                <SkeletonText lines={3} dark />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
