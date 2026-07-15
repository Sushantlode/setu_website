import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { deleteInterest, fetchMyInterests } from "../../api/schemes"
import { SchemeCard, SchemesShell } from "./SchemesShell"

export default function SchemesInterests() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  const auth = {
    token: session?.token,
    refreshToken: session?.refreshToken,
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const list = await fetchMyInterests(auth)
      setItems(list)
    } catch (err) {
      setError(err.message || "Failed to load interests")
    } finally {
      setLoading(false)
    }
  }, [session?.token, session?.refreshToken])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id) => {
    if (!id) return
    setDeletingId(id)
    try {
      await deleteInterest(id, auth)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      setError(err.message || "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <SchemesShell title="My Interests" backTo="/app/govt-schemes">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1F4B99]" size={28} />
        </div>
      ) : null}

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <SchemeCard
                title={item.scheme_name || item.scheme_slug || "Scheme"}
                description={item.message || item.status || ""}
                meta={item.status ? `Status: ${item.status}` : undefined}
                onClick={() => {
                  if (item.scheme_slug) {
                    navigate(
                      `/app/govt-schemes/scheme/${encodeURIComponent(item.scheme_slug)}`,
                    )
                  }
                }}
              />
              <button
                type="button"
                disabled={deletingId === item.id}
                onClick={() => handleDelete(item.id)}
                className="absolute right-3 top-3 rounded-lg p-2 text-[#9CA3AF] hover:bg-red-50 hover:text-red-600"
                aria-label="Delete interest"
              >
                {deletingId === item.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#6B7280]">
              No scheme inquiries yet. Open a scheme and tap Send Inquiry.
            </p>
          ) : null}
        </div>
      ) : null}
    </SchemesShell>
  )
}
