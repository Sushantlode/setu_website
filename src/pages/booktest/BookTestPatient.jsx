import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useBookTest } from "../../context/BookTestContext"
import {
  addAddress,
  checkPincode,
  listAddresses,
  setDefaultAddress,
} from "../../api/booktest"
import BookTestShell, { BookTestPrimaryButton } from "../../components/booktest/BookTestShell"
import { productCode } from "../../utils/booktest"

const ACCENT = "#7C3AED"

export default function BookTestPatient() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { cartItems, setFlow } = useBookTest()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [form, setForm] = useState({
    name: session?.first_name || "",
    gender: "MALE",
    age: "",
    email: "",
    phone: session?.mobile || "",
    pincode: "",
    houseNumber: "",
    addressLine2: "",
    addressType: "home",
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list = await listAddresses(session, session.user_id)
        if (cancelled) return
        setAddresses(list || [])
        const def =
          list?.find((a) => a.isDefault || a.is_default) || list?.[0]
        if (def) {
          setSelectedAddressId(String(def.addressId || def.id))
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load addresses")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const continueWithAddress = (address) => {
    const items = cartItems.map((it) => ({ id: productCode(it) })).filter((x) => x.id)
    if (!items.length) {
      setError("Cart is empty. Add a package first.")
      return
    }
    if (!form.name.trim() || !form.age || !form.phone) {
      setError("Name, age and mobile are required.")
      return
    }
    setFlow({
      patient: {
        name: form.name.trim(),
        gender: form.gender,
        age: Number(form.age),
        ageType: "YEAR",
        email: form.email.trim(),
        contactNumber: form.phone.trim(),
      },
      address,
      cartProductCodes: items,
    })
    navigate("/app/book-tests/slots")
  }

  const handleContinueExisting = async () => {
    setError("")
    const address = addresses.find(
      (a) => String(a.addressId || a.id) === String(selectedAddressId),
    )
    if (!address) {
      setError("Select an address or add a new one.")
      return
    }
    try {
      await setDefaultAddress(session, {
        userId: session.user_id,
        addressId: address.addressId || address.id,
      })
    } catch {
      /* non-blocking */
    }
    continueWithAddress(address)
  }

  const handleAddAndContinue = async (e) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const pin = String(form.pincode).trim()
      if (!/^\d{6}$/.test(pin)) throw new Error("Enter a valid 6-digit pincode")
      const ok = await checkPincode(session, pin)
      if (!ok) throw new Error("Home collection is not available for this pincode")

      const saved = await addAddress(session, {
        user_id: session.user_id,
        pincode: pin,
        houseNumber: form.houseNumber.trim(),
        recipientName: form.name.trim(),
        phoneNumber: form.phone.trim(),
        addressType: "home",
        addressLine2: form.addressLine2.trim(),
      })
      const address = {
        ...(saved?.address || saved || {}),
        addressId: saved?.addressId || saved?.address?.addressId || saved?.id,
        pincode: pin,
        houseNumber: form.houseNumber.trim(),
        recipientName: form.name.trim(),
        phoneNumber: form.phone.trim(),
      }
      continueWithAddress(address)
    } catch (err) {
      setError(err.message || "Could not save address")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <BookTestShell title="Patient details" backTo="/app/book-tests/cart">
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-700" />
        </div>
      </BookTestShell>
    )
  }

  return (
    <BookTestShell title="Patient details" backTo="/app/book-tests/cart">
      <div className="space-y-5">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="rounded-3xl border border-violet-100 bg-white p-5">
          <h2 className="font-semibold text-setu-charcoal">Patient</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-setu-muted">Name</span>
              <input
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="text-setu-muted">Gender</span>
              <select
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-setu-muted">Age</span>
              <input
                type="number"
                min="1"
                max="120"
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="text-setu-muted">Mobile</span>
              <input
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-setu-muted">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </label>
          </div>
        </div>

        {addresses.length > 0 && (
          <div className="rounded-3xl border border-violet-100 bg-white p-5">
            <h2 className="font-semibold">Select address</h2>
            <div className="mt-3 space-y-2">
              {addresses.map((a) => {
                const id = String(a.addressId || a.id)
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer gap-3 rounded-2xl border px-3 py-3 text-sm ${
                      selectedAddressId === id
                        ? "border-violet-500 bg-violet-50"
                        : "border-violet-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === id}
                      onChange={() => setSelectedAddressId(id)}
                    />
                    <span>
                      <strong>{a.recipientName || a.name || "Address"}</strong>
                      <br />
                      {[a.houseNumber, a.addressLine2, a.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="mt-4">
              <BookTestPrimaryButton onClick={handleContinueExisting}>
                Continue with selected address
              </BookTestPrimaryButton>
            </div>
          </div>
        )}

        <form
          onSubmit={handleAddAndContinue}
          className="rounded-3xl border border-violet-100 bg-white p-5"
        >
          <h2 className="font-semibold">
            {addresses.length ? "Or add new address" : "Collection address"}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-setu-muted">Pincode</span>
              <input
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value)}
                maxLength={6}
                required={addresses.length === 0}
              />
            </label>
            <label className="text-sm">
              <span className="text-setu-muted">House / Flat</span>
              <input
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.houseNumber}
                onChange={(e) => update("houseNumber", e.target.value)}
                required={addresses.length === 0}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-setu-muted">Landmark / Area</span>
              <input
                className="mt-1 w-full rounded-xl border border-violet-100 px-3 py-2"
                value={form.addressLine2}
                onChange={(e) => update("addressLine2", e.target.value)}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: ACCENT }}
          >
            {saving ? "Saving…" : "Save address & continue"}
          </button>
        </form>
      </div>
    </BookTestShell>
  )
}
