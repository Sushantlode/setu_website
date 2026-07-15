import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Pill, Search, X } from "lucide-react"
import {
  AZ_LETTERS,
  addRecentDrugSearch,
  clearRecentDrugSearches,
  loadRecentDrugSearches,
  pickShortDescription,
  resolveDrugName,
  searchDrugs,
} from "../../api/drug"
import { DrugListItem, DrugShell } from "./DrugShell"

export default function DrugBrowse() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [letter, setLetter] = useState("")
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [recent, setRecent] = useState(() => loadRecentDrugSearches())

  const runSearch = useCallback(async (q, pageNum, append) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError("")
      const res = await searchDrugs({ query: q, page: pageNum, limit: 20 })
      setPage(pageNum)
      setTotalPages(res.totalPages)
      setItems((prev) => (append ? [...prev, ...res.items] : res.items))
    } catch (err) {
      setError(err.message || "Failed to load drugs")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length >= 2) {
      const timer = setTimeout(() => runSearch(q, 1, false), 350)
      return () => clearTimeout(timer)
    }
    if (letter) {
      runSearch(letter, 1, false)
      return undefined
    }
    setItems([])
    return undefined
  }, [query, letter, runSearch])

  const openDrug = (drug) => {
    const id = drug.id ?? drug.drug_id
    const name = resolveDrugName(drug)
    addRecentDrugSearch({
      id,
      name,
      description: pickShortDescription(drug),
    })
    setRecent(loadRecentDrugSearches())
    navigate(`/app/drug-directory/drugs/${encodeURIComponent(id)}`, {
      state: { summary: drug },
    })
  }

  const activeQuery = query.trim().length >= 2 ? query.trim() : letter
  const showBrowse = !activeQuery

  return (
    <DrugShell title="Drugs Information" backTo="/app/drug-directory">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5">
        <Search size={16} className="text-[#999]" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim()) setLetter("")
          }}
          placeholder="Search by drug name..."
          className="w-full bg-transparent text-sm outline-none"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear">
            <X size={16} className="text-[#999]" />
          </button>
        ) : null}
      </div>

      {showBrowse ? (
        <>
          {recent.length > 0 ? (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#555]">
                  Recently searched
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearRecentDrugSearches()
                    setRecent([])
                  }}
                  className="text-xs font-medium text-[#1C39BB]"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {recent.map((item) => (
                  <DrugListItem
                    key={item.id}
                    title={item.name}
                    description={item.description}
                    icon={<Pill size={18} />}
                    onClick={() =>
                      navigate(
                        `/app/drug-directory/drugs/${encodeURIComponent(item.id)}`,
                        { state: { summary: item } },
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          <h2 className="mb-3 text-sm font-semibold text-[#555]">Browse A–Z</h2>
          <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
            {AZ_LETTERS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => {
                  setLetter(ch)
                  setQuery("")
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  letter === ch
                    ? "bg-[#1C39BB] text-white"
                    : "border border-[#E5E7EB] bg-white text-[#1C1C1C] hover:border-[#1C39BB]/40"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-[#6B7280]">
            Tap a letter or search by name to browse medicines.
          </p>
        </>
      ) : null}

      {activeQuery ? (
        <div className="mt-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-[#6B7280]">
              Results for “{activeQuery}”
            </p>
            {letter ? (
              <button
                type="button"
                onClick={() => setLetter("")}
                className="text-xs font-medium text-[#1C39BB]"
              >
                Clear letter
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#1C39BB]" size={28} />
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading ? (
            <div className="space-y-2">
              {items.map((drug) => (
                <DrugListItem
                  key={drug.id}
                  title={resolveDrugName(drug)}
                  description={pickShortDescription(drug)}
                  meta="Allopathy"
                  icon={<Pill size={18} />}
                  onClick={() => openDrug(drug)}
                />
              ))}
              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#6B7280]">
                  No drugs found.
                </p>
              ) : null}
              {page < totalPages ? (
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => runSearch(activeQuery, page + 1, true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1C39BB] py-3 text-sm font-semibold text-[#1C39BB] disabled:opacity-60"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : null}
                  Load more
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </DrugShell>
  )
}
