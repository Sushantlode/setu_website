import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  bookConsultation,
  cancelConsultation,
  fetchConsultations,
  fetchDietitian,
  fetchDietitians,
  fetchMyDietPlans,
  fitnessImage,
  requestDietPlan,
} from "../../api/fitness"
import { FitnessShell } from "./FitnessShell"
import { FitnessGateLoader, useFitnessGate } from "./useFitnessGate"

export default function FitnessDietitians() {
  const { ready, auth } = useFitnessGate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    ;(async () => {
      try {
        setList(await fetchDietitians(auth))
      } catch (err) {
        setError(err.message || "Failed to load dietitians")
      } finally {
        setLoading(false)
      }
    })()
  }, [ready, auth])

  if (!ready) {
    return (
      <FitnessShell title="Dietitians" backTo="/app/fitness/food" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell
      title="Dietitians"
      backTo="/app/fitness/food"
      showTabs={false}
      rightAction={
        <Link to="/app/fitness/consultations" className="text-xs font-semibold text-white">
          Mine
        </Link>
      }
    >
      <div className="mb-4 flex gap-2">
        <Link
          to="/app/fitness/diet-plans"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#10B981] ring-1 ring-[#E5E7EB]"
        >
          My diet plans
        </Link>
        <Link
          to="/app/fitness/diet-plans/request"
          className="rounded-full bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Request plan
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : list.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">No dietitians found.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((d) => {
            const id = d.id || d.dietitian_id
            return (
              <li key={id}>
                <Link
                  to={`/app/fitness/dietitians/${encodeURIComponent(id)}`}
                  className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm"
                >
                  <img
                    src={fitnessImage(d.photo || d.image || d.avatar)}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover bg-[#ECFDF5]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#111827]">
                      {d.name || d.full_name}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {d.specialization || d.expertise || d.qualification || ""}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </FitnessShell>
  )
}

export function FitnessDietitianDetail() {
  const { dietitianId } = useParams()
  const navigate = useNavigate()
  const { ready, auth } = useFitnessGate()
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [notes, setNotes] = useState("")
  const [slot, setSlot] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!ready || !dietitianId) return
    ;(async () => {
      try {
        setD(await fetchDietitian(auth, dietitianId))
      } catch (err) {
        setError(err.message || "Failed to load dietitian")
      } finally {
        setLoading(false)
      }
    })()
  }, [ready, auth, dietitianId])

  const book = async () => {
    setBooking(true)
    setError("")
    setMessage("")
    try {
      await bookConsultation(auth, {
        dietitian_id: Number(dietitianId) || dietitianId,
        preferred_slot: slot || undefined,
        notes: notes || undefined,
      })
      setMessage("Consultation requested")
      setTimeout(() => navigate("/app/fitness/consultations"), 700)
    } catch (err) {
      setError(err.message || "Booking failed")
    } finally {
      setBooking(false)
    }
  }

  if (!ready) {
    return (
      <FitnessShell title="Dietitian" backTo="/app/fitness/dietitians" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell
      title={d?.name || "Dietitian"}
      backTo="/app/fitness/dietitians"
      showTabs={false}
    >
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src={fitnessImage(d?.photo || d?.image)}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <h2 className="text-lg font-semibold">{d?.name || d?.full_name}</h2>
                <p className="text-sm text-[#6B7280]">
                  {d?.specialization || d?.expertise || ""}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#4B5563]">
              {d?.bio || d?.about || d?.description || ""}
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Preferred slot</span>
            <input
              type="datetime-local"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#10B981]"
            />
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for dietitian"
            rows={3}
            className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#10B981]"
          />
          {message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={booking}
            onClick={book}
            className="w-full rounded-xl bg-[#10B981] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {booking ? "Booking…" : "Book consultation"}
          </button>
        </div>
      )}
    </FitnessShell>
  )
}

export function FitnessConsultations() {
  const { ready, auth } = useFitnessGate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      setItems(await fetchConsultations(auth))
    } catch (err) {
      setError(err.message || "Failed to load consultations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ready) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, auth?.token])

  if (!ready) {
    return (
      <FitnessShell title="My consultations" backTo="/app/fitness/dietitians" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="My consultations" backTo="/app/fitness/dietitians" showTabs={false}>
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">No consultations yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#111827]">
                    {c.dietitian_name || c.dietitian?.name || `Consultation #${c.id}`}
                  </p>
                  <p className="mt-1 text-xs capitalize text-[#6B7280]">
                    {c.status || "requested"}
                  </p>
                  {c.preferred_slot && (
                    <p className="mt-1 text-xs text-[#6B7280]">{c.preferred_slot}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await cancelConsultation(auth, c.id)
                    await load()
                  }}
                  className="text-xs font-semibold text-red-600"
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </FitnessShell>
  )
}

export function FitnessDietPlans() {
  const { ready, auth } = useFitnessGate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    ;(async () => {
      try {
        setPlans(await fetchMyDietPlans(auth))
      } catch (err) {
        setError(err.message || "Failed to load diet plans")
      } finally {
        setLoading(false)
      }
    })()
  }, [ready, auth])

  if (!ready) {
    return (
      <FitnessShell title="Diet plans" backTo="/app/fitness/dietitians" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell
      title="Diet plans"
      backTo="/app/fitness/dietitians"
      showTabs={false}
      rightAction={
        <Link
          to="/app/fitness/diet-plans/request"
          className="text-xs font-semibold text-white"
        >
          Request
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">No diet plan requests.</p>
      ) : (
        <ul className="space-y-3">
          {plans.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-[#111827]">
                {p.title || p.goal || `Request #${p.id}`}
              </p>
              <p className="mt-1 text-xs capitalize text-[#6B7280]">
                {p.status || "pending"}
              </p>
              {p.notes || p.description ? (
                <p className="mt-2 text-sm text-[#4B5563]">
                  {p.notes || p.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </FitnessShell>
  )
}

export function FitnessRequestDietPlan() {
  const navigate = useNavigate()
  const { ready, auth } = useFitnessGate()
  const [goal, setGoal] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await requestDietPlan(auth, { goal, notes })
      navigate("/app/fitness/diet-plans", { replace: true })
    } catch (err) {
      setError(err.message || "Failed to request diet plan")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <FitnessShell title="Request diet plan" backTo="/app/fitness/diet-plans" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="Request diet plan" backTo="/app/fitness/diet-plans" showTabs={false}>
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Goal</span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#10B981]"
            placeholder="e.g. Weight loss with vegetarian meals"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#10B981]"
            placeholder="Allergies, preferences, schedule…"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#10B981] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>
    </FitnessShell>
  )
}
