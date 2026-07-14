import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useBookTest } from "../../context/BookTestContext"
import {
  addToCart,
  fetchPackageDetails,
  fetchProducts,
  fetchSimilarPackages,
  saveForLater,
} from "../../api/booktest"
import BookTestShell, {
  BookTestPrimaryButton,
  PackageCard,
} from "../../components/booktest/BookTestShell"
import {
  productCode,
  productName,
  productTests,
  resolveProductPrice,
} from "../../utils/booktest"

function enrich(item) {
  return {
    ...item,
    _code: productCode(item),
    _name: productName(item),
    _price: resolveProductPrice(item),
    _tests: productTests(item),
  }
}

export function BookTestPackages() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const { refreshCart } = useBookTest()
  const category = location.state?.category || { name: "WELLNESS", code: "WELLNESS" }
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [addingCode, setAddingCode] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const products = await fetchProducts(session, {
          productType: "profile",
          category: category.name || category.code,
        })
        if (!cancelled) setItems((products || []).map(enrich))
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load packages")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session, category.name, category.code])

  const handleAdd = async (item) => {
    setAddingCode(item._code)
    try {
      await addToCart(session, {
        userId: session.user_id,
        productCode: item._code,
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
    <BookTestShell title={category.name || category.code || "Packages"}>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-700" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-setu-muted">No packages found in this category.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <PackageCard
              key={item._code}
              item={item}
              adding={addingCode === item._code}
              onOpen={() =>
                navigate(`/app/book-tests/packages/${encodeURIComponent(item._code)}`)
              }
              onAdd={() => handleAdd(item)}
            />
          ))}
        </div>
      )}
    </BookTestShell>
  )
}

export function BookTestPackageDetail() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { refreshCart } = useBookTest()
  const [pkg, setPkg] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [openTests, setOpenTests] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const [detail, sims] = await Promise.all([
          fetchPackageDetails(session, { userId: session.user_id, code }),
          fetchSimilarPackages(session, { userId: session.user_id, code }).catch(() => []),
        ])
        if (cancelled) return
        const packageObj =
          detail?.package ||
          detail?.product ||
          detail?.data ||
          detail ||
          {}
        setPkg(enrich(packageObj))
        setSimilar((sims || []).map(enrich))
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load package")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session, code])

  const handleAdd = async () => {
    if (!pkg?._code) return
    setBusy("add")
    try {
      await addToCart(session, {
        userId: session.user_id,
        productCode: pkg._code,
        quantity: 1,
      })
      await refreshCart()
      navigate("/app/book-tests/cart")
    } catch (err) {
      alert(err.message || "Could not add to cart")
    } finally {
      setBusy("")
    }
  }

  const handleSave = async () => {
    if (!pkg?._code) return
    setBusy("save")
    try {
      await saveForLater(session, pkg._code)
      alert("Saved for later")
    } catch (err) {
      alert(err.message || "Could not save")
    } finally {
      setBusy("")
    }
  }

  return (
    <BookTestShell title="Package details" backTo="/app/book-tests/packages">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-700" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !pkg ? (
        <p className="text-sm text-setu-muted">Package not found.</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
            <h2 className="font-display text-2xl text-setu-charcoal">{pkg._name}</h2>
            <p className="mt-2 text-2xl font-bold text-violet-700">₹{pkg._price}</p>
            <p className="mt-1 text-sm text-setu-muted">
              includes {pkg._tests.length || "—"} tests
            </p>
            <div className="mt-4 flex gap-2">
              <BookTestPrimaryButton onClick={handleAdd} disabled={busy === "add"}>
                {busy === "add" ? "Adding…" : "Add To Cart"}
              </BookTestPrimaryButton>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy === "save"}
                className="min-h-12 rounded-2xl border border-violet-200 px-4 text-sm font-semibold text-violet-800"
              >
                Save for Later
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white p-5">
            <button
              type="button"
              className="flex w-full items-center justify-between font-semibold"
              onClick={() => setOpenTests((v) => !v)}
            >
              <span>Tests included</span>
              <span className="text-violet-600">{openTests ? "−" : "+"}</span>
            </button>
            {openTests && (
              <ul className="mt-3 space-y-2 text-sm text-setu-muted">
                {(pkg._tests.length ? pkg._tests : [{ name: "Details unavailable" }]).map(
                  (t, i) => (
                    <li key={i} className="rounded-xl bg-violet-50/60 px-3 py-2">
                      {t?.name || t?.testName || t}
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>

          {similar.length > 0 && (
            <section>
              <h3 className="mb-3 font-display text-xl">Similar packages</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {similar.map((item) => (
                  <PackageCard
                    key={item._code}
                    item={item}
                    onOpen={() =>
                      navigate(
                        `/app/book-tests/packages/${encodeURIComponent(item._code)}`,
                      )
                    }
                    onAdd={async () => {
                      await addToCart(session, {
                        userId: session.user_id,
                        productCode: item._code,
                        quantity: 1,
                      })
                      await refreshCart()
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </BookTestShell>
  )
}
