import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Search } from "lucide-react"
import {
  getLinkedRecords,
  getXAuthToken,
  getXToken,
  initiateDiscovery,
  searchFacilities,
  ABDM_HIU_ID,
  loadAbhaSession,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaFacilities() {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [q, setQ] = useState("")

  useEffect(() => {
    if (!getXToken()) {
      navigate("/app/abha/login", { replace: true })
      return
    }
    const auth = getXAuthToken()
    if (!auth) {
      setError("Auth token missing. Please login again.")
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await getLinkedRecords(auth)
        if (cancelled) return
        if (!res.success) throw new Error(res.error || "Failed to load facilities")
        const list =
          res.data?.patient?.links ||
          res.data?.links ||
          res.data?.data?.patient?.links ||
          []
        setFacilities(Array.isArray(list) ? list : [])
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load facilities")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const unique = useMemo(() => {
    const map = new Map()
    facilities.forEach((item) => {
      const id = item?.hip?.id || item?.hipId || item?.id
      if (id && !map.has(id)) map.set(id, item)
    })
    return [...map.values()].filter((item) =>
      String(item?.hip?.name || "")
        .toLowerCase()
        .includes(q.toLowerCase()),
    )
  }, [facilities, q])

  return (
    <AbhaShell
      title="Linked facilities"
      backTo="/app/abha/profile"
      rightAction={
        <Link to="/app/abha/facilities/link" className="text-xs font-semibold text-white">
          Link
        </Link>
      }
    >
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search facilities"
          className="w-full rounded-xl border border-[#E2E5F0] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2F387E]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#2F387E]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : unique.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D5D9E8] bg-white px-4 py-8 text-center">
          <p className="text-sm text-[#6B7289]">No linked facilities yet.</p>
          <Link
            to="/app/abha/facilities/link"
            className="mt-3 inline-block text-sm font-semibold text-[#2F387E]"
          >
            Link a facility
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {unique.map((item) => (
            <li
              key={item?.hip?.id || item?.id}
              className="rounded-xl border border-[#E2E5F0] bg-white px-4 py-3"
            >
              <p className="font-medium text-[#1A1F3C]">
                {item?.hip?.name || "Facility"}
              </p>
              <p className="text-xs text-[#6B7289]">{item?.hip?.id}</p>
              {Array.isArray(item?.careContexts) && (
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {item.careContexts.length} care context
                  {item.careContexts.length === 1 ? "" : "s"}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </AbhaShell>
  )
}

export function AbhaLinkFacility() {
  const navigate = useNavigate()
  const profile = loadAbhaSession()?.profile
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!getXToken()) navigate("/app/abha/login", { replace: true })
  }, [navigate])

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      return undefined
    }
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        const list = await searchFacilities(query.trim())
        if (!cancelled) setResults(Array.isArray(list) ? list : [])
      } catch (err) {
        if (!cancelled) setError(err.message || "Search failed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query])

  const startDiscover = async (facility) => {
    const auth = getXAuthToken()
    if (!auth) {
      setError("Auth token missing. Please login again.")
      return
    }
    setLinking(true)
    setError("")
    setMessage("")
    try {
      const hipId = facility?.identifier?.value || facility?.id || facility?.hipId
      const body = {
        hip: { id: hipId },
        patient: {
          id: profile?.abhaAddress,
          verifiedIdentifiers: [],
          unverifiedIdentifiers: [],
        },
      }
      await initiateDiscovery(body, auth, ABDM_HIU_ID)
      setMessage(
        `Discovery started for ${facility?.name || hipId}. Check linked facilities shortly.`,
      )
    } catch (err) {
      setError(err.message || "Discovery failed")
    } finally {
      setLinking(false)
    }
  }

  return (
    <AbhaShell title="Link facility" backTo="/app/abha/facilities">
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search health facility"
          className="w-full rounded-xl border border-[#E2E5F0] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#2F387E]"
        />
      </div>

      {message && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-[#2F387E]">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : (
        <ul className="space-y-2">
          {results.map((f) => {
            const id = f?.identifier?.value || f?.id
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-xl border border-[#E2E5F0] bg-white px-4 py-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1A1F3C]">
                    {f?.name || "Facility"}
                  </p>
                  <p className="text-xs text-[#6B7289]">{id}</p>
                </div>
                <button
                  type="button"
                  disabled={linking}
                  onClick={() => startDiscover(f)}
                  className="rounded-lg bg-[#2F387E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Discover
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </AbhaShell>
  )
}
