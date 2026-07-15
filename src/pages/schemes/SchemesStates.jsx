import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { STATE_NAME_TO_CODE, STATE_NAMES } from "../../api/schemes"
import { SchemesShell } from "./SchemesShell"

export default function SchemesStates() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return STATE_NAMES
    return STATE_NAMES.filter((n) => n.toLowerCase().includes(q))
  }, [query])

  return (
    <SchemesShell title="State Schemes" backTo="/app/govt-schemes">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F5F5F5] px-3 py-2.5">
        <Search size={16} className="text-[#999]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search state..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((name) => {
          const code = STATE_NAME_TO_CODE[name]
          return (
            <button
              key={code}
              type="button"
              onClick={() =>
                navigate(`/app/govt-schemes/states/${code}`, {
                  state: { stateName: name },
                })
              }
              className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3.5 text-left transition hover:border-[#1F4B99]/40"
            >
              <span className="font-medium text-[#1C1C1C]">{name}</span>
              <span className="text-xs font-semibold text-[#1F4B99]">{code}</span>
            </button>
          )
        })}
      </div>
    </SchemesShell>
  )
}
