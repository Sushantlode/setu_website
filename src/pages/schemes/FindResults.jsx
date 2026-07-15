import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Loader2, Search } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  buildMyschemeProfileFields,
  loadWizardDraft,
  normalizeSavedSearchParams,
  saveWizardDraft,
  searchMyscheme,
  wizardDraftToUserDetails,
} from "../../api/schemes"
import { SchemeCard, SchemesShell } from "./SchemesShell"

const PAGE_SIZE = 10

export default function FindResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [keyword, setKeyword] = useState("")
  const [from, setFrom] = useState(0)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")

  const baseParams = useMemo(() => {
    if (location.state?.searchParams) {
      return normalizeSavedSearchParams(location.state.searchParams, {
        lang: "en",
        from: 0,
        size: PAGE_SIZE,
      })
    }
    const draft = loadWizardDraft()
    if (draft?.gender && draft?.state) {
      return {
        ...buildMyschemeProfileFields(wizardDraftToUserDetails(draft)),
        from: 0,
        size: PAGE_SIZE,
        lang: "en",
        keyword: "",
        sort: "",
      }
    }
    return null
  }, [location.state])

  const runSearch = useCallback(
    async (offset, append, kw = keyword) => {
      if (!baseParams) {
        setError("Complete the eligibility wizard first.")
        setLoading(false)
        return
      }
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        setError("")
        const body = {
          ...baseParams,
          from: offset,
          size: PAGE_SIZE,
          keyword: kw || "",
          user_id:
            session?.user_id != null ? Number(session.user_id) : undefined,
        }
        const res = await searchMyscheme(body, {
          token: session?.token,
          refreshToken: session?.refreshToken,
        })
        setTotal(res.total)
        setFrom(offset)
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
      } catch (err) {
        setError(err.message || "Search failed")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [baseParams, keyword, session],
  )

  useEffect(() => {
    if (!baseParams) {
      navigate("/app/govt-schemes/find", { replace: true })
      return
    }
    runSearch(0, false, "")
    // initial load when baseParams ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseParams])

  useEffect(() => {
    if (!baseParams) return undefined
    const timer = setTimeout(() => {
      runSearch(0, false, keyword)
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  const resultsFrom = location.state?.from === "profiles" ? "profiles" : "wizard"

  const backFromResults = () => {
    if (resultsFrom === "profiles") {
      navigate("/app/govt-schemes/find/profiles")
      return
    }
    // Return to last wizard step (persisted in draft)
    const draft = loadWizardDraft()
    if (draft && typeof draft.step !== "number") {
      saveWizardDraft({ ...draft, step: 5 })
    }
    navigate("/app/govt-schemes/find", { state: { from: "results" } })
  }

  const hasMore = items.length < total

  return (
    <SchemesShell title="Matching schemes" onBack={backFromResults}>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F5F5F5] px-3 py-2.5">
        <Search size={16} className="text-[#999]" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Filter by keyword..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-[#6B7280]">
          {loading ? "Searching…" : `${total} schemes found`}
        </p>
        <button
          type="button"
          onClick={backFromResults}
          className="text-xs font-medium text-[#1F4B99] hover:underline"
        >
          Edit profile
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1F4B99]" size={28} />
        </div>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {items.map((item) => (
          <SchemeCard
            key={item.id || item.slug}
            title={item.title}
            description={item.description}
            meta={[item.level, ...(item.tags || [])].filter(Boolean).join(" · ")}
            onClick={() => {
              if (!item.slug) return
              navigate(`/app/govt-schemes/scheme/${encodeURIComponent(item.slug)}`, {
                state: {
                  summary: item,
                  from: "find-results",
                  resultsFrom,
                  searchParams: baseParams,
                },
              })
            }}
          />
        ))}
        {!loading && items.length === 0 && !error ? (
          <p className="py-10 text-center text-sm text-[#6B7280]">
            No matching schemes. Try adjusting your profile.
          </p>
        ) : null}
        {hasMore ? (
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => runSearch(from + PAGE_SIZE, true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1F4B99] py-3 text-sm font-semibold text-[#1F4B99] disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="animate-spin" size={16} /> : null}
            Load more
          </button>
        ) : null}
      </div>
    </SchemesShell>
  )
}
