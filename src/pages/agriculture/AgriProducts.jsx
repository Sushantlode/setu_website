import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Search } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  agriImage,
  fetchAgriCategories,
  fetchAgriProducts,
  formatInr,
} from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriProducts() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAgriCategories(auth).then(setCategories).catch(() => {})
  }, [session?.token])

  useEffect(() => {
    let cancel = false
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError("")
        const list = await fetchAgriProducts({
          category: category || undefined,
          search: search.trim() || undefined,
          limit: 50,
          ...auth,
        })
        if (!cancel) setProducts(list)
      } catch (err) {
        if (!cancel) setError(err.message || "Failed to load products")
      } finally {
        if (!cancel) setLoading(false)
      }
    }, search ? 350 : 0)
    return () => {
      cancel = true
      clearTimeout(timer)
    }
  }, [category, search, session?.token])

  const cats = useMemo(() => ["All", ...categories], [categories])

  return (
    <AgriShell title="Farming products" backTo="/app/agriculture">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5">
        <Search size={16} className="text-[#9CA3AF]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {cats.map((c) => {
          const value = c === "All" ? "" : c
          const active = category === value
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? "bg-[#1E6E33] text-white" : "bg-[#E6F3E8] text-[#1E6E33]"
              }`}
            >
              {c}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/app/agriculture/products/${p.id}`)}
              className="overflow-hidden rounded-2xl border border-[#D9E3D7] bg-white text-left shadow-sm"
            >
              <img
                src={agriImage(p.image_url || p.image_key, p.category)}
                alt=""
                className="h-32 w-full object-cover bg-[#E6F3E8]"
              />
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-semibold text-[#1E2E1F]">
                  {p.name}
                </p>
                {p.category ? (
                  <p className="mt-0.5 text-xs text-[#6E8371]">{p.category}</p>
                ) : null}
                <p className="mt-1 text-sm font-bold text-[#1E6E33]">
                  {formatInr(p.price)}
                </p>
              </div>
            </button>
          ))}
          {products.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-[#6E8371]">
              No products found.
            </p>
          ) : null}
        </div>
      ) : null}
    </AgriShell>
  )
}
