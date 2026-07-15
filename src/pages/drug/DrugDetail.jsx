import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  buildDetailSections,
  fetchDrugById,
  fetchDrugBySlug,
  resolveDrugName,
} from "../../api/drug"
import { DetailSections, DrugShell } from "./DrugShell"

function isLikelyUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      value.trim(),
    )
  )
}

export default function DrugDetail() {
  const { idOrSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const decoded = decodeURIComponent(idOrSlug || "")
  const summary = location.state?.summary

  const [title, setTitle] = useState(
    () => resolveDrugName(summary) || decoded || "Drug",
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
        const isNumeric = /^\d+$/.test(decoded)
        if (isNumeric || isLikelyUuid(decoded)) {
          raw = await fetchDrugById(decoded)
        } else {
          try {
            raw = await fetchDrugBySlug(decoded)
          } catch {
            raw = await fetchDrugById(decoded)
          }
        }
        if (cancel) return
        const shaped = buildDetailSections(raw)
        setTitle(shaped.title)
        setSections(shaped.sections)
      } catch (err) {
        if (!cancel) {
          setError(err.message || "Failed to load drug details")
          if (summary) {
            setTitle(resolveDrugName(summary))
            setSections([])
          }
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [decoded, summary])

  return (
    <DrugShell
      title={title}
      onBack={() => {
        if (window.history.length > 1) navigate(-1)
        else navigate("/app/drug-directory/drugs")
      }}
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1C39BB]" size={28} />
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
