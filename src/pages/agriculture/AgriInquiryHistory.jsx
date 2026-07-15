import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { fetchAgriInquiries } from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriInquiryHistory() {
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!auth.token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError("")
      const res = await fetchAgriInquiries(auth)
      setItems(res.items)
    } catch (err) {
      setError(err.message || "Failed to load inquiries")
    } finally {
      setLoading(false)
    }
  }, [session?.token])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AgriShell
      title="Inquiry history"
      backTo="/app/agriculture"
      rightAction={
        <Link to="/app/agriculture/inquiry" className="text-xs text-white/90">
          New
        </Link>
      }
    >
      {!auth.token ? (
        <p className="text-sm text-[#6E8371]">
          <Link
            to="/login"
            state={{ from: "/app/agriculture/inquiry/history" }}
            className="text-[#1E6E33] underline"
          >
            Sign in
          </Link>{" "}
          to view inquiries.
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {!loading && auth.token ? (
        <div className="space-y-3">
          {items.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-[#D9E3D7] bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-[#1E2E1F]">{q.name || "You"}</p>
              <p className="mt-2 text-sm text-[#334155]">{q.question}</p>
              {q.answer || q.response || q.admin_reply ? (
                <p className="mt-3 rounded-xl bg-[#E6F3E8] p-3 text-sm text-[#1E2E1F]">
                  <span className="font-semibold text-[#1E6E33]">Reply: </span>
                  {q.answer || q.response || q.admin_reply}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[#6E8371]">
                  Status: {q.status || "pending"}
                </p>
              )}
            </div>
          ))}
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6E8371]">
              No inquiries yet.
            </p>
          ) : null}
        </div>
      ) : null}
    </AgriShell>
  )
}
