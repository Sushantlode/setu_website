import { useEffect, useRef, useState } from "react"
import { Camera, RefreshCw } from "lucide-react"
import {
  analyzeFaceScanBlob,
  MENTAL_ACCENT,
  registerFaceScanUser,
} from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../components/ui/Toast"
import { MentalShell } from "./MentalShell"

export default function MentalFaceScan() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const { session } = useAuth()
  const toast = useToast()

  const [ready, setReady] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await registerFaceScanUser(session).catch(() => null)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setReady(true)
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              "Camera access is required for face scan. Please allow camera permission.",
          )
        }
      }
    })()

    return () => {
      cancelled = true
      streamRef.current?.getTracks()?.forEach((t) => t.stop())
    }
  }, [session])

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return
    setScanning(true)
    setResult(null)
    try {
      const video = videoRef.current
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext("2d")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
      if (!blob) throw new Error("Could not capture frame")
      const data = await analyzeFaceScanBlob(blob, session)
      setResult(data)
      toast.success("Scan complete")
    } catch (err) {
      toast.error(err?.message || "Face scan failed")
    } finally {
      setScanning(false)
    }
  }

  return (
    <MentalShell title="Face stress scan" backTo="/app/mental-health/assessments">
      <p className="mb-4 text-sm text-[#6B7280]">
        Hold still, face the camera in good light, then capture a frame for stress analysis.
      </p>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-[3/4] w-full object-cover sm:aspect-video"
          />
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!ready || scanning}
          onClick={captureAndAnalyze}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          <Camera size={18} />
          {scanning ? "Analyzing…" : "Capture & analyze"}
        </button>
        {result ? (
          <button
            type="button"
            onClick={() => setResult(null)}
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] px-4 py-3 text-sm font-semibold"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        ) : null}
      </div>

      {result ? (
        <div className="mt-5 rounded-2xl border border-[#D1FAE5] bg-white p-5">
          <p className="font-semibold text-[#0F172A]">Scan result</p>
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-[#F8FAFC] p-3 text-xs text-[#334155]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </MentalShell>
  )
}
