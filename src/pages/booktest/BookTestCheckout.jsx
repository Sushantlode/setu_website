import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useBookTest } from "../../context/BookTestContext"
import {
  RAZORPAY_KEY_ID,
  bookAppointmentSlot,
  createThyrocareOrder,
  fetchCheckout,
  verifyBookTestPayment,
} from "../../api/booktest"
import BookTestShell, {
  BillingSummary,
  BookTestPrimaryButton,
} from "../../components/booktest/BookTestShell"
import {
  normalizePhone,
  productCode,
  productName,
  resolveProductPrice,
} from "../../utils/booktest"

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

export default function BookTestCheckout() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { cartItems, billing, flow, refreshCart, clearFlow } = useBookTest()
  const [checkout, setCheckout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await fetchCheckout(session, session.user_id)
        if (!cancelled) setCheckout(data)
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load checkout")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [session])

  const totalRupees = useMemo(() => {
    const fromBilling = Number(billing?.total_amount)
    if (Number.isFinite(fromBilling) && fromBilling > 0) return fromBilling
    const fromCheckout = Number(
      checkout?.total_amount || checkout?.netPayableAmount || checkout?.amount,
    )
    if (Number.isFinite(fromCheckout) && fromCheckout > 0) return fromCheckout
    return cartItems.reduce(
      (s, it) => s + resolveProductPrice(it) * (parseInt(it.quantity, 10) || 1),
      0,
    )
  }, [billing, checkout, cartItems])

  const handlePay = async () => {
    setError("")
    if (!flow?.patient || !flow?.address || !flow?.selectedDate || !flow?.selectedTime) {
      setError("Missing patient, address or slot. Go back and complete the flow.")
      return
    }
    setPaying(true)
    try {
      const amountPaise = Math.round(totalRupees * 100)
      if (amountPaise <= 0) throw new Error("Invalid payment amount")

      const payment = await openRazorpayCheckout({
        key: RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: "INR",
        name: "SETU Book Test",
        description: "Lab test home collection",
        prefill: {
          name: flow.patient.name,
          contact: String(flow.patient.contactNumber || "").replace(/\D/g, "").slice(-10),
          email: flow.patient.email || undefined,
        },
        theme: { color: "#7C3AED" },
      })

      const paymentId = String(payment?.razorpay_payment_id || "").trim()
      if (!paymentId) throw new Error("Payment id missing")

      await verifyBookTestPayment(session, {
        userId: session.user_id,
        paymentId,
      })

      const addressId = flow.address.addressId || flow.address.id
      await bookAppointmentSlot(session, {
        user_id: session.user_id,
        addressId,
        date: flow.selectedDate,
        time: flow.selectedTime,
      })

      const phone = normalizePhone(flow.patient.contactNumber)
      const patients = [
        {
          name: flow.patient.name,
          gender: flow.patient.gender,
          age: flow.patient.age,
          ageType: "YEAR",
          contactNumber: phone,
          email: flow.patient.email || "",
          items: cartItems.map((it) => ({
            id: productCode(it),
            type: "PSKU",
            name: productName(it),
          })),
        },
      ]

      const orderPayload = {
        payment_id: paymentId,
        address: {
          houseNo: flow.address.houseNumber || "",
          street: flow.address.addressLine2 || "",
          addressLine1: flow.address.houseNumber || "",
          addressLine2: flow.address.addressLine2 || "",
          landmark: flow.address.landmark || "",
          city: flow.address.city || "",
          state: flow.address.state || "",
          country: "India",
          pincode: String(flow.address.pincode || ""),
        },
        email: flow.patient.email || "",
        contactNumber: phone,
        appointment: {
          date: flow.selectedDate,
          startTime: flow.selectedTime,
          timeZone: "IST",
        },
        origin: {
          platform: "DSA-PARTNER",
          portalType: "B2C",
          appId: "SETU-WEB",
        },
        referredBy: { doctorId: "NA", doctorName: "SELF" },
        paymentDetails: { payType: "PREPAID" },
        attributes: {
          collectionType: "HOME_COLLECTION",
          isReportHardCopyRequired: false,
        },
        patients,
        price: { discounts: [], incentivePasson: 0 },
        orderOptions: { isPdpcOrder: false },
      }

      const placed = await createThyrocareOrder(session, orderPayload)
      await refreshCart()
      clearFlow()
      navigate("/app/book-tests/success", {
        state: {
          orderId:
            placed?.orderId ||
            placed?.order_id ||
            placed?.data?.orderId ||
            paymentId,
          paymentId,
        },
      })
    } catch (err) {
      navigate("/app/book-tests/failure", {
        state: { message: err.message || "Payment failed. Please try again." },
      })
    } finally {
      setPaying(false)
    }
  }

  return (
    <BookTestShell title="Checkout" backTo="/app/book-tests/slots" hideNav>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-violet-700" />
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="rounded-2xl border border-violet-100 bg-white p-4 text-sm">
            <p className="font-semibold">Sample collection</p>
            <p className="mt-1 text-setu-muted">
              {flow?.selectedDate} · {flow?.selectedTime}
            </p>
            <p className="mt-2 text-setu-muted">
              {[flow?.address?.houseNumber, flow?.address?.pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="mt-2">
              Patient: <strong>{flow?.patient?.name}</strong> ({flow?.patient?.gender},{" "}
              {flow?.patient?.age} yrs)
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-4">
            <p className="font-semibold">Tests</p>
            <ul className="mt-2 space-y-2 text-sm">
              {cartItems.map((it) => (
                <li key={productCode(it)} className="flex justify-between gap-3">
                  <span className="line-clamp-2">{productName(it)}</span>
                  <span>×{it.quantity || 1}</span>
                </li>
              ))}
            </ul>
          </div>

          <BillingSummary billing={billing} />

          <BookTestPrimaryButton onClick={handlePay} disabled={paying}>
            {paying ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Processing…
              </>
            ) : (
              `Pay ₹${Number(totalRupees).toFixed(0)}`
            )}
          </BookTestPrimaryButton>
        </div>
      )}
    </BookTestShell>
  )
}
