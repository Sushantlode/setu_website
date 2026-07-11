import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import {
  loadReportsHome,
  slugForTileRoute,
  reportAsset,
} from "../../api/reports"
import { ReportsHomeSkeleton } from "../../components/AppSkeleton"
import { ReportsShell } from "./ReportsShell"

export default function ReportsHome() {
  const [loading, setLoading] = useState(true)
  const [latestBanner, setLatestBanner] = useState(null)
  const [tiles, setTiles] = useState([])
  const [uploadBanner, setUploadBanner] = useState(null)
  const [lifestyleSlides, setLifestyleSlides] = useState([])
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await loadReportsHome()
        if (cancelled) return
        setLatestBanner(data.latestBanner)
        setTiles(data.tiles)
        setUploadBanner(data.uploadBanner)
        setLifestyleSlides(data.lifestyleSlides || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (lifestyleSlides.length < 2) return undefined
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % lifestyleSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [lifestyleSlides.length])

  const slide = lifestyleSlides[slideIndex]

  return (
    <ReportsShell
      title="Health Line"
      subtitle="Reports"
      backTo="/app"
    >
      {loading ? (
        <ReportsHomeSkeleton />
      ) : (
        <>
          <div className="mb-5 text-center">
            <p className="text-sm font-semibold text-[#0E1C2F]">
              Your health records in one place
            </p>
            <p className="mt-1 text-xs text-[#6C7A8C]">
              View labs, vitals, medications, and clinical notes
            </p>
          </div>

          <Link
            to="/app/reports/latest"
            className="mb-4 flex items-center gap-3 rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm transition hover:border-[#1E9BFF]/40"
          >
            <img
              src={latestBanner?.icon_url || reportAsset("latest_docs.png")}
              alt=""
              className="h-14 w-14 shrink-0 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#0E1C2F]">
                {latestBanner?.title || "Latest documents"}
              </p>
              <p className="text-sm text-[#6C7A8C]">
                {latestBanner?.subtitle ||
                  "Generate a complete medical summary"}
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-[#6C7A8C]" />
          </Link>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((item) => {
              const slug = slugForTileRoute(item.route)
              return (
                <Link
                  key={item.id ?? item.route ?? slug}
                  to={`/app/reports/${slug}`}
                  className="rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm transition hover:border-[#1E9BFF]/40"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="mb-3 h-12 w-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden"
                      }}
                    />
                  ) : (
                    <span className="mb-3 block h-12 w-12 rounded-xl bg-[#EEF7FF]" />
                  )}
                  <p className="text-sm font-semibold text-[#0E1C2F]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6C7A8C]">
                    {item.subtitle}
                  </p>
                </Link>
              )
            })}
          </div>

          <Link
            to="/app/reports/upload"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-[#E6EEF5] bg-white p-4 shadow-sm transition hover:border-[#1E9BFF]/40"
          >
            <img
              src={
                uploadBanner?.icon_url || reportAsset("upload_document.png")
              }
              alt=""
              className="h-14 w-14 shrink-0 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#0E1C2F]">
                {uploadBanner?.title || "Upload documents"}
              </p>
              <p className="text-sm text-[#6C7A8C]">
                {uploadBanner?.subtitle ||
                  "Add doctor notes and lab PDFs from the SETU app"}
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-[#6C7A8C]" />
          </Link>

          {slide ? (
            <div className="rounded-2xl border border-[#E6EEF5] bg-white p-5 text-center shadow-sm">
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt=""
                  className="mx-auto mb-3 h-24 w-full max-w-xs object-contain"
                />
              ) : null}
              <p className="text-base font-semibold text-[#0E1C2F]">
                {slide.title}
              </p>
              <p className="mt-2 text-sm text-[#6C7A8C]">{slide.subtitle}</p>
              {slide.route ? (
                <Link
                  to={`/app/reports/${slugForTileRoute(slide.route)}`}
                  className="mt-4 inline-flex rounded-lg bg-[#1E9BFF] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
                >
                  Open
                </Link>
              ) : null}
              {lifestyleSlides.length > 1 ? (
                <div className="mt-4 flex justify-center gap-1.5">
                  {lifestyleSlides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setSlideIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === slideIndex
                          ? "w-4 bg-[#1E9BFF]"
                          : "w-1.5 bg-[#C7D9E6]"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <Link
            to="/app/book-tests"
            className="mt-6 flex items-center justify-between rounded-2xl bg-[#1C39BB] px-5 py-4 text-white transition-opacity hover:opacity-95"
          >
            <div>
              <p className="font-medium">Need a new lab report?</p>
              <p className="text-sm text-white/75">
                Book a test and get digital results
              </p>
            </div>
            <ChevronRight size={18} />
          </Link>
        </>
      )}
    </ReportsShell>
  )
}
