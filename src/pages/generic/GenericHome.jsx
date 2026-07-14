import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Search, Upload } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useGenericMedicine } from "../../context/GenericMedicineContext"
import { useToast } from "../../components/ui/Toast"
import {
  addToCart,
  fetchCategories,
  fetchProductsByCategory,
  getCategoryImageUrl,
  searchAllProducts,
} from "../../api/generic"
import GenericShell, {
  GenericPrimaryButton,
  MedicineCard,
} from "../../components/generic/GenericShell"
import {
  ACCENT,
  FEATURED_CATEGORY_IDS,
  categoryId,
  categoryName,
  formatInr,
  productId,
  productName,
  productRate,
} from "../../utils/generic"

export default function GenericHome() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const { refreshCart } = useGenericMedicine()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const cats = await fetchCategories(session)
        if (cancelled) return
        setCategories(Array.isArray(cats) ? cats : [])

        const featuredEntries = await Promise.all(
          FEATURED_CATEGORY_IDS.map(async (id) => {
            try {
              const { products } = await fetchProductsByCategory(session, id, "1")
              return [id, (products || []).slice(0, 4)]
            } catch {
              return [id, []]
            }
          }),
        )
        if (!cancelled) setFeatured(Object.fromEntries(featuredEntries))
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load Generic Medicine")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      return undefined
    }
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchAllProducts(session, q)
        if (!cancelled) setSuggestions((results || []).slice(0, 10))
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query, session])

  const handleAdd = async (item) => {
    const id = productId(item)
    if (!id) return
    setAddingId(id)
    try {
      await addToCart(session, id, 1)
      await refreshCart()
      toast.success(`${productName(item)} added to cart`)
    } catch (err) {
      toast.error(err.message || "Could not add to cart")
    } finally {
      setAddingId("")
    }
  }

  return (
    <GenericShell title="Generic Medicine" backTo="/app">
      <div className="relative mb-5">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-400"
          size={18}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search branded or generic medicines"
          className="w-full rounded-2xl border border-teal-100 bg-white py-3 pl-10 pr-4 text-sm outline-none ring-teal-300 focus:ring-2"
        />
        {(searching || suggestions.length > 0 || query.trim().length >= 2) && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-lg">
            {searching && (
              <p className="flex items-center gap-2 px-4 py-3 text-sm text-setu-muted">
                <Loader2 className="animate-spin" size={14} /> Searching…
              </p>
            )}
            {!searching &&
              suggestions.map((s) => (
                <button
                  key={productId(s)}
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-teal-50"
                  onClick={() =>
                    navigate(`/app/generic-medicine/products/${encodeURIComponent(productId(s))}`)
                  }
                >
                  <span className="line-clamp-1 font-medium">{productName(s)}</span>
                  <span style={{ color: ACCENT }}>{formatInr(productRate(s))}</span>
                </button>
              ))}
            {!searching && query.trim().length >= 2 && suggestions.length === 0 && (
              <div className="px-4 py-3 text-sm">
                <p className="text-setu-muted">No medicines found.</p>
                <Link
                  to="/app/generic-medicine/requests"
                  state={{ medicineName: query.trim() }}
                  className="mt-1 inline-block font-semibold text-teal-700"
                >
                  Request this medicine
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          to="/app/generic-medicine/prescription"
          className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm"
        >
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: ACCENT }}
          >
            <Upload size={18} />
          </span>
          <span>
            <strong className="block text-sm">Upload Your Prescription</strong>
            <span className="text-xs text-setu-muted">Order with doctor Rx</span>
          </span>
        </Link>
        <Link
          to="/app/generic-medicine/compare"
          className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            VS
          </span>
          <span>
            <strong className="block text-sm">Branded vs Generic</strong>
            <span className="text-xs text-setu-muted">Compare & save</span>
          </span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-teal-700">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : (
        <>
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl">Categories</h2>
              <Link to="/app/generic-medicine/orders" className="text-xs font-semibold text-teal-700">
                My Orders
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {categories.slice(0, 24).map((c) => {
                const id = categoryId(c)
                const name = categoryName(c)
                return (
                  <button
                    key={id || name}
                    type="button"
                    onClick={() =>
                      navigate(`/app/generic-medicine/category/${encodeURIComponent(id)}`, {
                        state: { category: c },
                      })
                    }
                    className="flex flex-col items-center gap-2 rounded-2xl border border-teal-50 bg-white p-3 text-center shadow-sm hover:border-teal-200"
                  >
                    <img
                      src={getCategoryImageUrl(id)}
                      alt=""
                      className="h-12 w-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                    <span className="line-clamp-2 text-[11px] font-medium">{name}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {FEATURED_CATEGORY_IDS.map((id) => {
            const items = featured[id] || []
            if (!items.length) return null
            const cat = categories.find((c) => categoryId(c) === id)
            return (
              <section key={id} className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xl">
                    {categoryName(cat) || `Category ${id}`}
                  </h2>
                  <button
                    type="button"
                    className="text-xs font-semibold text-teal-700"
                    onClick={() =>
                      navigate(`/app/generic-medicine/category/${id}`, {
                        state: { category: cat || { category_id: id } },
                      })
                    }
                  >
                    See all
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((item) => (
                    <MedicineCard
                      key={productId(item)}
                      item={item}
                      adding={addingId === productId(item)}
                      onOpen={() =>
                        navigate(
                          `/app/generic-medicine/products/${encodeURIComponent(productId(item))}`,
                        )
                      }
                      onAdd={() => handleAdd(item)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          <GenericPrimaryButton onClick={() => navigate("/app/generic-medicine/compare")}>
            Compare branded vs generic
          </GenericPrimaryButton>
        </>
      )}
    </GenericShell>
  )
}
