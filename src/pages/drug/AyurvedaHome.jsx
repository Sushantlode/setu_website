import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Leaf, Loader2, Search, X } from "lucide-react"
import {
  AZ_LETTERS,
  fetchAyurvedaList,
  pickShortDescription,
  resolveAyurvedaName,
  searchAyurveda,
} from "../../api/drug"
import { DrugListItem, DrugShell } from "./DrugShell"

export default function AyurvedaHome() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [letter, setLetter] = useState("")
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  const run = useCallback(async ({ q, alphabet, pageNum, append }) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError("")
      const res = q
        ? await searchAyurveda({ query: q, page: pageNum, limit: 20 })
        : await fetchAyurvedaList({
            page: pageNum,
            limit: 20,
            alphabet: alphabet || undefined,
          })
      setPage(pageNum)
      setTotalPages(res.totalPages)
      setItems((prev) => (append ? [...prev, ...res.items] : res.items))
    } catch (err) {
      setError(err.message || "Failed to load Ayurvedic medicines")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length >= 2) {
      const timer = setTimeout(
        () => run({ q, pageNum: 1, append: false }),
        350,
      )
      return () => clearTimeout(timer)
    }
    run({ alphabet: letter || undefined, pageNum: 1, append: false })
    return undefined
  }, [query, letter, run])

  const activeQuery = query.trim().length >= 2 ? query.trim() : ""
  const canLoadMore = page < totalPages

  return (
    <DrugShell title="Ayurvedic Medicines" backTo="/app/drug-directory">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5">
        <Search size={16} className="text-[#999]" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.trim()) setLetter("")
          }}
          placeholder="Search Ayurvedic medicines..."
          className="w-full bg-transparent text-sm outline-none"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear">
            <X size={16} className="text-[#999]" />
          </button>
        ) : null}
      </div>

      {!activeQuery ? (
        <div className="mb-5 grid grid-cols-8 gap-2 sm:grid-cols-10">
          <button
            type="button"
            onClick={() => setLetter("")}
            className={`rounded-lg py-2 text-xs font-semibold ${
              !letter
                ? "bg-[#0F766E] text-white"
                : "border border-[#E5E7EB] bg-white text-[#1C1C1C]"
            }`}
          >
            All
          </button>
          {AZ_LETTERS.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                setLetter(ch)
                setQuery("")
              }}
              className={`rounded-lg py-2 text-sm font-semibold ${
                letter === ch
                  ? "bg-[#0F766E] text-white"
                  : "border border-[#E5E7EB] bg-white text-[#1C1C1C] hover:border-[#0F766E]/40"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#0F766E]" size={28} />
        </div>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        {items.map((item) => (
          <DrugListItem
            key={item.id}
            title={resolveAyurvedaName(item)}
            description={pickShortDescription(item)}
            meta="Ayurveda"
            icon={<Leaf size={18} />}
            onClick={() =>
              navigate(
                `/app/drug-directory/ayurveda/${encodeURIComponent(item.id)}`,
                { state: { summary: item } },
              )
            }
          />
        ))}
        {!loading && items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#6B7280]">
            No Ayurvedic medicines found.
          </p>
        ) : null}
        {canLoadMore ? (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() =>
              run({
                q: activeQuery || undefined,
                alphabet: letter || undefined,
                pageNum: page + 1,
                append: true,
              })
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0F766E] py-3 text-sm font-semibold text-[#0F766E] disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="animate-spin" size={16} /> : null}
            Load more
          </button>
        ) : null}
      </div>
    </DrugShell>
  )
}
