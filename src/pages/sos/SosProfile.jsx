import { Link } from "react-router-dom"
import { User } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { SosShell } from "./SosShell"

export default function SosProfile() {
  const { session } = useAuth()
  const displayName =
    [session?.first_name, session?.username].filter(Boolean).join(" ").trim() ||
    "Your profile"

  return (
    <SosShell title="Personal Profile" backTo="/app/sos">
      <div className="rounded-xl border border-[#E9EBEF] bg-[#F7F7F9] p-6 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#1C1C1C]">
          <User size={28} />
        </span>
        <p className="text-lg font-semibold text-[#1C1C1C]">{displayName}</p>
        {session?.mobile ? (
          <p className="mt-1 text-sm text-[#6B7280]">+91 {session.mobile}</p>
        ) : null}
        {session?.uhid ? (
          <p className="mt-1 text-xs text-[#6B7280]">UHID {session.uhid}</p>
        ) : null}
        <p className="mx-auto mt-4 max-w-sm text-sm text-[#6B7280]">
          Full SOS health profile (blood group, allergies, wallet plan) is managed in the
          SETU mobile app. Your account details above are synced from login.
        </p>
        <Link
          to="/app/sos/contacts"
          className="mt-5 inline-flex rounded-xl bg-[#1C39BB] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
        >
          Manage emergency contacts
        </Link>
      </div>
    </SosShell>
  )
}
