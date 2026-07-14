import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2, Minus, Plus } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useGenericMedicine } from "../../context/GenericMedicineContext"
import { useToast } from "../../components/ui/Toast"
import {
  addToCart,
  fetchProductDetails,
  fetchProductsByCategory,
  getProductImageUrl,
} from "../../api/generic"
import GenericShell, {
  GenericPrimaryButton,
  MedicineCard,
} from "../../components/generic/GenericShell"
import {
  ACCENT,
  categoryName,
  formatInr,
  isNotForOnlineSale,
  isOutOfStock,
  maxOrderQty,
  prescriptionStatus,
  productDiscount,
  productId,
  productMrp,
  productName,
  productRate,
} from "../../utils/generic"

export function GenericCategory() {
  const { categoryId: catId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const { refreshCart } = useGenericMedicine()
  const category = location.state?.category
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [addingId, setAddingId] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetchProductsByCategory(session, catId, String(page))
        if (cancelled) return
        setProducts((prev) => (page === 1 ? res.products : [...prev, ...res.products]))
        setPages(Number(res.pages) || 1)
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load products")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session, catId, page])

  const handleAdd = async (item) => {
    const id = productId(item)
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
    <GenericShell title={categoryName(category) || "Products"}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading && page === 1 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-700" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((item) => (
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
          {page < pages && (
            <button
              type="button"
              className="mt-4 w-full rounded-2xl border border-teal-200 py-3 text-sm font-semibold text-teal-800"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </GenericShell>
  )
}

export function GenericProductDetail() {
  const { productId: pid } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const { refreshCart } = useGenericMedicine()
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const detail = await fetchProductDetails(session, pid)
        if (!cancelled) {
          setProduct(detail)
          setQty(1)
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load product")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session, pid])

  if (loading) {
    return (
      <GenericShell title="Product details">
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-700" />
        </div>
      </GenericShell>
    )
  }

  if (error || !product) {
    return (
      <GenericShell title="Product details">
        <p className="text-sm text-red-600">{error || "Product not found"}</p>
      </GenericShell>
    )
  }

  const max = maxOrderQty(product)
  const blocked = isOutOfStock(product) || isNotForOnlineSale(product)
  const similar = Array.isArray(product.similar_product) ? product.similar_product : []
  const img = getProductImageUrl(product)
  const rx = prescriptionStatus(product)

  const handleAdd = async () => {
    if (blocked) {
      toast.error(
        isOutOfStock(product) ? "Out of stock" : "Not available for online sale",
      )
      return
    }
    setBusy(true)
    try {
      await addToCart(session, productId(product) || pid, qty)
      await refreshCart()
      toast.success(`${productName(product)} added to cart`)
      navigate("/app/generic-medicine/cart")
    } catch (err) {
      toast.error(err.message || "Could not add to cart")
    } finally {
      setBusy(false)
    }
  }

  return (
    <GenericShell title="Product details">
      <div className="space-y-5">
        <div className="rounded-3xl border border-teal-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-teal-50">
            {img ? (
              <img
                src={img}
                alt=""
                className="max-h-36 max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            ) : (
              <span className="text-teal-600">SETU</span>
            )}
          </div>
          <h2 className="font-display text-2xl">{productName(product)}</h2>
          <p className="mt-1 text-sm text-setu-muted">
            {product.product_mfg_name} · {product.packing_type || product.packaging_type}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: ACCENT }}>
              {formatInr(productRate(product))}
            </span>
            {productMrp(product) > productRate(product) && (
              <span className="text-sm text-setu-muted line-through">
                {formatInr(productMrp(product))}
              </span>
            )}
            {productDiscount(product) > 0 && (
              <span className="text-sm font-semibold text-emerald-600">
                {productDiscount(product)}% off
              </span>
            )}
          </div>
          {rx !== "0" && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Prescription required
            </p>
          )}
          {blocked && (
            <p className="mt-2 text-sm text-red-600">
              {isOutOfStock(product) ? "Out of stock" : "Not available for online sale"}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-50"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center font-semibold">{qty}</span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-50"
              onClick={() => setQty((q) => Math.min(max, q + 1))}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="mt-4">
            <GenericPrimaryButton onClick={handleAdd} disabled={busy || blocked}>
              {busy ? "Adding…" : "Add to cart"}
            </GenericPrimaryButton>
          </div>
        </div>

        {[
          ["Introduction", product.ProductIntro],
          ["Indication", product.ProductIndication],
          ["Administration", product.ProductAdministation],
          ["Side effects", product.ProductSideEffects],
          ["Storage", product.ProductStorage],
          ["Safety advice", product.ProductSafetyAdvice],
        ]
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-teal-100 bg-white p-4">
              <h3 className="font-semibold">{label}</h3>
              <p className="mt-2 text-sm text-setu-muted whitespace-pre-wrap">{value}</p>
            </div>
          ))}

        {similar.length > 0 && (
          <section>
            <h3 className="mb-3 font-display text-xl">Similar / substitutes</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {similar.map((item) => (
                <MedicineCard
                  key={productId(item)}
                  item={item}
                  onOpen={() =>
                    navigate(
                      `/app/generic-medicine/products/${encodeURIComponent(productId(item))}`,
                    )
                  }
                  onAdd={async () => {
                    try {
                      await addToCart(session, productId(item), 1)
                      await refreshCart()
                      toast.success(`${productName(item)} added to cart`)
                    } catch (err) {
                      toast.error(err.message || "Could not add to cart")
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </GenericShell>
  )
}
