import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  createFitnessProfile,
  FITNESS_GOALS,
  FITNESS_PRIMARY,
} from "../../api/fitness"
import { FitnessShell } from "./FitnessShell"

export default function FitnessOnboarding() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }

  const [name, setName] = useState(session?.name || "")
  const [age, setAge] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [gender, setGender] = useState("male")
  const [goal, setGoal] = useState("weight_loss")
  const [weeks, setWeeks] = useState("12")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const minWeeks = useMemo(() => {
    return FITNESS_GOALS.find((g) => g.value === goal)?.minWeeks || 10
  }, [goal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const ageN = Number(age)
    const h = Number(heightCm)
    const w = Number(weightKg)
    const dur = Number(weeks)

    if (!name.trim()) return setError("Name is required.")
    if (!ageN || ageN < 16 || ageN > 100) {
      return setError("Age must be between 16 and 100 years.")
    }
    if (!h || h < 100 || h > 250) {
      return setError("Height must be between 100 and 250 cm.")
    }
    if (!w || w < 20 || w > 300) {
      return setError("Weight must be between 20 and 300 kg.")
    }
    if (!dur || dur < minWeeks || dur > 104) {
      return setError(`Goal duration must be between ${minWeeks} and 104 weeks.`)
    }

    setLoading(true)
    try {
      await createFitnessProfile(
        {
          name: name.trim(),
          height_cm: h,
          weight_kg: Number(w.toFixed(2)),
          age: ageN,
          gender,
          goal,
          goal_duration_weeks: dur,
        },
        auth,
      )
      navigate("/app/fitness/home", { replace: true })
    } catch (err) {
      setError(err.message || "Failed to save profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FitnessShell
      title="Create fitness profile"
      backTo="/app"
      showTabs={false}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
      >
        <Field label="Name">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input
              className="input"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="years"
            />
          </Field>
          <Field label="Gender">
            <select
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (cm)">
            <input
              className="input"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="170"
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              className="input"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="70"
            />
          </Field>
        </div>
        <Field label="Fitness goal">
          <select
            className="input"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            {FITNESS_GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Goal duration (weeks, min ${minWeeks})`}>
          <input
            className="input"
            inputMode="numeric"
            value={weeks}
            onChange={(e) => setWeeks(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: FITNESS_PRIMARY }}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #E5E7EB;
          padding: 0.7rem 0.85rem;
          font-size: 0.95rem;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: #10B981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
      `}</style>
    </FitnessShell>
  )
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[#111827]">{label}</span>
      {children}
    </label>
  )
}
