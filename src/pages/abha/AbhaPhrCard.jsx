import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import {
  getUserPHRCard,
  getUserQRCode,
  getXAuthToken,
  getXToken,
  loadAbhaSession,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaPhrCard() {
  const navigate = useNavigate()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const profile = loadAbhaSession()?.profile

  useEffect(() => {
    const xToken = getXToken()
    const xAuth = getXAuthToken()
    if (!xToken) {
      navigate("/app/abha/login", { replace: true })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await getUserPHRCard(xToken, xAuth)
        if (!cancelled) {
          if (res.success) setCard(res.data)
          else setError(res.error || "Unable to load PHR card")
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load PHR card")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const imageSrc =
    card?.phrCard ||
    card?.card ||
    card?.image ||
    card?.data?.phrCard ||
    (typeof card === "string" ? card : null)

  return (
    <AbhaShell title="PHR card" backTo="/app/abha/profile">
      {loading ? (
        <div className="flex justify-center py-16 text-[#2F387E]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[#E2E5F0] bg-white p-5">
          <p className="text-sm text-red-700">{error}</p>
          <div className="mt-4 rounded-xl bg-[#2F387E] p-4 text-white">
            <p className="font-semibold">{profile?.fullName || "ABHA user"}</p>
            <p className="mt-1 text-sm text-white/85">{profile?.abhaAddress}</p>
            <p className="mt-1 font-mono text-xs text-white/70">
              {profile?.abhaNumber}
            </p>
          </div>
        </div>
      ) : imageSrc ? (
        <img
          src={
            String(imageSrc).startsWith("data:") ||
            String(imageSrc).startsWith("http")
              ? imageSrc
              : `data:image/png;base64,${imageSrc}`
          }
          alt="PHR card"
          className="w-full rounded-2xl border border-[#E2E5F0] shadow-sm"
        />
      ) : (
        <pre className="overflow-auto rounded-xl bg-white p-4 text-xs text-[#4B5168]">
          {JSON.stringify(card, null, 2)}
        </pre>
      )}
    </AbhaShell>
  )
}

export function AbhaQrShare() {
  const navigate = useNavigate()
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const profile = loadAbhaSession()?.profile

  useEffect(() => {
    const xToken = getXToken()
    const xAuth = getXAuthToken()
    if (!xToken) {
      navigate("/app/abha/login", { replace: true })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await getUserQRCode(xToken, xAuth)
        if (!cancelled) {
          if (res.success) setQr(res.data)
          else setError(res.error || "Unable to load QR")
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load QR")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const imageSrc =
    qr?.qrCode ||
    qr?.qr ||
    qr?.image ||
    qr?.data?.qrCode ||
    (typeof qr === "string" ? qr : null)

  return (
    <AbhaShell title="QR / Share" backTo="/app/abha/profile">
      <div className="rounded-2xl border border-[#E2E5F0] bg-white p-5 text-center shadow-sm">
        <p className="font-semibold text-[#1A1F3C]">
          {profile?.fullName || "ABHA user"}
        </p>
        <p className="mt-1 text-sm text-[#6B7289]">{profile?.abhaAddress}</p>

        {loading ? (
          <div className="flex justify-center py-10 text-[#2F387E]">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : error ? (
          <p className="mt-6 text-sm text-red-700">{error}</p>
        ) : imageSrc ? (
          <img
            src={
              String(imageSrc).startsWith("data:") ||
              String(imageSrc).startsWith("http")
                ? imageSrc
                : `data:image/png;base64,${imageSrc}`
            }
            alt="ABHA QR"
            className="mx-auto mt-6 h-56 w-56 rounded-xl border border-[#E2E5F0] object-contain"
          />
        ) : (
          <p className="mt-6 text-sm text-[#6B7289]">
            QR payload received. Show this address at the facility counter.
          </p>
        )}
      </div>
    </AbhaShell>
  )
}
