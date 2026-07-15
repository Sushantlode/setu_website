import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Bell,
  ChevronRight,
  Leaf,
  Loader2,
  Pill,
  Search,
  X,
} from "lucide-react"
import {
  POPULAR_DRUGS,
  pickShortDescription,
  resolveAyurvedaName,
  resolveDrugName,
  searchHub,
} from "../../api/drug"
import { DrugListItem, DrugShell } from "./DrugShell"

export default function DrugHub() {
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const requestId = useRef(0)

  useEffect(() => {
    const q = query.trim()
    if (!showSearch || q.length < 2) {
      setResults([])
      setLoading(false)
      setError("")
      return undefined
    }
    const id = ++requestId.current
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError("")
        const items = await searchHub(q, { limit: 12 })
        if (requestId.current === id) setResults(items)
      } catch (err) {
        if (requestId.current === id) {
          setError(err.message || "Search failed")
        }
      } finally {
        if (requestId.current === id) setLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query, showSearch])

  const openResult = useCallback(
    (item) => {
      if (item.kind === "ayurveda") {
        navigate(`/app/drug-directory/ayurveda/${encodeURIComponent(item.id)}`, {
          state: { summary: item },
        })
        return
      }
      navigate(`/app/drug-directory/drugs/${encodeURIComponent(item.id)}`, {
        state: { summary: item },
      })
    },
    [navigate],
  )

  const closeSearch = () => {
    setShowSearch(false)
    setQuery("")
    setResults([])
    setError("")
  }

  return (
    <DrugShell
      title="Drug Directory"
      backTo="/app"
      rightAction={
        <div className="flex items-center gap-1">
          <Link
            to="/app/drug-directory/reminders"
            className="rounded-lg p-1.5 text-white hover:bg-white/10"
            aria-label="Reminders"
          >
            <Bell size={18} />
          </Link>
          <button
            type="button"
            onClick={() => (showSearch ? closeSearch() : setShowSearch(true))}
            className="rounded-lg p-1.5 text-white hover:bg-white/10"
            aria-label={showSearch ? "Close search" : "Search"}
          >
            {showSearch ? <X size={18} /> : <Search size={18} />}
          </button>
        </div>
      }
      onBack={showSearch ? closeSearch : undefined}
    >
      {showSearch ? (
        <div>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5">
            <Search size={16} className="text-[#999]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drugs or Ayurvedic medicines..."
              className="w-full bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#1C39BB]" size={24} />
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            {results.map((item) => {
              const isDrug = item.kind === "drug"
              return (
                <DrugListItem
                  key={`${item.kind}-${item.id}`}
                  title={
                    isDrug ? resolveDrugName(item) : resolveAyurvedaName(item)
                  }
                  meta={isDrug ? "Allopathy drug" : "Ayurvedic medicine"}
                  description={pickShortDescription(item)}
                  icon={isDrug ? <Pill size={18} /> : <Leaf size={18} />}
                  onClick={() => openResult(item)}
                />
              )
            })}
            {!loading && query.trim().length >= 2 && results.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#6B7280]">
                No medicines found.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-[#6B7280]">
            Search trusted medicine info — allopathy drugs and Ayurvedic medicines,
            same as the SETU app.
          </p>

          <div className="space-y-3">
            <Link
              to="/app/drug-directory/drugs"
              className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#1C39BB]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C39BB] text-white">
                <Pill size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-[#1C1C1C]">
                  Drugs Information
                </span>
                <span className="mt-0.5 block text-xs text-[#6B7280]">
                  Simple, trusted medicine info
                </span>
              </span>
              <ChevronRight size={20} className="text-[#9CA3AF]" />
            </Link>

            <Link
              to="/app/drug-directory/ayurveda"
              className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#1C39BB]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F766E] text-white">
                <Leaf size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-[#1C1C1C]">
                  Ayurvedic Medicines
                </span>
                <span className="mt-0.5 block text-xs text-[#6B7280]">
                  Gentle, natural care
                </span>
              </span>
              <ChevronRight size={20} className="text-[#9CA3AF]" />
            </Link>

            <Link
              to="/app/drug-directory/reminders"
              className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-[#EEF2FF] p-4 transition hover:border-[#1C39BB]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#1C39BB]">
                <Bell size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold text-[#1C1C1C]">
                  Medicine Reminders
                </span>
                <span className="mt-0.5 block text-xs text-[#6B7280]">
                  Set dosage reminders
                </span>
              </span>
              <ChevronRight size={20} className="text-[#9CA3AF]" />
            </Link>
          </div>

          <h2 className="mb-3 mt-8 text-sm font-semibold text-[#555]">
            Popular medicines
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {POPULAR_DRUGS.map((drug) => (
              <button
                key={drug.id}
                type="button"
                onClick={() =>
                  navigate(`/app/drug-directory/drugs/${encodeURIComponent(drug.id)}`, {
                    state: { summary: { id: drug.id, generic_name: drug.name } },
                  })
                }
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-left text-sm font-medium text-[#1C1C1C] shadow-sm transition hover:border-[#1C39BB]/40"
              >
                {drug.name}
              </button>
            ))}
          </div>
        </>
      )}
    </DrugShell>
  )
}
