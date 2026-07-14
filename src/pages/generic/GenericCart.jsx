import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Minus, Plus, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useGenericMedicine } from "../../context/GenericMedicineContext"
import { useToast } from "../../components/ui/Toast"
import {
  FormErrorBanner,
  FormTextField,
  FormSelectField,
  FormTextAreaField,
} from "../../components/ui/FormField"
import {
  addAddress,
  addToCart,
  deleteAddress,
  fetchAddressList,
  fetchCities,
  fetchDistricts,
  fetchStates,
  removeCartItem,
  submitCart,
} from "../../api/generic"
import GenericShell, {
  CartBillSummary,
  GenericPrimaryButton,
} from "../../components/generic/GenericShell"
import {
  ACCENT,
  ADDRESS_TYPES,
  LAST_DOCTOR_VISIT_OPTIONS,
  MEDICINE_CONSUME_OPTIONS,
  MIN_CART_ORDER_TOTAL,
  PRE_FOR_OPTIONS,
  cartLineQty,
  computeCartBill,
  formatInr,
  locationName,
  locationUuid,
  meetsMinCart,
  productId,
  productMrp,
  productName,
  productRate,
} from "../../utils/generic"
import {
  digitsOnly,
  mobile10,
  numberRange,
  pincode,
  required,
  validateForm,
} from "../../utils/validation"

const ADDR_SCHEMA = {
  name: [required("Enter name")],
  mobile: [mobile10()],
  pincode: [pincode()],
  address: [required("Enter full address")],
  fk_state_uuid4: [required("Select state")],
  fk_district_uuid4: [required("Select district")],
  fk_city_uuid4: [required("Select city")],
}

const RX_SCHEMA = {
  patient_name: [required("Patient name is required")],
  patient_age: [required("Age is required"), numberRange(1, 120, "Enter a valid age")],
  dosage: [required("Dosage is required")],
}

