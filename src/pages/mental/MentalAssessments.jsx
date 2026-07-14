import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Camera, ChevronRight, Plus } from "lucide-react"
import { fetchAssessments, MENTAL_ACCENT } from "../../api/mental"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { MentalShell } from "./MentalShell"

export default function MentalAssessments() {
  const navigate = useNavigate()
  const { subject } = useMentalHealth()
  const [loading, setLoading] = useState(true)
  const [assessments, setAssessments] = useState([])
  const [error, setError] = useState("")
  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchAssessments()
        if (!cancelled) {
          setAssessments(list.filter((a) => a.status !== "inactive"))
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load assessments")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const featured = assessments.slice(0, 5)

  useEffect(() => {
    if (featured.length < 2) return undefined
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % featured.length)
    }, 4000)
    return () => clearInterval(t)
  }, [featured.length])

  const startAssessment = (id) => {
    navigate(`/app/mental-health/runner/${id}`)
  }

  const slide = featured[carouselIndex]

  return (
    <MentalShell
      title="Self Assessment"
      backTo="/app/mental-health"
      showHeaderActions
    >
      <p className="mb-1 text-sm text-[#6B7280]">
        {subject?.type === "proxy"
          ? `Checking in for ${subject.name || "someone else"}`
          : "Choose a check that fits how you’re feeling"}
      </p>

      {loading ? (
        <div className="mt-6 space-y-3">
          <div className="h-40 animate-pulse rounded-2xl bg-[#D1FAE5]/60" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#E5E7EB]" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          {/* Carousel */}
          {slide ? (
            <button
              type="button"
              onClick={() => startAssessment(slide.id)}
              className="relative mt-5 block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-[#D1FAE5]"
            >
              <div className="flex min-h-[140px] items-stretch">
                <div className="flex flex-1 flex-col justify-center p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0F766E]">
                    Featured
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#0F172A]">{slide.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#6B7280]">{slide.subTitle}</p>
                </div>
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt=""
                    className="hidden w-36 object-cover sm:block"
                  />
                ) : null}
              </div>
              {featured.length > 1 ? (
                <div className="absolute bottom-3 left-5 flex gap-1.5">
                  {featured.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === carouselIndex ? "w-4 bg-[#0F766E]" : "w-1.5 bg-[#0F766E]/30"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </button>
          ) : null}

          {/* Solh create card */}
          <Link
            to="/app/mental-health/solh"
            className="mt-4 flex items-center gap-4 rounded-2xl border border-dashed border-[#0F766E]/40 bg-white px-4 py-4 transition hover:bg-[#ECFDF5]"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: MENTAL_ACCENT }}
            >
              <Plus size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#0F172A]">Self Assessment</p>
              <p className="text-xs text-[#6B7280]">
                Explore guided Solh wellness categories and quizzes
              </p>
            </div>
            <ChevronRight size={18} className="text-[#9CA3AF]" />
          </Link>

          {/* Assessment cards */}
          <div className="mt-5 space-y-3">
            {assessments.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => startAssessment(item.id)}
                className="flex w-full items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-3 text-left shadow-sm transition hover:border-[#0F766E]/30"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#0F766E]">
                    <ClipboardIcon />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0F172A]">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[#6B7280]">{item.subTitle}</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-[#9CA3AF]" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Face scan FAB */}
      <button
        type="button"
        onClick={() => navigate("/app/mental-health/face-scan")}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg sm:bottom-8 sm:right-8"
        style={{ backgroundColor: MENTAL_ACCENT }}
        aria-label="Face scan"
        title="Face stress scan"
      >
        <Camera size={22} />
      </button>
    </MentalShell>
  )
}

function ClipboardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 4h6v2H9V4z" fill="currentColor" />
    </svg>
  )
}
