import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  fetchAssessmentById,
  MENTAL_ACCENT,
  sortOptions,
  sortQuestions,
  submitAssessment,
} from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { useToast } from "../../components/ui/Toast"
import { MentalShell } from "./MentalShell"

export default function MentalRunner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { subject, setFlow } = useMentalHealth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchAssessmentById(id)
        if (!cancelled) setAssessment(data)
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load assessment")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const questions = useMemo(() => sortQuestions(assessment), [assessment])
  const current = questions[index]
  const options = useMemo(() => sortOptions(current?.options), [current])
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0
  const selected = current ? answers[current.id] : undefined

  const handleSelect = (option) => {
    if (!current) return
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { questionId: current.id, value: option.value, optionId: option.id },
    }))
  }

  const handleNext = async () => {
    if (!current || selected === undefined) {
      toast.error("Please select an answer")
      return
    }
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      return
    }

    setSubmitting(true)
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id]?.value,
      }))
      const result = await submitAssessment(id, payload, subject || { type: "self" }, session)
      setFlow({
        lastResult: {
          ...result,
          assessmentTitle: assessment?.title,
          assessmentId: assessment?.id,
          scoreBands: assessment?.scoreBands || [],
        },
      })
      navigate("/app/mental-health/results", { replace: true })
    } catch (err) {
      toast.error(err?.message || "Failed to submit assessment")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MentalShell title="Assessment" backTo="/app/mental-health/assessments">
        <div className="h-40 animate-pulse rounded-2xl bg-[#E5E7EB]" />
      </MentalShell>
    )
  }

  if (error || !assessment) {
    return (
      <MentalShell title="Assessment" backTo="/app/mental-health/assessments">
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
          {error || "Assessment not found"}
        </p>
      </MentalShell>
    )
  }

  return (
    <MentalShell title={assessment.title} backTo="/app/mental-health/assessments">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-[#6B7280]">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: MENTAL_ACCENT }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <p className="text-base font-semibold leading-relaxed text-[#0F172A] sm:text-lg">
          {current?.text}
        </p>

        <div className="mt-5 space-y-2">
          {options.map((opt) => {
            const isSelected = selected?.optionId === opt.id || selected?.value === opt.value
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`flex w-full items-center rounded-xl border px-4 py-3 text-left text-sm transition ${
                  isSelected
                    ? "border-[#0F766E] bg-[#ECFDF5] font-semibold text-[#0F766E]"
                    : "border-[#E5E7EB] bg-white text-[#0F172A] hover:border-[#0F766E]/40"
                }`}
              >
                {opt.text}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={index === 0 || submitting}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="rounded-full border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#0F172A] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={submitting || selected === undefined}
          onClick={handleNext}
          className="flex-1 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          {submitting
            ? "Submitting…"
            : index === questions.length - 1
              ? "Submit"
              : "Next"}
        </button>
      </div>
    </MentalShell>
  )
}
