import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Search } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useBookTest } from "../../context/BookTestContext"
import {
  addToCart,
  fetchDiseases,
  fetchProducts,
  searchBookTests,
} from "../../api/booktest"
import BookTestShell, { PackageCard } from "../../components/booktest/BookTestShell"
import {
  CAROUSEL_DATA,
  FEATURED_CATEGORIES,
  categoryImageUrl,
  diseaseCode,
  diseaseLabel,
  productCode,
  productName,
  productTests,
  resolveProductPrice,
} from "../../utils/booktest"

const ACCENT = "#7C3AED"

function enrich(item) {
  return {
    ...item,
    _code: productCode(item),
    _name: productName(item),
    _price: resolveProductPrice(item),
    _tests: productTests(item),
  }
}

export default function BookTestHome() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { refreshCart } = useBookTest()
  const [diseases, setDiseases] = useState([])
  const [featured, setFeatured] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingCode, setAddingCode] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const list = await fetchDiseases(session)
        if (cancelled) return
        const filtered = (list || []).filter(
          (d) => Number(d?.productCount ?? d?.count ?? 1) > 0,
        )
        setDiseases(filtered)

        const featuredEntries = await Promise.all(
          FEATURED_CATEGORIES.map(async (c) => {
            try {
              const products = await fetchProducts(session, {
                productType: "profile",
                category: c.key,
              })
              return [c.key, (products || []).slice(0, 4).map(enrich)]
            } catch {
              return [c.key, []]
            }
          }),
        )
        if (!cancelled) setFeatured(Object.fromEntries(featuredEntries))
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load Book Test home")
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
    const id = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % CAROUSEL_DATA.length)
    }, 4500)
    return () => clearInterval(id)
  }, [])

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
        const results = await searchBookTests(session, q)
        if (!cancelled) setSuggestions((results || []).slice(0, 8).map(enrich))
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

  const visibleDiseases = useMemo(() => diseases.slice(0, 24), [diseases])

  const openCategory = (category) => {
    navigate(`/app/book-tests/packages`, {
      state: { category: { code: category, name: category } },
    })
  }

  const handleAdd = async (item) => {
    const code = item._code
    if (!code || !session?.user_id) return
    setAddingCode(code)
    try {
      await addToCart(session, {
        userId: session.user_id,
        productCode: code,
        quantity: 1,
      })
      await refreshCart()
    } catch (err) {
      alert(err.message || "Could not add to cart")
    } finally {
      setAddingCode("")
    }
  }

  return (
    <BookTestShell title="Book Test" backTo="/app">
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lab tests & packages"
          className="w-full rounded-2xl border border-violet-100 bg-white py-3 pl-10 pr-4 text-sm outline-none ring-violet-300 focus:ring-2"
        />
        {(searching || suggestions.length > 0) && query.trim().length >= 2 && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg">
            {searching && (
              <p className="flex items-center gap-2 px-4 py-3 text-sm text-setu-muted">
                <Loader2 className="animate-spin" size={14} /> Searching…
              </p>
            )}
            {!searching &&
              suggestions.map((s) => (
                <button
                  key={s._code || s._name}
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-violet-50"
                  onClick={() =>
                    navigate(`/app/book-tests/packages/${encodeURIComponent(s._code)}`, {
                      state: { package: s },
                    })
                  }
                >
                  <span className="line-clamp-1 font-medium">{s._name}</span>
                  {s._price > 0 ? (
                    <span className="shrink-0 pl-3 font-semibold" style={{ color: ACCENT }}>
                      ₹{s._price}
                    </span>
                  ) : null}
                </button>
              ))}
            {!searching && suggestions.length === 0 && (
              <p className="px-4 py-3 text-sm text-setu-muted">No packages found</p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-violet-700">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : (
        <>
          <section className="relative mb-6 overflow-hidden rounded-3xl">
            <img
              src={CAROUSEL_DATA[carouselIndex].image}
              alt=""
              className="h-44 w-full object-cover sm:h-56"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20 p-5 text-white">
              <p className="text-xs uppercase tracking-wider text-violet-200">Featured</p>
              <h2 className="mt-1 font-display text-2xl">
                {CAROUSEL_DATA[carouselIndex].title}
              </h2>
              <p className="mt-1 max-w-md text-sm text-white/85">
                {CAROUSEL_DATA[carouselIndex].desc}
              </p>
              <button
                type="button"
                onClick={() => openCategory(CAROUSEL_DATA[carouselIndex].category)}
                className="mt-3 rounded-xl px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Explore
              </button>
            </div>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {CAROUSEL_DATA.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setCarouselIndex(i)}
                  className={`h-1.5 rounded-full transition ${
                    i === carouselIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl text-setu-charcoal">Popular Lab Tests</h2>
              <Link to="/app/book-tests/orders" className="text-xs font-semibold text-violet-700">
                My Orders
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {visibleDiseases.map((d) => {
                const code = diseaseCode(d)
                const label = diseaseLabel(d)
                return (
                  <button
                    key={code || label}
                    type="button"
                    onClick={() => openCategory(code || label)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-violet-50 bg-white p-3 text-center shadow-sm transition hover:border-violet-200"
                  >
                    <img
                      src={categoryImageUrl(code || label)}
                      alt=""
                      className="h-12 w-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = categoryImageUrl("WELLNESS")
                      }}
                    />
                    <span className="line-clamp-2 text-[11px] font-medium text-setu-charcoal">
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {FEATURED_CATEGORIES.map((cat) => {
            const items = featured[cat.key] || []
            if (!items.length) return null
            return (
              <section key={cat.key} className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xl text-setu-charcoal">{cat.title}</h2>
                  <button
                    type="button"
                    onClick={() => openCategory(cat.key)}
                    className="text-xs font-semibold text-violet-700"
                  >
                    See all
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => (
                    <PackageCard
                      key={item._code}
                      item={item}
                      adding={addingCode === item._code}
                      onOpen={() =>
                        navigate(
                          `/app/book-tests/packages/${encodeURIComponent(item._code)}`,
                          { state: { package: item } },
                        )
                      }
                      onAdd={() => handleAdd(item)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}
    </BookTestShell>
  )
}
