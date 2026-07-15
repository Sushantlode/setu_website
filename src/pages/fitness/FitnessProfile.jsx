import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, HelpCircle, Loader2, Pencil } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  fetchFitnessProfile,
  FITNESS_GOALS,
  updateFitnessProfile,
} from "../../api/fitness"
import { FitnessShell } from "./FitnessShell"
import { FitnessGateLoader, useFitnessGate } from "./useFitnessGate"

const FAQS = [
  {
    q: "How do I track steps on the website?",
    a: "Browser devices don’t have the app pedometer. Enter steps manually on the Fitness Home screen for each day.",
  },
  {
    q: "Where are my workouts saved?",
    a: "Exercises you add are stored in your daily workout list for that IST calendar day. Open Daily Workout from the Workout tab.",
  },
  {
    q: "Can I change my fitness goal later?",
    a: "Yes. Open Profile → Edit profile and update goal, height, weight, or duration.",
  },
  {
    q: "How do dietitian consultations work?",
    a: "Browse dietitians from the Food hub, open a profile, pick a preferred slot, and book. Track requests under My consultations.",
  },
]

export default function FitnessProfile() {
  const { session } = useAuth()
  const { ready, auth } = useFitnessGate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    ;(async () => {
      try {
        setProfile(await fetchFitnessProfile(auth))
      } catch (err) {
        setError(err.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    })()
  }, [ready, auth])

  const goalLabel =
    FITNESS_GOALS.find((g) => g.value === profile?.goal)?.label ||
    profile?.goal ||
    "—"

  if (!ready) {
    return (
      <FitnessShell title="Profile">
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="Profile" backTo="/app">
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : (
        <>
          <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#111827]">
                  {profile?.name || session?.name || "Fitness user"}
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {session?.mobile || session?.phone || ""}
                </p>
              </div>
              <Link
                to="/app/fitness/profile/edit"
                className="rounded-lg bg-[#ECFDF5] p-2 text-[#10B981]"
              >
                <Pencil size={16} />
              </Link>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Item label="Age" value={profile?.age} />
              <Item label="Gender" value={profile?.gender} />
              <Item label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "—"} />
              <Item label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : "—"} />
              <Item label="Goal" value={goalLabel} />
              <Item
                label="Duration"
                value={
                  profile?.goal_duration_weeks
                    ? `${profile.goal_duration_weeks} weeks`
                    : "—"
                }
              />
            </dl>
          </div>

          <div className="space-y-2">
            <Menu to="/app/fitness/food/water" label="Water tracker" />
            <Menu to="/app/fitness/workout/daily" label="Daily workout" />
            <Menu to="/app/fitness/consultations" label="My consultations" />
            <Menu to="/app/fitness/diet-plans" label="Diet plans" />
            <Menu to="/app/fitness/faqs" label="FAQs" icon={HelpCircle} />
          </div>
        </>
      )}
    </FitnessShell>
  )
}

function Item({ label, value }) {
  return (
    <div className="rounded-xl bg-[#F9FAFB] px-3 py-2">
      <dt className="text-[11px] text-[#6B7280]">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize text-[#111827]">
        {value ?? "—"}
      </dd>
    </div>
  )
}

function Menu({ to, label, icon: Icon = ChevronRight }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-medium text-[#111827] shadow-sm"
    >
      {label}
      <Icon size={16} className="text-[#9CA3AF]" />
    </Link>
  )
}

export function FitnessProfileEdit() {
  const navigate = useNavigate()
  const { ready, auth } = useFitnessGate()
  const [form, setForm] = useState({
    name: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    gender: "male",
    goal: "weight_loss",
    goal_duration_weeks: "12",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    ;(async () => {
      try {
        const p = await fetchFitnessProfile(auth)
        if (p) {
          setForm({
            name: p.name || "",
            age: String(p.age || ""),
            height_cm: String(p.height_cm || ""),
            weight_kg: String(p.weight_kg || ""),
            gender: p.gender || "male",
            goal: p.goal || "weight_loss",
            goal_duration_weeks: String(p.goal_duration_weeks || "12"),
          })
        }
      } catch (err) {
        setError(err.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    })()
  }, [ready, auth])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      await updateFitnessProfile(
        {
          name: form.name.trim(),
          age: Number(form.age),
          height_cm: Number(form.height_cm),
          weight_kg: Number(Number(form.weight_kg).toFixed(2)),
          gender: form.gender,
          goal: form.goal,
          goal_duration_weeks: Number(form.goal_duration_weeks),
        },
        auth,
      )
      navigate("/app/fitness/profile", { replace: true })
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <FitnessShell title="Edit profile" backTo="/app/fitness/profile" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="Edit profile" backTo="/app/fitness/profile" showTabs={false}>
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <form
          onSubmit={save}
          className="space-y-3 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
        >
          {[
            ["name", "Name"],
            ["age", "Age"],
            ["height_cm", "Height (cm)"],
            ["weight_kg", "Weight (kg)"],
            ["goal_duration_weeks", "Goal duration (weeks)"],
          ].map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-sm font-medium">{label}</span>
              <input
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#10B981]"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-sm font-medium">Gender</span>
            <select
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Goal</span>
            <select
              className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
            >
              {FITNESS_GOALS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#10B981] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </FitnessShell>
  )
}

export function FitnessFaqs() {
  return (
    <FitnessShell title="FAQs" backTo="/app/fitness/profile" showTabs={false}>
      <ul className="space-y-3">
        {FAQS.map((f) => (
          <li
            key={f.q}
            className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
          >
            <p className="font-semibold text-[#111827]">{f.q}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">{f.a}</p>
          </li>
        ))}
      </ul>
    </FitnessShell>
  )
}
