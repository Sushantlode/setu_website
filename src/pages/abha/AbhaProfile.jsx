import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  Loader2,
  LogOut,
  QrCode,
  Shield,
} from "lucide-react"
import {
  clearAbhaSession,
  getAllConsentRequests,
  getLinkedRecords,
  getPhrAppLoginProfile,
  getXAuthToken,
  getXToken,
  loadAbhaSession,
  logoutAbhaUser,
  saveAbhaSession,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaProfile() {
  const navigate = useNavigate()
  const session = loadAbhaSession()
  const [profile, setProfile] = useState(session?.profile || null)
  const [facilities, setFacilities] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [soonMsg, setSoonMsg] = useState("")

  const xToken = getXToken()
  const xAuthToken = getXAuthToken()

  useEffect(() => {
    if (!xToken) {
      navigate("/app/abha/login", { replace: true })
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const phr = await getPhrAppLoginProfile(xToken)
        if (!cancelled && phr.success && phr.data) {
          const nextProfile = {
            ...(session?.profile || {}),
            ...phr.data,
            fullName: phr.data.fullName || phr.data.name || session?.profile?.fullName,
          }
          setProfile(nextProfile)
          saveAbhaSession({ profile: nextProfile })
        }

        if (xAuthToken) {
          const [links, consents] = await Promise.all([
            getLinkedRecords(xAuthToken),
            getAllConsentRequests(xAuthToken, 20, 0, "REQUESTED"),
          ])
          if (cancelled) return

          const linkList =
            links?.data?.patient?.links ||
            links?.data?.links ||
            links?.data?.data?.patient?.links ||
            []
          setFacilities(Array.isArray(linkList) ? linkList : [])

          const requests =
            consents?.data?.requests ||
            consents?.data?.consentRequests ||
            consents?.data?.data?.requests ||
            []
          setPendingCount(Array.isArray(requests) ? requests.length : 0)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load profile")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xToken, xAuthToken, navigate])

  const uniqueFacilities = useMemo(() => {
    const map = new Map()
    facilities.forEach((item) => {
      const id = item?.hip?.id || item?.hipId || item?.id
      if (id && !map.has(id)) map.set(id, item)
    })
    return [...map.values()]
  }, [facilities])

  const handleLogout = async () => {
    await logoutAbhaUser(xToken, xAuthToken)
    clearAbhaSession()
    navigate("/app/abha", { replace: true })
  }

  if (!xToken) return null

  return (
    <AbhaShell
      title="My ABHA"
      backTo="/app/abha"
      rightAction={
        <Link
          to="/app/abha/notifications"
          className="relative rounded-lg p-1.5 text-white/90 hover:bg-white/10"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </Link>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16 text-[#2F387E]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#2F387E] to-[#4A54A0] p-5 text-white shadow-sm">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Ayushman Bharat Health Account
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {profile?.fullName || profile?.name || "ABHA user"}
            </h2>
            <p className="mt-1 text-sm text-white/85">
              {profile?.abhaAddress || "—"}
            </p>
            <p className="mt-0.5 font-mono text-xs text-white/70">
              {profile?.abhaNumber || ""}
            </p>
            {profile?.kycStatus && (
              <span className="mt-3 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs">
                KYC: {profile.kycStatus}
              </span>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NavTile
              to="/app/abha/consents"
              icon={Shield}
              label="Consents"
              hint={pendingCount ? `${pendingCount} pending` : "Manage access"}
            />
            <NavTile
              to="/app/abha/facilities"
              icon={Building2}
              label="Facilities"
              hint={`${uniqueFacilities.length} linked`}
            />
            <NavTile to="/app/abha/phr-card" icon={CreditCard} label="PHR card" />
            <NavTile to="/app/abha/qr" icon={QrCode} label="QR / Share" />
            <button
              type="button"
              onClick={() => setSoonMsg("Health Locker is coming soon.")}
              className="rounded-xl border border-[#E2E5F0] bg-white p-4 text-left shadow-sm"
            >
              <FileText className="text-[#2F387E]" size={20} />
              <p className="mt-2 text-sm font-semibold text-[#1A1F3C]">Health locker</p>
              <p className="text-xs text-[#6B7289]">Coming soon</p>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-red-100 bg-white p-4 text-left shadow-sm"
            >
              <LogOut className="text-red-600" size={20} />
              <p className="mt-2 text-sm font-semibold text-[#1A1F3C]">Logout</p>
              <p className="text-xs text-[#6B7289]">Clear ABHA session</p>
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1A1F3C]">
                Linked facilities
              </h3>
              <Link
                to="/app/abha/facilities/link"
                className="text-xs font-semibold text-[#2F387E]"
              >
                Link new
              </Link>
            </div>
            {uniqueFacilities.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#D5D9E8] bg-white px-4 py-6 text-center text-sm text-[#6B7289]">
                No facilities linked yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {uniqueFacilities.slice(0, 5).map((item) => (
                  <li
                    key={item?.hip?.id || item?.id}
                    className="rounded-xl border border-[#E2E5F0] bg-white px-4 py-3"
                  >
                    <p className="text-sm font-medium text-[#1A1F3C]">
                      {item?.hip?.name || item?.hipName || "Facility"}
                    </p>
                    <p className="text-xs text-[#6B7289]">
                      {item?.hip?.id || item?.hipId || ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {soonMsg && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl">
                <p className="text-sm text-[#1A1F3C]">{soonMsg}</p>
                <button
                  type="button"
                  onClick={() => setSoonMsg("")}
                  className="mt-4 rounded-xl bg-[#2F387E] px-5 py-2 text-sm font-semibold text-white"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AbhaShell>
  )
}

function NavTile({ to, icon: Icon, label, hint }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-[#E2E5F0] bg-white p-4 shadow-sm transition hover:border-[#2F387E]/35"
    >
      <Icon className="text-[#2F387E]" size={20} />
      <p className="mt-2 text-sm font-semibold text-[#1A1F3C]">{label}</p>
      {hint ? <p className="text-xs text-[#6B7289]">{hint}</p> : null}
    </Link>
  )
}
