import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Users } from "lucide-react"
import { MENTAL_ACCENT, mentalAsset } from "../../api/mental"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { MentalShell } from "./MentalShell"

const RELATIONS = ["Parent", "Sibling", "Spouse", "Child", "Friend", "Other"]

export default function MentalSubject() {
  const navigate = useNavigate()
  const { setFlow } = useMentalHealth()
  const [proxyOpen, setProxyOpen] = useState(false)
  const [name, setName] = useState("")
  const [relation, setRelation] = useState("")
  const [age, setAge] = useState("")
  const [error, setError] = useState("")

  const continueSelf = () => {
    setFlow({ subject: { type: "self" } })
    navigate("/app/mental-health/assessments")
  }

  const continueProxy = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    const ageNum = Number(age)
    if (!trimmed) {
      setError("Please enter their name.")
      return
    }
    if (!relation) {
      setError("Please select a relation.")
      return
    }
    if (!age || Number.isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      setError("Age must be between 10 and 100.")
      return
    }
    setFlow({
      subject: {
        type: "proxy",
        name: trimmed,
        relation,
        ageRange: String(ageNum),
        createdAt: new Date().toISOString(),
      },
    })
    navigate("/app/mental-health/assessments")
  }

  return (
    <MentalShell title="Who is this for?" backTo="/app" showHeaderActions>
      <p className="mb-6 text-sm text-[#6B7280]">
        Personalize your wellness journey — take a check for yourself or someone you care about.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={continueSelf}
          className="overflow-hidden rounded-2xl border border-[#D1FAE5] bg-white text-left shadow-sm transition hover:border-[#0F766E]/40"
        >
          <div className="flex h-36 items-end justify-center bg-gradient-to-b from-[#ECFDF5] to-white pt-4">
            <img
              src={mentalAsset("Boy.png")}
              alt=""
              className="h-28 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
          <div className="px-4 pb-5 pt-2">
            <div className="flex items-center gap-2">
              <User size={18} style={{ color: MENTAL_ACCENT }} />
              <p className="font-semibold text-[#0F172A]">For me</p>
            </div>
            <p className="mt-1 text-xs text-[#6B7280]">Assess your own mental well-being</p>
            <span
              className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: MENTAL_ACCENT }}
            >
              Continue
            </span>
          </div>
        </button>

        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setProxyOpen((o) => !o)}
            className="w-full text-left"
          >
            <div className="flex h-36 items-end justify-center bg-gradient-to-b from-[#F0FDFA] to-white pt-4">
              <img
                src={mentalAsset("Both.png")}
                alt=""
                className="h-28 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            <div className="px-4 pb-3 pt-2">
              <div className="flex items-center gap-2">
                <Users size={18} style={{ color: MENTAL_ACCENT }} />
                <p className="font-semibold text-[#0F172A]">For someone else</p>
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">Help a family member or friend</p>
            </div>
          </button>

          {proxyOpen ? (
            <form onSubmit={continueProxy} className="border-t border-[#E5E7EB] px-4 py-4">
              <label className="block text-sm font-medium text-[#0F172A]">
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#0F766E]"
                />
              </label>
              <label className="mt-3 block text-sm font-medium text-[#0F172A]">
                Relation
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#0F766E]"
                >
                  <option value="">Select</option>
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-sm font-medium text-[#0F172A]">
                Age
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-[#0F766E]"
                />
              </label>
              {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                className="mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: MENTAL_ACCENT }}
              >
                Continue
              </button>
            </form>
          ) : (
            <div className="px-4 pb-5">
              <button
                type="button"
                onClick={() => setProxyOpen(true)}
                className="rounded-full border border-[#0F766E]/30 px-4 py-2 text-sm font-semibold text-[#0F766E]"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </MentalShell>
  )
}
