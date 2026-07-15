import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  buildDetailSections,
  fetchAyurvedaById,
  fetchAyurvedaBySlug,
  resolveAyurvedaName,
} from "../../api/drug"
import { DetailSections, DrugShell } from "./DrugShell"

export default function AyurvedaDetail() {
  const { idOrSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const decoded = decodeURIComponent(idOrSlug || "")
  const summary = location.state?.summary

  const [title, setTitle] = useState(
    () => resolveAyurvedaName(summary) || decoded || "Ayurveda",
  )
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        setLoading(true)
        setError("")
        let raw
        if (/^\d+$/.test(decoded)) {
          raw = await fetchAyurvedaById(decoded)
        } else {
          try {
            raw = await fetchAyurvedaBySlug(decoded)
          } catch {
            raw = await fetchAyurvedaById(decoded)
          }
        }
        if (cancel) return
        const shaped = buildDetailSections(raw)
        setTitle(shaped.title || resolveAyurvedaName(raw))
        setSections(shaped.sections)
      } catch (err) {
        if (!cancel) setError(err.message || "Failed to load details")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [decoded])

  return (
    <DrugShell
      title={title}
      onBack={() => {
        if (window.history.length > 1) navigate(-1)
        else navigate("/app/drug-directory/ayurveda")
      }}
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#0F766E]" size={28} />
        </div>
      ) : null}
      {error && !loading ? (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      ) : null}
      {!loading ? (
        <>
          <h2 className="mb-4 text-xl font-bold text-[#1C1C1C]">{title}</h2>
          <DetailSections sections={sections} />
        </>
      ) : null}
    </DrugShell>
  )
}
