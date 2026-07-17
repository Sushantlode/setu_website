import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useBookTest } from "../../context/BookTestContext"
import {
  addToCart,
  listSavedForLater,
  removeSavedForLater,
} from "../../api/booktest"
import BookTestShell, { PackageCard } from "../../components/booktest/BookTestShell"
import {
  productCode,
  productName,
  productTests,
  resolveProductPrice,
} from "../../utils/booktest"

function enrich(item) {
  const product = item?.product || item
  return {
    ...product,
    _code: productCode(product) || productCode(item) || item?.product_code,
    _name: productName(product) || item?.name,
    _price: resolveProductPrice(product),
    _tests: productTests(product),
  }
}

export default function BookTestSaved() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { refreshCart } = useBookTest()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const list = await listSavedForLater(session)
      setItems((list || []).map(enrich))
    } catch (err) {
      setError(err.message || "Could not load saved packages")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  return (
    <BookTestShell title="Saved for later" backTo="/app/book-tests/home">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-700" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-setu-muted">
          No saved packages yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item._code} className="space-y-2">
              <PackageCard
                item={item}
                adding={busy === item._code}
                onOpen={() =>
                  navigate(`/app/book-tests/packages/${encodeURIComponent(item._code)}`, {
                    state: { package: item },
                  })
                }
                onAdd={async () => {
                  setBusy(item._code)
                  try {
                    await addToCart(session, {
                      userId: session.user_id,
                      productCode: item._code,
                      quantity: 1,
                    })
                    await refreshCart()
                    await removeSavedForLater(session, item._code)
                    await load()
                  } catch (err) {
                    alert(err.message || "Could not move to cart")
                  } finally {
                    setBusy("")
                  }
                }}
              />
              <button
                type="button"
                className="text-xs font-semibold text-red-600"
                onClick={async () => {
                  await removeSavedForLater(session, item._code)
                  await load()
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </BookTestShell>
  )
}
