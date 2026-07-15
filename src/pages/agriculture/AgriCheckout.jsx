import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Plus } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  RAZORPAY_KEY_ID,
  checkoutAgriOrder,
  createAgriAddress,
  fetchAgriAddresses,
  verifyAgriPayment,
} from "../../api/agri"
import { AgriShell } from "./AgriShell"

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error("Could not load Razorpay"))
    document.body.appendChild(script)
  })
}

function openRazorpayCheckout(options) {
  return new Promise((resolve, reject) => {
    loadRazorpayScript()
      .then((Razorpay) => {
        const rzp = new Razorpay({
          ...options,
          handler: (response) => resolve(response),
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        })
        rzp.on("payment.failed", (resp) => {
          reject(new Error(resp?.error?.description || "Payment failed"))
        })
        rzp.open()
      })
      .catch(reject)
  })
}

const emptyAddress = {
  country: "India",
  state: "",
  district: "",
  pincode: "",
  village: "",
  current_address: "",
  is_default: true,
}

export default function AgriCheckout() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }

  const [addresses, setAddresses] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyAddress)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const list = await fetchAgriAddresses(auth)
      setAddresses(list)
      if (list[0]?.id) setSelectedId(list[0].id)
    } catch (err) {
      setError(err.message || "Failed to load addresses")
    } finally {
      setLoading(false)
    }
  }, [session?.token])

  useEffect(() => {
    if (!auth.token) {
      navigate("/login", { state: { from: "/app/agriculture/checkout" } })
      return
    }
    load()
  }, [auth.token, load, navigate])

  const saveAddress = async (e) => {
    e.preventDefault()
    if (!form.state || !form.district || !form.pincode) {
      setError("State, district and pincode are required.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const created = await createAgriAddress(form, auth)
      setFormOpen(false)
      setForm(emptyAddress)
      await load()
      if (created?.id) setSelectedId(created.id)
    } catch (err) {
      setError(err.message || "Failed to save address")
    } finally {
      setSaving(false)
    }
  }

  const pay = async () => {
    if (!selectedId) {
      setError("Select a delivery address.")
      return
    }
    setPaying(true)
    setError("")
    try {
      const checkout = await checkoutAgriOrder({ addressId: selectedId }, auth)
      const amountPaise = Math.round(
        Number(checkout.amount || checkout.total_amount || checkout.total || 0) *
          (Number(checkout.amount) > 1000 ? 1 : 100),
      )
      // Backend may return amount already in paise or rupees
      const amount =
        checkout.amount_paise ||
        (checkout.currency_unit === "paise"
          ? Number(checkout.amount)
          : Math.round(Number(checkout.amount || checkout.total_amount || 0) * 100))

      const orderId =
        checkout.razorpay_order_id ||
        checkout.order_id_razorpay ||
        checkout.razorpayOrderId

      const payment = await openRazorpayCheckout({
        key: checkout.key_id || RAZORPAY_KEY_ID,
        amount: amount || amountPaise,
        currency: checkout.currency || "INR",
        name: "SETU Agri Connect",
        description: "Farming products order",
        order_id: orderId || undefined,
        prefill: {
          name: session?.first_name || "",
          contact: session?.mobile || "",
        },
        theme: { color: "#1E6E33" },
      })

      await verifyAgriPayment(
        {
          order_id: checkout.order_id || checkout.id,
          payment_id: payment.razorpay_payment_id,
          payment_status: "paid",
        },
        auth,
      )

      navigate("/app/agriculture/orders", {
        state: { notice: "Order placed successfully." },
      })
    } catch (err) {
      setError(err.message || "Checkout failed")
    } finally {
      setPaying(false)
    }
  }

  return (
    <AgriShell title="Checkout" backTo="/app/agriculture/cart">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1E6E33]" size={28} />
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1E2E1F]">Delivery address</h2>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E6E33]"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-2xl border bg-white p-4 ${
                  selectedId === a.id
                    ? "border-[#1E6E33]"
                    : "border-[#D9E3D7]"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                />
                <span className="text-sm text-[#1E2E1F]">
                  {[a.current_address, a.village, a.district, a.state, a.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </label>
            ))}
            {addresses.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#6E8371]">
                Add an address to continue.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={paying || !selectedId}
            onClick={pay}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#307E33] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {paying ? <Loader2 className="animate-spin" size={16} /> : null}
            Pay with Razorpay
          </button>
        </>
      ) : null}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <form
            onSubmit={saveAddress}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5"
          >
            <h3 className="text-lg font-semibold">New address</h3>
            {[
              ["state", "State"],
              ["district", "District"],
              ["pincode", "Pincode"],
              ["village", "Village"],
              ["current_address", "Address line"],
            ].map(([key, label]) => (
              <label key={key} className="mt-3 block text-sm">
                <span className="mb-1 block font-medium">{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#D9E3D7] px-3 py-2.5 outline-none focus:border-[#1E6E33]"
                />
              </label>
            ))}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 rounded-xl border py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#307E33] py-2.5 text-sm font-semibold text-white"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AgriShell>
  )
}
