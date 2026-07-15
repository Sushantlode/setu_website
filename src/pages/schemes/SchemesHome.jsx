import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Building2,
  Landmark,
  Loader2,
  Search,
  Sparkles,
  Heart,
  X,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  fetchMyschemeSearches,
  fetchSchemesList,
  filterSchemesByFirstWord,
  SCHEMES_PRIMARY,
} from "../../api/schemes"
import { SchemesShell, SchemeCard } from "./SchemesShell"

let schemesSearchCache = null
let schemesSearchFetchPromise = null

async function fetchAllSchemesForSearch() {
  if (schemesSearchCache) return schemesSearchCache
  if (schemesSearchFetchPromise) return schemesSearchFetchPromise

  schemesSearchFetchPromise = Promise.all([
    fetchSchemesList({ schemeType: "central", limit: 50000 }),
    fetchSchemesList({ schemeType: "state", limit: 50000 }),
  ])
    .then(([central, state]) => {
      schemesSearchCache = [...central, ...state]
      schemesSearchFetchPromise = null
      return schemesSearchCache
    })
    .catch((err) => {
      schemesSearchFetchPromise = null
      throw err
    })

  return schemesSearchFetchPromise
}

const TILES = [
  {
    to: "/app/govt-schemes/central",
    title: "Central Schemes",
    subtitle: "Browse by category",
    icon: Landmark,
    color: "#1F4B99",
  },
  {
    to: "/app/govt-schemes/states",
    title: "State Schemes",
    subtitle: "Pick your state",
    icon: Building2,
    color: "#1A5A3A",
  },
  {
    to: null,
    title: "Find Schemes",
    subtitle: "Check eligibility (MyScheme)",
    icon: Sparkles,
    color: "#7C3AED",
    find: true,
  },
]

