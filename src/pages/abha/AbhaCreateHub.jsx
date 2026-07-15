import { useNavigate } from "react-router-dom"
import { ChevronRight, Fingerprint, Hash, Smartphone } from "lucide-react"
import { AbhaShell } from "./AbhaShell"

const OPTIONS = [
  {
    to: "/app/abha/create/aadhaar",
    title: "Create using Aadhaar",
    hint: "New ABHA via Aadhaar OTP",
    icon: Fingerprint,
  },
  {
    to: "/app/abha/create/abha-number",
    title: "Create with ABHA number",
    hint: "Already have a 14-digit ABHA number",
    icon: Hash,
  },
  {
    to: "/app/abha/create/mobile",
    title: "Create with mobile",
    hint: "Register using mobile number",
    icon: Smartphone,
  },
]

export default function AbhaCreateHub() {
  const navigate = useNavigate()

  return (
    <AbhaShell title="Creating My ABHA Address" backTo="/app/abha">
      <p className="mb-4 text-sm text-[#6B7289]">
        Choose how you want to create or enrol your ABHA address.
      </p>
      <div className="space-y-3">
        {OPTIONS.map(({ to, title, hint, icon: Icon }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#E2E5F0] bg-white px-4 py-3.5 text-left shadow-sm hover:border-[#2F387E]/35"
          >
            <span className="rounded-lg bg-[#EEF0FF] p-2.5 text-[#2F387E]">
              <Icon size={20} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-[#1A1F3C]">{title}</span>
              <span className="text-xs text-[#6B7289]">{hint}</span>
            </span>
            <ChevronRight size={18} className="text-[#9CA3AF]" />
          </button>
        ))}
      </div>
    </AbhaShell>
  )
}
