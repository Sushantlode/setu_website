import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  fetchSolhCategories,
  fetchSolhDetails,
  fetchSolhList,
  MENTAL_ACCENT,
  submitSolhAssessment,
} from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../components/ui/Toast"
import { MentalShell } from "./MentalShell"

/**
 * Solh self-assessment flow in one route tree:
 * /solh → categories
 * /solh/:categoryId → tests
 * /solh/test/:testId → disclaimer → questions → done
 */
export default function MentalSolh() {
  const { categoryId, testId } = useParams()
  const [search] = useSearchParams()
  const step = search.get("step") || (testId ? "disclaimer" : categoryId ? "list" : "categories")
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [tests, setTests] = useState([])
  const [categoryTitle, setCategoryTitle] = useState("")
  const [details, setDetails] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        if (!categoryId && !testId) {
          const data = await fetchSolhCategories(session)
          const list = data?.data || data?.categories || data || []
          if (!cancelled) setCategories(Array.isArray(list) ? list : [])
        } else if (categoryId && !testId) {
          const data = await fetchSolhList(categoryId, session)
          const list = data?.data?.testList || data?.testList || data?.data || []
          if (!cancelled) {
            setTests(Array.isArray(list) ? list : [])
            setCategoryTitle(
              data?.data?.testCategoryTitle || data?.testCategoryTitle || "Assessments",
            )
          }
        } else if (testId && (step === "disclaimer" || step === "quiz" || step === "done")) {
          const data = await fetchSolhDetails(testId, session)
          if (!cancelled) setDetails(data?.data || data)
        }
      } catch (err) {
        if (!cancelled) toast.error(err?.message || "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [categoryId, testId, step, session, toast])

  const questions = useMemo(() => {
    const raw =
      details?.questions ||
      details?.question ||
      details?.selfAssessmentQuestions ||
      []
    return Array.isArray(raw) ? raw : []
  }, [details])

  const current = questions[qIndex]
  const currentAnswers = Array.isArray(current?.answer)
    ? current.answer
    : Array.isArray(current?.answers)
      ? current.answers
      : []

  const startQuiz = () => {
    navigate(`/app/mental-health/solh/test/${testId}?step=quiz`, { replace: true })
  }

  const selectAnswer = (ans) => {
    const qid = current?._id || current?.id
    setAnswers((prev) => ({
      ...prev,
      [qid]: ans,
    }))
  }

  const nextQuestion = async () => {
    const qid = current?._id || current?.id
    if (!answers[qid]) {
      toast.error("Please select an answer")
      return
    }
    if (qIndex < questions.length - 1) {
      setQIndex((i) => i + 1)
      return
    }

    setSubmitting(true)
    try {
      const score = []
      const testData = []
      questions.forEach((q) => {
        const id = q._id || q.id
        const ans = answers[id]
        if (ans) {
          score.push(Number(ans.score) || 0)
          testData.push({
            questionId: id,
            answerId: ans._id || ans.id,
            score: Number(ans.score) || 0,
          })
        }
      })
      const payload = {
        score,
        testData,
        lectureId: details?.lectureId || "",
        courseId: details?.courseId || "",
        orderId: details?.orderId || "",
      }
      const res = await submitSolhAssessment(testId, payload, session)
      setResult(res?.data || res)
      navigate(`/app/mental-health/solh/test/${testId}?step=done`, { replace: true })
    } catch (err) {
      toast.error(err?.message || "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MentalShell title="Self Assessment" backTo="/app/mental-health/assessments">
        <div className="h-32 animate-pulse rounded-2xl bg-[#E5E7EB]" />
      </MentalShell>
    )
  }

  if (step === "done") {
    const total =
      Array.isArray(result?.score)
        ? result.score.reduce((a, b) => a + Number(b || 0), 0)
        : result?.totalScore ?? result?.score
    return (
      <MentalShell title="Assessment complete" backTo="/app/mental-health/assessments">
        <div className="rounded-2xl border border-[#D1FAE5] bg-white p-6 text-center">
          <p className="text-lg font-bold text-[#0F172A]">Submitted successfully</p>
          {total !== undefined && total !== null ? (
            <p className="mt-2 text-[#0F766E]">Total score: {total}</p>
          ) : null}
          <button
            type="button"
            onClick={() => navigate("/app/mental-health/assessments")}
            className="mt-6 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: MENTAL_ACCENT }}
          >
            Done
          </button>
        </div>
      </MentalShell>
    )
  }

  if (testId && step === "quiz") {
    const qid = current?._id || current?.id
    const selected = answers[qid]
    return (
      <MentalShell
        title={details?.title || "Quiz"}
        backTo={`/app/mental-health/solh/test/${testId}?step=disclaimer`}
      >
        <p className="mb-2 text-xs text-[#6B7280]">
          Question {qIndex + 1} of {questions.length}
        </p>
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="font-semibold text-[#0F172A]">{current?.question || current?.text}</p>
          <div className="mt-4 space-y-2">
            {currentAnswers.map((ans) => {
              const aid = ans._id || ans.id
              const isOn = (selected?._id || selected?.id) === aid
              return (
                <button
                  key={aid}
                  type="button"
                  onClick={() => selectAnswer(ans)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                    isOn
                      ? "border-[#0F766E] bg-[#ECFDF5] font-semibold text-[#0F766E]"
                      : "border-[#E5E7EB]"
                  }`}
                >
                  {ans.title || ans.text}
                </button>
              )
            })}
          </div>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={nextQuestion}
          className="mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          {submitting
            ? "Submitting…"
            : qIndex === questions.length - 1
              ? "Submit"
              : "Next"}
        </button>
      </MentalShell>
    )
  }

  if (testId && step === "disclaimer") {
    return (
      <MentalShell
        title="Before you begin"
        backTo={
          categoryId
            ? `/app/mental-health/solh/${categoryId}`
            : "/app/mental-health/solh"
        }
      >
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-sm leading-relaxed text-[#4B5563]">
          <p className="font-semibold text-[#0F172A]">
            {details?.title || "Self assessment disclaimer"}
          </p>
          <p className="mt-3">
            This assessment is for informational purposes and does not replace professional
            medical advice, diagnosis, or treatment. If you are in crisis, please seek
            emergency help immediately.
          </p>
          <p className="mt-3">
            Answer honestly based on how you have been feeling. Your responses are used to
            generate a wellness insight score.
          </p>
        </div>
        <button
          type="button"
          onClick={startQuiz}
          className="mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          I understand — continue
        </button>
      </MentalShell>
    )
  }

  if (categoryId) {
    return (
      <MentalShell title={categoryTitle || "Assessments"} backTo="/app/mental-health/solh">
        {tests.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No assessments in this category.</p>
        ) : (
          <ul className="space-y-3">
            {tests.map((t) => {
              const id = t._id || t.id || t.selfassessmentId
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/app/mental-health/solh/test/${id}?step=disclaimer`)
                    }
                    className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm hover:border-[#0F766E]/30"
                  >
                    <p className="font-semibold text-[#0F172A]">
                      {t.title || t.name || "Assessment"}
                    </p>
                    {t.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-[#6B7280]">{t.description}</p>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </MentalShell>
    )
  }

  return (
    <MentalShell title="Self Assessment" backTo="/app/mental-health/assessments">
      {categories.length === 0 ? (
        <p className="text-sm text-[#6B7280]">No categories available right now.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((cat, i) => {
            const id = cat._id || cat.id || cat.categoryId
            return (
              <button
                key={id || i}
                type="button"
                onClick={() => navigate(`/app/mental-health/solh/${id}`)}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left shadow-sm hover:border-[#0F766E]/30"
              >
                <p className="font-semibold text-[#0F172A]">{cat.title || cat.name}</p>
                {cat.description ? (
                  <p className="mt-1 text-xs text-[#6B7280]">{cat.description}</p>
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </MentalShell>
  )
}