export default function SchemesHome() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const [showSearch, setShowSearch] = useState(() =>
    Boolean(location.state?.showSearch),
  )
  const [query, setQuery] = useState(() => location.state?.searchQuery || "")
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [findLoading, setFindLoading] = useState(false)
  const findInFlight = useRef(false)

  useEffect(() => {
    if (!location.state?.showSearch && !location.state?.searchQuery) return
    navigate(".", { replace: true, state: {} })
  }, [location.state, navigate])

  const closeSearch = useCallback(() => {
    setShowSearch(false)
    setQuery("")
    setResults([])
    setSearchError("")
  }, [])

  const handleHomeBack = useCallback(() => {
    if (showSearch) {
      closeSearch()
      return
    }
    navigate("/app")
  }, [showSearch, closeSearch, navigate])

  useEffect(() => {
    if (!showSearch) return undefined
    fetchAllSchemesForSearch().catch(() => {})
  }, [showSearch])

  useEffect(() => {
    const q = query.trim()
    if (!showSearch || q.length < 2) {
      setResults([])
      setSearchLoading(false)
      setSearchError("")
      return undefined
    }

    let cancel = false
    const timer = setTimeout(async () => {
      try {
        if (!schemesSearchCache) setSearchLoading(true)
        setSearchError("")
        const merged = await fetchAllSchemesForSearch()
        if (cancel) return
        setResults(filterSchemesByFirstWord(merged, q).slice(0, 40))
      } catch {
        if (!cancel) setSearchError("Failed to search schemes")
      } finally {
        if (!cancel) setSearchLoading(false)
      }
    }, 400)

    return () => {
      cancel = true
      clearTimeout(timer)
    }
  }, [query, showSearch])

  const handleFindSchemes = useCallback(async () => {
    if (findInFlight.current) return
    findInFlight.current = true
    setFindLoading(true)
    try {
      const userId = session?.user_id != null ? Number(session.user_id) : null
      if (!userId || !Number.isFinite(userId)) {
        navigate("/app/govt-schemes/find")
        return
      }
      const res = await fetchMyschemeSearches(userId, 1, {
        token: session?.token,
        refreshToken: session?.refreshToken,
      })
      const list = res?.data?.searches
      const total = Number(res?.data?.total ?? 0)
      const count = Number(res?.data?.count ?? 0)
      const hasSearches =
        total > 0 || (Array.isArray(list) && list.length > 0) || count > 0
      navigate(
        hasSearches
          ? "/app/govt-schemes/find/profiles"
          : "/app/govt-schemes/find",
      )
    } catch {
      navigate("/app/govt-schemes/find")
    } finally {
      findInFlight.current = false
      setFindLoading(false)
    }
  }, [navigate, session])

  return (
    <SchemesShell
      title="Government Schemes"
      onBack={handleHomeBack}
      rightAction={
        <button
          type="button"
          onClick={() => {
            if (showSearch) {
              closeSearch()
              return
            }
            setShowSearch(true)
          }}
          className="rounded-lg p-1.5 text-white hover:bg-white/10"
          aria-label={showSearch ? "Close search" : "Search schemes"}
        >
          {showSearch ? <X size={18} /> : <Search size={18} />}
        </button>
      }
    >
      {showSearch ? (
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F5F5F5] px-3 py-2.5">
            <Search size={16} className="text-[#999]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search schemes..."
              className="w-full bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>
          {searchLoading ? (
            <div className="mt-4 flex justify-center py-6">
              <Loader2 className="animate-spin text-[#1F4B99]" size={22} />
            </div>
          ) : null}
          {searchError ? (
            <p className="mt-3 text-sm text-red-600">{searchError}</p>
          ) : null}
          <div className="mt-3 space-y-2">
            {results.map((item) => (
              <SchemeCard
                key={item.slug || `${item.title}-${item.state_code}`}
                title={item.title}
                description={item.description}
                meta={
                  String(item.scheme_type || "central").toLowerCase() === "state"
                    ? `State${item.state_code ? ` · ${item.state_code}` : ""}`
                    : "Central"
                }
                onClick={() =>
                  navigate(`/app/govt-schemes/scheme/${encodeURIComponent(item.slug)}`, {
                    state: {
                      summary: item,
                      from: "home-search",
                      resumeSearch: { query },
                    },
                  })
                }
              />
            ))}
            {!searchLoading && query.trim().length >= 2 && results.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6B7280]">No schemes found.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {!showSearch ? (
        <>
          <p className="mb-5 text-sm text-[#6B7280]">
            Explore central and state schemes, or check MyScheme eligibility — same as the SETU app.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {TILES.map((tile) => {
              const Icon = tile.icon
              const content = (
                <>
                  <div
                    className="mb-3 inline-flex rounded-xl p-2.5 text-white"
                    style={{ backgroundColor: tile.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="font-semibold text-[#1C1C1C]">{tile.title}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{tile.subtitle}</p>
                  {tile.find && findLoading ? (
                    <Loader2 className="mt-2 animate-spin" size={16} style={{ color: tile.color }} />
                  ) : null}
                </>
              )
              if (tile.find) {
                return (
                  <button
                    key={tile.title}
                    type="button"
                    disabled={findLoading}
                    onClick={handleFindSchemes}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition hover:border-[#1F4B99]/40 disabled:opacity-70"
                  >
                    {content}
                  </button>
                )
              }
              return (
                <Link
                  key={tile.to}
                  to={tile.to}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#1F4B99]/40"
                >
                  {content}
                </Link>
              )
            })}
          </div>

          <Link
            to="/app/govt-schemes/interests"
            className="mt-5 flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-[#EEF3FF] px-4 py-3.5 transition hover:border-[#1F4B99]/40"
          >
            <Heart size={18} style={{ color: SCHEMES_PRIMARY }} />
            <div>
              <p className="text-sm font-semibold text-[#1C1C1C]">My Interests</p>
              <p className="text-xs text-[#6B7280]">View scheme inquiries you submitted</p>
            </div>
          </Link>
        </>
      ) : null}
    </SchemesShell>
  )
}
