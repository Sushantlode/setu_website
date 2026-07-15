import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, Fingerprint, Hash, MapPin, Smartphone } from "lucide-react"
import { AbhaShell } from "./AbhaShell"

const OPTIONS = [
  {
    to: "/app/abha/login/aadhaar",
    title: "Aadhaar Number",
    icon: Fingerprint,
  },
  {
    to: "/app/abha/login/mobile",
    title: "Mobile Number",
    icon: Smartphone,
  },
  {
    to: "/app/abha/login/address",
    title: "ABHA Address",
    icon: MapPin,
  },
  {
    to: "/app/abha/login/number",
    title: "ABHA Number",
    icon: Hash,
  },
]

export default function AbhaLoginOptions() {
  const navigate = useNavigate()

  return (
    <AbhaShell title="Login existing ABHA" backTo="/app/abha">
      <div className="mb-6 text-center">
        <img
          src="https://d10pnqyli54qno.cloudfront.net/Dashboard/Aabha.png"
          alt="ABHA"
          className="mx-auto h-16 w-16 object-contain"
        />
        <h2 className="mt-3 text-lg font-semibold text-[#1A1F3C]">Login with ABHA</h2>
        <p className="mt-1 text-sm text-[#6B7289]">Choose a login method to continue</p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map(({ to, title, icon: Icon }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#E2E5F0] bg-white px-4 py-3.5 text-left shadow-sm transition hover:border-[#2F387E]/40 hover:bg-[#FAFBFF]"
          >
            <span className="rounded-lg bg-[#EEF0FF] p-2.5 text-[#2F387E]">
              <Icon size={20} />
            </span>
            <span className="flex-1 font-medium text-[#1A1F3C]">{title}</span>
            <ChevronRight size={18} className="text-[#9CA3AF]" />
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-[#6B7289]">
        Don&apos;t have ABHA?{" "}
        <Link to="/app/abha/create/aadhaar" className="font-semibold text-[#2F387E]">
          Create one
        </Link>
      </p>
    </AbhaShell>
  )
}
