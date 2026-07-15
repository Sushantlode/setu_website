import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { agriImage, fetchAgriKnowledge } from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriKnowledge() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [tab, setTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await fetchAgriKnowledge()
        if (!cancel) setItems(list)
      } catch (err) {
        if (!cancel) setError(err.message || "Failed to load knowledge")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (tab === "videos") return items.filter((k) => k.type === "video")
    if (tab === "articles") return items.filter((k) => k.type === "article")
    return items
  }, [items, tab])

  return (
    <AgriShell title="Knowledge hub" backTo="/app/agriculture">
      <div className="mb-4 flex gap-2">
        {[
          ["all", "All"],
          ["videos", "Videos"],
          ["articles", "Articles"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tab === key ? "bg-[#1E6E33] text-white" : "bg-[#E6F3E8] text-[#1E6E33]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <div className="space-y-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                navigate(`/app/agriculture/knowledge/${item.id}`, {
                  state: { item },
                })
              }
              className="flex w-full gap-3 rounded-2xl border border-[#D9E3D7] bg-white p-3 text-left shadow-sm"
            >
              <img
                src={agriImage(item.image_key)}
                alt=""
                className="h-20 w-20 rounded-xl object-cover bg-[#E6F3E8]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium uppercase text-[#1E6E33]">
                  {item.type || "article"}
                </span>
                <span className="mt-0.5 block font-semibold text-[#1E2E1F] line-clamp-2">
                  {item.title}
                </span>
                {item.subtitle ? (
                  <span className="mt-0.5 block text-xs text-[#6E8371] line-clamp-2">
                    {item.subtitle}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6E8371]">
              No items found.
            </p>
          ) : null}
        </div>
      ) : null}
    </AgriShell>
  )
}
