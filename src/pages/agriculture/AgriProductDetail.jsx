import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Loader2, ShoppingCart } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  addToAgriCart,
  agriImage,
  fetchAgriProduct,
  formatInr,
} from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }

  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        setLoading(true)
        setError("")
        const data = await fetchAgriProduct(id, auth)
        if (!cancel) setProduct(data)
      } catch (err) {
        if (!cancel) setError(err.message || "Failed to load product")
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [id, session?.token])

  const handleAdd = async () => {
    if (!auth.token) {
      navigate("/login", { state: { from: `/app/agriculture/products/${id}` } })
      return
    }
    setAdding(true)
    setError("")
    setOk("")
    try {
      await addToAgriCart(product.id, qty, auth)
      setOk("Added to cart")
    } catch (err) {
      setError(err.message || "Could not add to cart")
    } finally {
      setAdding(false)
    }
  }

  return (
    <AgriShell
      title="Product"
      backTo="/app/agriculture/products"
      rightAction={
        <button
          type="button"
          onClick={() => navigate("/app/agriculture/cart")}
          className="rounded-lg p-1.5 text-white hover:bg-white/10"
        >
          <ShoppingCart size={18} />
        </button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      {ok ? <p className="mb-3 text-sm text-green-700">{ok}</p> : null}

      {product && !loading ? (
        <>
          <img
            src={agriImage(product.image_url || product.image_key, product.category)}
            alt=""
            className="mb-4 h-56 w-full rounded-2xl object-cover bg-[#E6F3E8]"
          />
          <h2 className="text-xl font-bold text-[#1E2E1F]">{product.name}</h2>
          {product.category ? (
            <p className="mt-1 text-sm text-[#6E8371]">{product.category}</p>
          ) : null}
          <p className="mt-2 text-2xl font-bold text-[#1E6E33]">
            {formatInr(product.price)}
          </p>
          {product.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
              {product.description}
            </p>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-[#D9E3D7] bg-white">
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={adding}
              onClick={handleAdd}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#307E33] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {adding ? <Loader2 className="animate-spin" size={16} /> : null}
              Add to cart
            </button>
          </div>
        </>
      ) : null}
    </AgriShell>
  )
}
