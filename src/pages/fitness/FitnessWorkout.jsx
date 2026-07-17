import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CalendarDays, Loader2 } from "lucide-react"
import {
  addWorkoutExercises,
  completeWorkoutDay,
  exerciseImage,
  fetchExercise,
  fetchExercises,
  fetchMuscles,
  fetchWorkoutToday,
  completeWorkoutBulk,
  todayIstKey,
} from "../../api/fitness"
import { FitnessShell } from "./FitnessShell"
import { FitnessGateLoader, useFitnessGate } from "./useFitnessGate"

export default function FitnessWorkout() {
  const { ready, auth } = useFitnessGate()
  const [muscles, setMuscles] = useState([])
  const [selected, setSelected] = useState("")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchMuscles(auth)
        if (cancelled) return
        const names = list
          .map((m) => (typeof m === "string" ? m : m.name || m.muscle || m.title))
          .filter(Boolean)
        setMuscles(names)
        setSelected(names[0] || "")
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load muscles")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, auth])

  useEffect(() => {
    if (!ready || !selected) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetchExercises(auth, { muscle: selected })
        if (!cancelled) setItems(res.items || [])
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load exercises")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, auth, selected])

  if (!ready) {
    return (
      <FitnessShell title="Workout">
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell
      title="Workout"
      rightAction={
        <Link
          to="/app/fitness/workout/daily"
          className="rounded-lg p-1.5 text-white/90 hover:bg-white/10"
        >
          <CalendarDays size={18} />
        </Link>
      }
    >
      <div className="touch-scroll -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {muscles.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setSelected(m)}
            className={`min-h-9 shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-semibold ${
              selected === m
                ? "bg-[#10B981] text-white"
                : "bg-white text-[#374151] ring-1 ring-[#E5E7EB]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">No exercises found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((ex) => {
            const id = ex.id || ex.exercise_id
            const name = ex.name || ex.exercise_name || "Exercise"
            return (
              <Link
                key={id}
                to={`/app/fitness/workout/${encodeURIComponent(id)}`}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
              >
                <img
                  src={exerciseImage(ex.image || ex.image_url || name)}
                  alt=""
                  className="h-36 w-full object-cover bg-[#ECFDF5]"
                />
                <div className="p-3">
                  <p className="font-semibold text-[#111827]">{name}</p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    {ex.equipment || ex.Equipment || selected}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </FitnessShell>
  )
}

export function FitnessExerciseDetail() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const { ready, auth } = useFitnessGate()
  const [ex, setEx] = useState(null)
  const [sets, setSets] = useState("3")
  const [reps, setReps] = useState("12")
  const [duration, setDuration] = useState("30")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready || !exerciseId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchExercise(auth, exerciseId)
        if (cancelled) return
        setEx(data)
        if (data?.Sets || data?.sets) setSets(String(data.Sets || data.sets))
        if (data?.Reps || data?.reps) setReps(String(data.Reps || data.reps))
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load exercise")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, auth, exerciseId])

  const addToToday = async () => {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const day = todayIstKey()
      await addWorkoutExercises(auth, day, [
        {
          exercise_id: String(exerciseId),
          order_index: 0,
          sets: Number(sets) || 3,
          reps: Number(reps) || 12,
          weight_kg: null,
          duration_seconds: Number(duration) || 30,
          notes: notes || null,
        },
      ])
      completeWorkoutDay(auth, day).catch(() => {})
      setMessage("Added to today’s workout")
      setTimeout(() => navigate("/app/fitness/workout/daily"), 600)
    } catch (err) {
      setError(err.message || "Failed to add exercise")
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <FitnessShell title="Exercise" backTo="/app/fitness/workout" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  const name = ex?.name || ex?.exercise_name || "Exercise"
  const video = ex?.video_url || ex?.video || ex?.VideoURL

  return (
    <FitnessShell title={name} backTo="/app/fitness/workout" showTabs={false}>
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error && !ex ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : (
        <div className="space-y-4">
          {video ? (
            <video
              controls
              className="w-full rounded-2xl bg-black"
              src={video}
              poster={exerciseImage(ex?.image || name)}
            />
          ) : (
            <img
              src={exerciseImage(ex?.image || ex?.image_url || name)}
              alt=""
              className="w-full rounded-2xl object-cover"
            />
          )}

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111827]">{name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
              {ex?.instructions || ex?.description || ex?.Instructions || ""}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Num label="Sets" value={sets} onChange={setSets} />
            <Num label="Reps" value={reps} onChange={setReps} />
            <Num label="Sec" value={duration} onChange={setDuration} />
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#10B981]"
            rows={2}
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
            disabled={saving}
            onClick={addToToday}
            className="w-full rounded-xl bg-[#10B981] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add to today’s workout"}
          </button>
        </div>
      )}
    </FitnessShell>
  )
}

function Num({ label, value, onChange }) {
  return (
    <label className="block rounded-xl border border-[#E5E7EB] bg-white p-3">
      <span className="text-xs text-[#6B7280]">{label}</span>
      <input
        className="mt-1 w-full bg-transparent text-lg font-semibold outline-none"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      />
    </label>
  )
}

export function FitnessDailyWorkout() {
  const { ready, auth } = useFitnessGate()
  const [day, setDay] = useState(todayIstKey())
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await fetchWorkoutToday(auth)
      const list =
        data?.exercises || data?.items || data?.data?.exercises || []
      setItems(Array.isArray(list) ? list : [])
      if (data?.day || data?.date) setDay(data.day || data.date)
    } catch (err) {
      setError(err.message || "Failed to load daily workout")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ready) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, auth?.token])

  const markAllComplete = async () => {
    setBusy(true)
    try {
      const ids = items
        .map((x) => x.id || x.item_id || x.exercise_id)
        .filter(Boolean)
      await completeWorkoutBulk(auth, day, {
        exercise_ids: ids,
        completed: true,
      }).catch(async () => {
        await completeWorkoutDay(auth, day)
      })
      await load()
    } catch (err) {
      setError(err.message || "Failed to complete")
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return (
      <FitnessShell title="Daily workout" backTo="/app/fitness/workout" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="Daily workout" backTo="/app/fitness/workout" showTabs={false}>
      <p className="mb-3 text-sm text-[#6B7280]">{day}</p>
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-4 py-8 text-center">
          <p className="text-sm text-[#6B7280]">No exercises for today.</p>
          <Link
            to="/app/fitness/workout"
            className="mt-3 inline-block text-sm font-semibold text-[#10B981]"
          >
            Browse workouts
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((ex) => (
              <li
                key={ex.id || ex.exercise_id}
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3"
              >
                <img
                  src={exerciseImage(ex.image || ex.exercise_name || ex.name)}
                  alt=""
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#111827]">
                    {ex.exercise_name || ex.name}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {ex.sets || "-"} sets · {ex.reps || "-"} reps
                    {ex.completed || ex.is_completed ? " · Done" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy}
            onClick={markAllComplete}
            className="mt-4 w-full rounded-xl bg-[#10B981] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Updating…" : "Mark day complete"}
          </button>
        </>
      )}
    </FitnessShell>
  )
}
