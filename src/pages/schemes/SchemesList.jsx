import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Loader2, Search } from "lucide-react"
import { fetchSchemesBySector } from "../../api/schemes"
import { SchemeCard, SchemesShell } from "./SchemesShell"

export default function SchemesList() {
  const { categoryName } = useParams()
  const navigate = useNavigate()
  const decoded = decodeURIComponent(categoryName || "")
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        setLoading(true)
        setError("")
        const list = await fetchSchemesBySector(decoded)
        if (!cancel) setSchemes(list)
      } catch (err) {
        if (!cancel) setError(err.message || "Failed to load schemes")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [decoded])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return schemes
    return schemes.filter(
      (s) =>
        String(s.title || "")
          .toLowerCase()
          .includes(q) ||
        String(s.description || "")
          .toLowerCase()
          .includes(q),
    )
  }, [schemes, query])

  return (
    <SchemesShell title={decoded || "Schemes"} backTo="/app/govt-schemes/central">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F5F5F5] px-3 py-2.5">
        <Search size={16} className="text-[#999]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in this category..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1F4B99]" size={28} />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          <p className="text-sm text-[#6B7280]">{filtered.length} schemes</p>
          {filtered.map((item) => (
            <SchemeCard
              key={item.slug || item.id || item.title}
              title={item.title}
              description={item.description}
              meta="Central"
              onClick={() =>
                navigate(`/app/govt-schemes/scheme/${encodeURIComponent(item.slug)}`, {
                  state: { summary: item, from: "central-list" },
                })
              }
            />
          ))}
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6B7280]">No schemes found.</p>
          ) : null}
        </div>
      ) : null}
    </SchemesShell>
  )
}
