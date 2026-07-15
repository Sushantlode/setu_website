import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { DEFAULT_CATEGORIES } from "../../api/schemes"
import { SchemesShell } from "./SchemesShell"

export default function SchemesCategories() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DEFAULT_CATEGORIES
    return DEFAULT_CATEGORIES.filter((c) => c.name.toLowerCase().includes(q))
  }, [query])

  return (
    <SchemesShell title="Central Schemes" backTo="/app/govt-schemes">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F5F5F5] px-3 py-2.5">
        <Search size={16} className="text-[#999]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <p className="mb-3 text-sm font-medium text-[#555]">Categories</p>
      <div className="space-y-2">
        {filtered.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() =>
              navigate(`/app/govt-schemes/central/${encodeURIComponent(cat.name)}`)
            }
            className="flex w-full items-center rounded-2xl border border-[#E8E8E8] bg-white px-5 py-4 text-left transition hover:border-[#1F4B99]/40"
          >
            <span className="text-lg font-semibold text-[#1a1a1a]">{cat.name}</span>
          </button>
        ))}
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#6B7280]">No categories match.</p>
        ) : null}
      </div>
    </SchemesShell>
  )
}
