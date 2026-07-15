import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  CLOUDFRONT_BASE,
} from "../../config/api"
import { agriImage, fetchAgriKnowledgeById } from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriKnowledgeDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const summary = location.state?.item

  const [item, setItem] = useState(summary || null)
  const [loading, setLoading] = useState(!summary)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        setLoading(true)
        const data = await fetchAgriKnowledgeById(id)
        if (!cancel) setItem(data)
      } catch (err) {
        if (!cancel && !summary) setError(err.message || "Failed to load")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [id])

  const videoUrl = item?.video_key
    ? item.video_key.startsWith("http")
      ? item.video_key
      : `${CLOUDFRONT_BASE}/${item.video_key}`
    : null

  return (
    <AgriShell
      title={item?.type === "video" ? "Video" : "Article"}
      onBack={() => {
        if (window.history.length > 1) navigate(-1)
        else navigate("/app/agriculture/knowledge")
      }}
    >
      {loading && !item ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {item ? (
        <>
          {item.type === "video" && videoUrl ? (
            <video
              controls
              className="mb-4 w-full rounded-2xl bg-black"
              poster={agriImage(item.image_key)}
              src={videoUrl}
            />
          ) : (
            <img
              src={agriImage(item.image_key)}
              alt=""
              className="mb-4 h-48 w-full rounded-2xl object-cover bg-[#E6F3E8]"
            />
          )}
          <p className="text-xs font-semibold uppercase text-[#1E6E33]">
            {item.type || "article"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#1E2E1F]">{item.title}</h2>
          {item.subtitle ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
              {item.subtitle}
            </p>
          ) : null}
          {item.content || item.body || item.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
              {item.content || item.body || item.description}
            </p>
          ) : null}
        </>
      ) : null}
    </AgriShell>
  )
}
