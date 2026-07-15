import { useNavigate } from "react-router-dom"
import { ChevronRight, IdCard, LogIn } from "lucide-react"
import { loadAbhaSession } from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

const BENEFITS = [
  {
    title: "Securely store all your health records",
    description:
      "Automatically receive and store medical records like lab reports, prescriptions and more from any Ayushman Bharat Digital Mission enlisted health facilities.",
  },
  {
    title: "Share seamlessly with doctors and health facilities",
    description:
      "Avoid long queues for medical services with instant register and instant share your health records with any doctor/facility using ABHA",
  },
]

export default function AbhaHub() {
  const navigate = useNavigate()
  const session = loadAbhaSession()

  const handleLogin = () => {
    if (session?.xToken) {
      navigate("/app/abha/profile")
      return
    }
    navigate("/app/abha/login")
  }

  return (
    <AbhaShell
      title="Abha"
      backTo="/app"
      maxWidth="max-w-xl"
    >
      <div className="overflow-hidden rounded-2xl border border-[#E2E5F0] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-[#EEF0F7] bg-[#F8F9FC] px-4 py-4 sm:px-5">
          <img
            src="https://d10pnqyli54qno.cloudfront.net/Dashboard/Setu_Logo.png"
            alt="SETU"
            className="h-9 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          <img
            src="https://d10pnqyli54qno.cloudfront.net/Dashboard/NHA.png"
            alt="National Health Authority"
            className="h-10 object-contain"
            onError={(e) => {
              e.currentTarget.src =
                "https://d10pnqyli54qno.cloudfront.net/Welcome_Screens/abha1.png"
            }}
          />
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#1A1F3C]">What is ABHA?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5B617A]">
              ABHA (Ayushman Bharat Health Account) is an initiative By Government of
              India to help access to any kind of medical Services at your fingertips.
            </p>
            <p className="mt-2 text-sm text-[#5B617A]">
              For more information:{" "}
              <a
                href="https://abdm.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[#2F387E] underline"
              >
                abdm.gov.in
              </a>
            </p>
          </div>

          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li
                key={b.title}
                className="rounded-xl border border-[#E8EAF2] bg-[#FAFBFF] p-4"
              >
                <p className="text-sm font-semibold text-[#1A1F3C]">{b.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#6B7289]">
                  {b.description}
                </p>
              </li>
            ))}
          </ul>

          <div className="grid gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate("/app/abha/create")}
              className="flex items-center gap-3 rounded-xl bg-[#2F387E] px-4 py-3.5 text-left text-white shadow-sm transition hover:bg-[#263066]"
            >
              <span className="rounded-lg bg-white/15 p-2">
                <IdCard size={20} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Create new ABHA</span>
                <span className="text-xs text-white/80">
                  Get your national health ID
                </span>
              </span>
              <ChevronRight size={18} className="opacity-80" />
            </button>

            <button
              type="button"
              onClick={handleLogin}
              className="flex items-center gap-3 rounded-xl border border-[#2F387E] bg-white px-4 py-3.5 text-left text-[#2F387E] shadow-sm transition hover:bg-[#F5F6FF]"
            >
              <span className="rounded-lg bg-[#EEF0FF] p-2">
                <LogIn size={20} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">
                  {session?.xToken ? "Continue to ABHA profile" : "Login existing ABHA"}
                </span>
                <span className="text-xs text-[#6B7289]">
                  Access records, consents & facilities
                </span>
              </span>
              <ChevronRight size={18} className="opacity-60" />
            </button>
          </div>
        </div>
      </div>
    </AbhaShell>
  )
}
