import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { fetchStateSchemes, STATE_NAME_TO_CODE } from "../../api/schemes"
import { SchemeCard, SchemesShell } from "./SchemesShell"

const CODE_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name]),
)

export default function SchemesStateEnrolled() {
  const { stateCode } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const code = String(stateCode || "").toUpperCase()
  const stateName = location.state?.stateName || CODE_TO_NAME[code] || code

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(
    async (pageNum, append) => {
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        setError("")
        const res = await fetchStateSchemes({
          stateCode: code,
          page: pageNum,
          limit: 20,
        })
        setTotal(res.total)
        setPage(pageNum)
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
      } catch (err) {
        setError(err.message || "Failed to load state schemes")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [code],
  )

  useEffect(() => {
    load(1, false)
  }, [load])

  const hasMore = items.length < total

  return (
    <SchemesShell title={stateName} backTo="/app/govt-schemes/states">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1F4B99]" size={28} />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="space-y-3">
          <p className="text-sm text-[#6B7280]">
            {total} schemes · {code}
          </p>
          {items.map((item) => (
            <SchemeCard
              key={item.slug || item.id || item.title}
              title={item.title}
              description={item.description}
              meta={`State · ${item.state_code || code}`}
              onClick={() =>
                navigate(`/app/govt-schemes/scheme/${encodeURIComponent(item.slug)}`, {
                  state: { summary: item, from: "state-list" },
                })
              }
            />
          ))}
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6B7280]">No schemes for this state.</p>
          ) : null}
          {hasMore ? (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => load(page + 1, true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1F4B99] py-3 text-sm font-semibold text-[#1F4B99] disabled:opacity-60"
            >
              {loadingMore ? <Loader2 className="animate-spin" size={16} /> : null}
              Load more
            </button>
          ) : null}
        </div>
      ) : null}
    </SchemesShell>
  )
}
