import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  agriImage,
  cartItems,
  fetchAgriCart,
  formatInr,
  removeAgriCartItem,
  updateAgriCartItem,
} from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriCart() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }

  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    if (!auth.token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError("")
      setCart(await fetchAgriCart(auth))
    } catch (err) {
      setError(err.message || "Failed to load cart")
    } finally {
      setLoading(false)
    }
  }, [session?.token, session?.refreshToken])

  useEffect(() => {
    load()
  }, [load])

  const items = cartItems(cart)
  const total = items.reduce(
    (sum, row) =>
      sum + Number(row.price ?? row.product?.price ?? 0) * Number(row.quantity || 1),
    0,
  )

  if (!auth.token) {
    return (
      <AgriShell title="Cart" backTo="/app/agriculture">
        <p className="text-sm text-[#6E8371]">Sign in to view your cart.</p>
        <Link
          to="/login"
          state={{ from: "/app/agriculture/cart" }}
          className="mt-4 inline-flex rounded-full bg-[#307E33] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </AgriShell>
    )
  }

  return (
    <AgriShell title="Cart" backTo="/app/agriculture">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <div className="space-y-3">
          {items.map((row) => {
            const product = row.product || {}
            const name = product.name || row.product_name || "Product"
            const price = Number(row.price ?? product.price ?? 0)
            return (
              <div
                key={row.id}
                className="flex gap-3 rounded-2xl border border-[#D9E3D7] bg-white p-3 shadow-sm"
              >
                <img
                  src={agriImage(
                    product.image_url || product.image_key,
                    product.category,
                  )}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover bg-[#E6F3E8]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1E2E1F]">{name}</p>
                  <p className="text-sm text-[#1E6E33]">{formatInr(price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded border px-2"
                      onClick={async () => {
                        const next = Math.max(1, Number(row.quantity || 1) - 1)
                        setBusyId(row.id)
                        try {
                          await updateAgriCartItem(row.id, next, auth)
                          await load()
                        } catch (err) {
                          setError(err.message)
                        } finally {
                          setBusyId(null)
                        }
                      }}
                    >
                      −
                    </button>
                    <span className="text-sm font-medium">{row.quantity}</span>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="rounded border px-2"
                      onClick={async () => {
                        setBusyId(row.id)
                        try {
                          await updateAgriCartItem(
                            row.id,
                            Number(row.quantity || 1) + 1,
                            auth,
                          )
                          await load()
                        } catch (err) {
                          setError(err.message)
                        } finally {
                          setBusyId(null)
                        }
                      }}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto p-2 text-[#9CA3AF] hover:text-red-600"
                      onClick={async () => {
                        setBusyId(row.id)
                        try {
                          await removeAgriCartItem(row.id, auth)
                          await load()
                        } catch (err) {
                          setError(err.message)
                        } finally {
                          setBusyId(null)
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6E8371]">
              Your cart is empty.
            </p>
          ) : null}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-[#D9E3D7] bg-white p-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-[#1E6E33]">{formatInr(total)}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/agriculture/checkout")}
            className="mt-4 w-full rounded-full bg-[#307E33] py-3 text-sm font-semibold text-white"
          >
            Checkout
          </button>
        </div>
      ) : null}
    </AgriShell>
  )
}
