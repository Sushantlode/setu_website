import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Upload } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { ensureFreshSession } from "../../api/auth"
import {
  diagnoseCropDisease,
  fetchGreenlensCategories,
  fetchGreenlensCrops,
} from "../../api/agri"
import { AgriShell } from "./AgriShell"

const FALLBACK_CROPS = [
  "Rice",
  "Wheat",
  "Cotton",
  "Sugarcane",
  "Tomato",
  "Potato",
]

function cropLabel(c) {
  if (typeof c === "string") return c
  return (
    c?.name ||
    c?.crop_name ||
    c?.known_crop_name ||
    c?.crop ||
    c?.label ||
    ""
  )
}

export default function AgriDisease() {
  const navigate = useNavigate()
  const { session, login } = useAuth()

  const [crops, setCrops] = useState([])
  const [categories, setCategories] = useState([])
  const [crop, setCrop] = useState("")
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [metaError, setMetaError] = useState("")
  const [usingFallbackCrops, setUsingFallbackCrops] = useState(false)
  const [diagnosing, setDiagnosing] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!session?.token) {
      setLoadingMeta(false)
      return
    }
    let cancel = false
    ;(async () => {
      try {
        setLoadingMeta(true)
        setMetaError("")
        const fresh = await ensureFreshSession(session).catch(() => session)
        if (fresh?.token && fresh.token !== session.token) {
          login({ ...session, ...fresh })
        }
        const auth = {
          token: fresh?.token || session.token,
          refreshToken: fresh?.refreshToken || session.refreshToken,
        }
        const [c, cat] = await Promise.all([
          fetchGreenlensCrops(auth),
          fetchGreenlensCategories(auth).catch(() => []),
        ])
        if (cancel) return
        setCrops(Array.isArray(c) ? c : [])
        setCategories(Array.isArray(cat) ? cat : [])
        setUsingFallbackCrops(!Array.isArray(c) || c.length === 0)
      } catch (err) {
        if (!cancel) {
          setMetaError(err.message || "Could not load GreenLens crops.")
          setUsingFallbackCrops(true)
          setCrops([])
        }
      } finally {
        if (!cancel) setLoadingMeta(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [session?.token])

  const cropNames = useMemo(() => {
    const fromApi = crops.map(cropLabel).filter(Boolean)
    return fromApi.length > 0 ? fromApi : FALLBACK_CROPS
  }, [crops])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError("")
  }

  const run = async () => {
    if (!session?.token) {
      navigate("/login", { state: { from: "/app/agriculture/disease" } })
      return
    }
    if (!crop) {
      setError("Select a crop.")
      return
    }
    if (!file) {
      setError("Upload a crop leaf / plant photo.")
      return
    }
    setDiagnosing(true)
    setError("")
    setResult(null)
    try {
      const fresh = await ensureFreshSession(session)
      if (fresh?.token && fresh.token !== session.token) {
        login({ ...session, ...fresh })
      }
      const data = await diagnoseCropDisease(file, crop, {
        token: fresh.token,
        refreshToken: fresh.refreshToken,
      })
      setResult(data)
    } catch (err) {
      setError(err.message || "Diagnosis failed")
      if (err.requiresAuth) {
        setMetaError(err.message)
      }
    } finally {
      setDiagnosing(false)
    }
  }

  return (
    <AgriShell title="Crop disease" backTo="/app/agriculture">
      <p className="mb-4 text-sm text-[#6E8371]">
        Upload a crop photo for GreenLens diagnosis — same flow as the SETU app.
      </p>

      {!session?.token ? (
        <p className="text-sm text-[#6E8371]">
          <Link
            to="/login"
            state={{ from: "/app/agriculture/disease" }}
            className="font-medium text-[#1E6E33] underline"
          >
            Sign in
          </Link>{" "}
          to use disease diagnosis.
        </p>
      ) : null}

      {loadingMeta ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-[#1E6E33]" size={24} />
        </div>
      ) : null}

      {metaError ? (
        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {metaError}
        </p>
      ) : null}

      {session?.token && !loadingMeta ? (
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Crop</span>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
            >
              <option value="">Select crop</option>
              {cropNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {usingFallbackCrops ? (
              <span className="mt-1 block text-xs text-[#6E8371]">
                Showing common crops — GreenLens crop list was unavailable.
              </span>
            ) : null}
          </label>

          {categories.length > 0 ? (
            <p className="text-xs text-[#6E8371]">
              {categories.length} disease categories available for guidance.
            </p>
          ) : null}

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#1E6E33]/40 bg-white px-4 py-10">
            <Upload size={28} className="text-[#1E6E33]" />
            <span className="mt-2 text-sm font-medium text-[#1E2E1F]">
              Upload plant photo
            </span>
            <span className="mt-1 text-xs text-[#6E8371]">JPG or PNG</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
          </label>

          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="mx-auto max-h-56 rounded-2xl object-contain"
            />
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            disabled={diagnosing}
            onClick={run}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#307E33] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {diagnosing ? <Loader2 className="animate-spin" size={16} /> : null}
            Diagnose
          </button>

          {result ? (
            <div className="space-y-3 rounded-2xl border border-[#D9E3D7] bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-[#1E2E1F]">Diagnosis result</h3>
              {result.disease_name || result.crop_health_status ? (
                <>
                  <Field label="Disease name" value={result.disease_name} />
                  <Field
                    label="Scientific name"
                    value={result.disease_scientific_name_in_en}
                  />
                  <Field label="Crop analyzed" value={result.analyzed_crop_name} />
                  <Field label="Health status" value={result.crop_health_status} />
                  <Field
                    label="Likelihood"
                    value={result.diagnosis_likelihood}
                  />
                  {Array.isArray(result.preventive_measures) &&
                  result.preventive_measures.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#6E8371]">
                        Preventive measures
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#334155]">
                        {result.preventive_measures.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {Array.isArray(result.treatment_measures) &&
                  result.treatment_measures.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#6E8371]">
                        Treatment
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#334155]">
                        {result.treatment_measures.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-[#334155]">
                  {typeof result === "string"
                    ? result
                    : JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </AgriShell>
  )
}

function Field({ label, value }) {
  if (value == null || value === "") return null
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[#6E8371]">{label}</p>
      <p className="mt-0.5 text-sm text-[#1E2E1F]">{value}</p>
    </div>
  )
}
