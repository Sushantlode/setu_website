import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  approveConsentRequest,
  denyConsentRequest,
  getAllConsentRequests,
  getXAuthToken,
  getXToken,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaConsents() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState("ALL")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async (filter = status) => {
    const xToken = getXToken()
    const auth = getXAuthToken()
    if (!xToken) {
      navigate("/app/abha/login", { replace: true })
      return
    }
    if (!auth) {
      setError("Auth token missing. Please login again.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await getAllConsentRequests(auth, 30, 0, filter)
      if (!res.success) throw new Error(res.error || "Failed to load consents")
      const list =
        res.data?.requests ||
        res.data?.consentRequests ||
        res.data?.data?.requests ||
        []
      setRequests(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || "Failed to load consents")
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load("ALL")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AbhaShell title="Consents" backTo="/app/abha/profile">
      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", "REQUESTED", "GRANTED", "DENIED", "EXPIRED"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s)
              load(s)
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              status === s
                ? "bg-[#2F387E] text-white"
                : "bg-white text-[#6B7289] ring-1 ring-[#E2E5F0]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#2F387E]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#D5D9E8] bg-white px-4 py-8 text-center text-sm text-[#6B7289]">
          No consent requests found.
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => {
            const id =
              req.requestId || req.id || req.consentRequestId || req.consentId
            return (
              <li key={id}>
                <Link
                  to={`/app/abha/consents/${encodeURIComponent(id)}`}
                  state={{ consent: req }}
                  className="block rounded-xl border border-[#E2E5F0] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#1A1F3C]">
                        {req.requester?.name ||
                          req.hiu?.name ||
                          req.hip?.name ||
                          "Consent request"}
                      </p>
                      <p className="mt-1 text-xs text-[#6B7289]">
                        {req.purpose?.text || req.purpose || "Health information"}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#EEF0FF] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#2F387E]">
                      {req.status || status}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </AbhaShell>
  )
}

export function AbhaConsentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const stateConsent = location.state?.consent || null
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const auth = getXAuthToken()

  const act = async (type) => {
    if (!auth || !id) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      if (type === "approve") {
        await approveConsentRequest(id, auth, {})
        setMessage("Consent approved")
      } else {
        await denyConsentRequest(id, "Not authorized", auth)
        setMessage("Consent denied")
      }
      setTimeout(() => navigate("/app/abha/consents"), 800)
    } catch (err) {
      setError(err.message || "Action failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AbhaShell title="Consent details" backTo="/app/abha/consents">
      <div className="rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm">
        <p className="text-sm text-[#6B7289]">Request ID</p>
        <p className="mt-1 break-all font-mono text-sm text-[#1A1F3C]">{id}</p>

        {stateConsent && (
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-[#F5F6FA] p-3 text-xs text-[#4B5168]">
            {JSON.stringify(stateConsent, null, 2)}
          </pre>
        )}

        {message && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => act("approve")}
            className="flex-1 rounded-xl bg-[#2F387E] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act("deny")}
            className="flex-1 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      </div>
    </AbhaShell>
  )
}

export function AbhaNotifications() {
  return <AbhaConsents />
}