export default function GenericCart() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const {
    cartItems,
    orderId,
    prescriptionNeeded,
    prescriptionMessage,
    cartLoading,
    refreshCart,
    setFlow,
  } = useGenericMedicine()

  const [busyId, setBusyId] = useState("")
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addrErrors, setAddrErrors] = useState({})
  const [rxErrors, setRxErrors] = useState({})
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [cities, setCities] = useState([])
  const [addrForm, setAddrForm] = useState({
    name: session?.first_name || "",
    mobile: session?.mobile || "",
    address: "",
    pincode: "",
    landmark: "",
    address_type_id: "1",
    fk_state_uuid4: "",
    fk_district_uuid4: "",
    fk_city_uuid4: "",
  })
  const [rxForm, setRxForm] = useState({
    pre_for_id: "1",
    patient_name: session?.first_name || "",
    patient_age: "",
    dosage: "",
    allergies: "",
    last_doctor_visit_id: "1",
    medicine_consume_id: "1",
    order_note: "",
  })

  const bill = useMemo(() => computeCartBill(cartItems), [cartItems])
  const needsRx = prescriptionNeeded === "1" || prescriptionNeeded === "2"

  useEffect(() => {
    if (!session?.token) return
    fetchAddressList(session)
      .then((list) => {
        setAddresses(list || [])
        if (list?.[0]) setSelectedAddressId(String(list[0].address_id || list[0].id))
      })
      .catch(() => setAddresses([]))
    fetchStates(session).then(setStates).catch(() => setStates([]))
  }, [session])

  useEffect(() => {
    if (!addrForm.fk_state_uuid4) {
      setDistricts([])
      return
    }
    fetchDistricts(session, addrForm.fk_state_uuid4)
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [session, addrForm.fk_state_uuid4])

  useEffect(() => {
    if (!addrForm.fk_district_uuid4) {
      setCities([])
      return
    }
    fetchCities(session, addrForm.fk_district_uuid4)
      .then(setCities)
      .catch(() => setCities([]))
  }, [session, addrForm.fk_district_uuid4])

  const updateQty = async (item, nextQty) => {
    const id = productId(item)
    setBusyId(id)
    try {
      if (nextQty <= 0) {
        await removeCartItem(session, id)
        toast.info("Removed from cart")
      } else {
        await addToCart(session, id, nextQty)
      }
      await refreshCart()
    } catch (err) {
      toast.error(err.message || "Could not update cart")
    } finally {
      setBusyId("")
    }
  }

  const saveAddress = async (e) => {
    e.preventDefault()
    setError("")
    const { ok, errors } = validateForm(addrForm, ADDR_SCHEMA)
    setAddrErrors(errors)
    if (!ok) {
      toast.error("Please fix the address form")
      return
    }
    try {
      const saved = await addAddress(session, {
        ...addrForm,
        mobile: digitsOnly(addrForm.mobile, 10),
        latitude: "0",
        longitude: "0",
      })
      const list = await fetchAddressList(session)
      setAddresses(list || [])
      const newId = String(
        saved?.address_id || saved?.id || list?.[list.length - 1]?.address_id || "",
      )
      if (newId) setSelectedAddressId(newId)
      setShowAddressForm(false)
      setAddrErrors({})
      toast.success("Address saved")
    } catch (err) {
      const msg = err.message || "Could not save address"
      setError(msg)
      toast.error(msg)
    }
  }

  const handleSubmit = async () => {
    setError("")
    setRxErrors({})
    if (!meetsMinCart(bill.totalPayable)) {
      const msg = `Minimum order value is ₹${MIN_CART_ORDER_TOTAL}`
      setError(msg)
      toast.error(msg)
      return
    }
    if (!selectedAddressId) {
      const msg = "Select a delivery address"
      setError(msg)
      toast.error(msg)
      return
    }
    if (!orderId) {
      const msg = "Cart order id missing. Refresh cart and try again."
      setError(msg)
      toast.error(msg)
      return
    }
    if (needsRx) {
      const { ok, errors } = validateForm(rxForm, RX_SCHEMA)
      setRxErrors(errors)
      if (!ok) {
        toast.error("Please complete prescription details")
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        order_id: orderId,
        address_id: selectedAddressId,
      }
      if (prescriptionNeeded === "1") {
        Object.assign(payload, {
          pre_for_id: rxForm.pre_for_id,
          patient_name: rxForm.patient_name,
          patient_age: rxForm.patient_age,
          dosage: rxForm.dosage,
          allergies: rxForm.allergies,
          last_doctor_visit_id: rxForm.last_doctor_visit_id,
          medicine_consume_id: rxForm.medicine_consume_id,
          order_note: rxForm.order_note,
        })
      }
      if (prescriptionNeeded === "2") {
        Object.assign(payload, {
          prescription_needed: "2",
          pre_for_id: rxForm.pre_for_id,
          patient_name: rxForm.patient_name,
          patient_age: rxForm.patient_age,
          dosage: rxForm.dosage,
          last_doctor_visit_id: rxForm.last_doctor_visit_id,
          medicine_consume_id: rxForm.medicine_consume_id,
        })
      }

      const result = await submitCart(session, payload)
      const newOrderId =
        result?.order_id ||
        result?.OrderID ||
        result?.data?.order_id ||
        result?.data?.OrderID ||
        orderId
      setFlow({ lastOrderId: newOrderId })
      await refreshCart()
      toast.success("Order placed")
      navigate(`/app/generic-medicine/orders/${encodeURIComponent(newOrderId)}`)
    } catch (err) {
      const msg = err.message || "Could not place order"
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const setAddr = (key, value) => {
    setAddrForm((f) => ({ ...f, [key]: value }))
    setAddrErrors((e) => ({ ...e, [key]: "" }))
  }

  const setRx = (key, value) => {
    setRxForm((f) => ({ ...f, [key]: value }))
    setRxErrors((e) => ({ ...e, [key]: "" }))
  }

  return (
    <GenericShell title="Cart" backTo="/app/generic-medicine/home">
      {cartLoading && cartItems.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-700" />
        </div>
      ) : cartItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-teal-200 bg-white p-8 text-center">
          <p className="font-semibold">Your cart is empty</p>
          <Link
            to="/app/generic-medicine/home"
            className="mt-4 inline-flex rounded-2xl px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: ACCENT }}
          >
            Browse medicines
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <FormErrorBanner>{error}</FormErrorBanner>
          {prescriptionMessage && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {prescriptionMessage}
            </p>
          )}

          {cartItems.map((item) => {
            const id = productId(item)
            const qty = cartLineQty(item)
            return (
              <div
                key={id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-teal-100 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold line-clamp-2">{productName(item)}</h3>
                  <p className="mt-1 text-sm">
                    <span style={{ color: ACCENT }}>{formatInr(productRate(item))}</span>{" "}
                    <span className="text-xs text-setu-muted line-through">
                      {formatInr(productMrp(item))}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === id}
                    onClick={() => updateQty(item, qty - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50"
                  >
                    {qty <= 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    disabled={busyId === id}
                    onClick={() => updateQty(item, qty + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          <CartBillSummary bill={bill} />

          {needsRx && (
            <div className="rounded-2xl border border-teal-100 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Prescription details</h3>
                <Link
                  to="/app/generic-medicine/prescription"
                  className="text-xs font-semibold text-teal-700"
                >
                  Upload Rx
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormSelectField
                  label="For"
                  value={rxForm.pre_for_id}
                  onChange={(e) => setRx("pre_for_id", e.target.value)}
                >
                  {PRE_FOR_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </FormSelectField>
                <FormTextField
                  label="Patient name"
                  required
                  error={rxErrors.patient_name}
                  value={rxForm.patient_name}
                  onChange={(e) => setRx("patient_name", e.target.value)}
                />
                <FormTextField
                  label="Age"
                  required
                  type="number"
                  error={rxErrors.patient_age}
                  value={rxForm.patient_age}
                  onChange={(e) => setRx("patient_age", e.target.value)}
                />
                <FormTextField
                  label="Dosage"
                  required
                  error={rxErrors.dosage}
                  value={rxForm.dosage}
                  onChange={(e) => setRx("dosage", e.target.value)}
                />
                {prescriptionNeeded === "1" && (
                  <FormTextField
                    label="Allergies"
                    className="sm:col-span-2"
                    value={rxForm.allergies}
                    onChange={(e) => setRx("allergies", e.target.value)}
                  />
                )}
                <FormSelectField
                  label="Last doctor visit"
                  value={rxForm.last_doctor_visit_id}
                  onChange={(e) => setRx("last_doctor_visit_id", e.target.value)}
                >
                  {LAST_DOCTOR_VISIT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </FormSelectField>
                <FormSelectField
                  label="Medicine consume"
                  value={rxForm.medicine_consume_id}
                  onChange={(e) => setRx("medicine_consume_id", e.target.value)}
                >
                  {MEDICINE_CONSUME_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </FormSelectField>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-teal-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Delivery address</h3>
              <button
                type="button"
                className="text-xs font-semibold text-teal-700"
                onClick={() => setShowAddressForm((v) => !v)}
              >
                {showAddressForm ? "Hide form" : "Add new"}
              </button>
            </div>
            <div className="space-y-2">
              {addresses.map((a) => {
                const id = String(a.address_id || a.id)
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer gap-3 rounded-2xl border px-3 py-3 text-sm ${
                      selectedAddressId === id
                        ? "border-teal-500 bg-teal-50"
                        : "border-teal-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="addr"
                      checked={selectedAddressId === id}
                      onChange={() => setSelectedAddressId(id)}
                    />
                    <span>
                      <strong>{a.name}</strong> · {a.mobile}
                      <br />
                      {a.address || a.address_detail} {a.pincode}
                    </span>
                    <button
                      type="button"
                      className="ml-auto text-xs text-red-600"
                      onClick={async (ev) => {
                        ev.preventDefault()
                        try {
                          await deleteAddress(session, id)
                          const list = await fetchAddressList(session)
                          setAddresses(list || [])
                          toast.success("Address deleted")
                        } catch (err) {
                          toast.error(err.message || "Could not delete address")
                        }
                      }}
                    >
                      Delete
                    </button>
                  </label>
                )
              })}
            </div>

            {showAddressForm && (
              <form onSubmit={saveAddress} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
                <FormTextField
                  label="Name"
                  required
                  error={addrErrors.name}
                  value={addrForm.name}
                  onChange={(e) => setAddr("name", e.target.value)}
                />
                <FormTextField
                  label="Mobile"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  error={addrErrors.mobile}
                  value={addrForm.mobile}
                  onChange={(e) => setAddr("mobile", digitsOnly(e.target.value, 10))}
                  placeholder="Enter 10 digit number"
                />
                <FormTextField
                  label="Pincode"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  error={addrErrors.pincode}
                  value={addrForm.pincode}
                  onChange={(e) => setAddr("pincode", digitsOnly(e.target.value, 6))}
                />
                <FormSelectField
                  label="Address type"
                  value={addrForm.address_type_id}
                  onChange={(e) => setAddr("address_type_id", e.target.value)}
                >
                  {ADDRESS_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </FormSelectField>
                <FormSelectField
                  label="State"
                  required
                  error={addrErrors.fk_state_uuid4}
                  value={addrForm.fk_state_uuid4}
                  onChange={(e) =>
                    setAddrForm((f) => ({
                      ...f,
                      fk_state_uuid4: e.target.value,
                      fk_district_uuid4: "",
                      fk_city_uuid4: "",
                    }))
                  }
                >
                  <option value="">State</option>
                  {states.map((s) => (
                    <option key={locationUuid(s)} value={locationUuid(s)}>
                      {locationName(s)}
                    </option>
                  ))}
                </FormSelectField>
                <FormSelectField
                  label="District"
                  required
                  error={addrErrors.fk_district_uuid4}
                  value={addrForm.fk_district_uuid4}
                  onChange={(e) =>
                    setAddrForm((f) => ({
                      ...f,
                      fk_district_uuid4: e.target.value,
                      fk_city_uuid4: "",
                    }))
                  }
                >
                  <option value="">District</option>
                  {districts.map((d) => (
                    <option key={locationUuid(d)} value={locationUuid(d)}>
                      {locationName(d)}
                    </option>
                  ))}
                </FormSelectField>
                <FormSelectField
                  label="City"
                  required
                  className="sm:col-span-2"
                  error={addrErrors.fk_city_uuid4}
                  value={addrForm.fk_city_uuid4}
                  onChange={(e) => setAddr("fk_city_uuid4", e.target.value)}
                >
                  <option value="">City</option>
                  {cities.map((c) => (
                    <option key={locationUuid(c)} value={locationUuid(c)}>
                      {locationName(c)}
                    </option>
                  ))}
                </FormSelectField>
                <FormTextAreaField
                  label="Full address"
                  required
                  className="sm:col-span-2"
                  error={addrErrors.address}
                  value={addrForm.address}
                  onChange={(e) => setAddr("address", e.target.value)}
                />
                <FormTextField
                  label="Landmark"
                  className="sm:col-span-2"
                  value={addrForm.landmark}
                  onChange={(e) => setAddr("landmark", e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-xl py-2.5 text-sm font-semibold text-white sm:col-span-2"
                  style={{ backgroundColor: ACCENT }}
                >
                  Save address
                </button>
              </form>
            )}
          </div>

          <GenericPrimaryButton onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Placing order…" : `Place order · ${formatInr(bill.totalPayable)}`}
          </GenericPrimaryButton>
        </div>
      )}
    </GenericShell>
  )
}
