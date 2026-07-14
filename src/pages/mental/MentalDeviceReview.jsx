import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  computeDeviceTotal,
  createBooking,
  MENTAL_ACCENT,
  RAZORPAY_KEY_ID,
} from "../../api/mental"
import { useAuth } from "../../context/AuthContext"
import { useMentalHealth } from "../../context/MentalHealthContext"
import { useToast } from "../../components/ui/Toast"
import { MentalShell } from "./MentalShell"

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

export default function MentalDeviceReview() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const { bookingDraft, setFlow } = useMentalHealth()
  const [paying, setPaying] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const fees = useMemo(() => computeDeviceTotal(), [])

  useEffect(() => {
    if (!bookingDraft?.scheduleDate || !bookingDraft?.city) {
      navigate("/app/mental-health/device", { replace: true })
    }
  }, [bookingDraft, navigate])

  if (!bookingDraft) return null

  const handlePay = async () => {
    if (!agreed) {
      toast.error("Please accept the terms to continue")
      return
    }
    setPaying(true)
    try {
      const payment = await openRazorpayCheckout({
        key: RAZORPAY_KEY_ID,
        amount: Math.round(fees.total * 100),
        currency: "INR",
        name: "SETU",
        description: "Mental Health device booking",
        prefill: {
          name: bookingDraft.fullName,
          contact: bookingDraft.phoneNumber,
          email: bookingDraft.email || undefined,
        },
        theme: { color: MENTAL_ACCENT },
      })

      const paymentId = payment?.razorpay_payment_id
      if (!paymentId) throw new Error("Payment incomplete")

      await createBooking(
        {
          fullName: bookingDraft.fullName,
          age: bookingDraft.age,
          gender: bookingDraft.gender,
          phoneNumber: bookingDraft.phoneNumber,
          email: bookingDraft.email || undefined,
          houseNumber: bookingDraft.houseNumber,
          streetName: bookingDraft.streetName,
          landmark: bookingDraft.landmark || undefined,
          city: bookingDraft.city,
          pincode: bookingDraft.pincode,
          state: bookingDraft.state,
          scheduleDate: bookingDraft.scheduleDate,
          scheduleTime: bookingDraft.scheduleTime,
          razorpayPaymentId: paymentId,
          amountPaid: fees.total,
          refundStatus: "none",
          paymentStatus: "paid",
        },
        session,
      )

      setFlow({
        bookingDraft: null,
        lastBooking: {
          name: bookingDraft.fullName,
          date: bookingDraft.scheduleDate,
          time: bookingDraft.scheduleTime,
          city: bookingDraft.city,
        },
      })
      navigate("/app/mental-health/device/success", { replace: true })
    } catch (err) {
      if (err?.message !== "Payment cancelled") {
        toast.error(err?.message || "Booking failed")
      }
    } finally {
      setPaying(false)
    }
  }

  return (
    <MentalShell title="Review & pay" backTo="/app/mental-health/device/address">
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-semibold text-[#0F172A]">Visit details</p>
          <dl className="mt-3 space-y-2 text-sm text-[#4B5563]">
            <div className="flex justify-between gap-3">
              <dt>Patient</dt>
              <dd className="font-medium text-[#0F172A]">{bookingDraft.fullName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>When</dt>
              <dd className="font-medium text-[#0F172A]">
                {bookingDraft.scheduleDate} · {bookingDraft.scheduleTime}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Where</dt>
              <dd className="max-w-[60%] text-right font-medium text-[#0F172A]">
                {[bookingDraft.houseNumber, bookingDraft.streetName, bookingDraft.city]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <p className="text-sm font-semibold text-[#0F172A]">Charges</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-[#4B5563]">
              <dt>Device fee</dt>
              <dd>₹{fees.deviceFee}</dd>
            </div>
            <div className="flex justify-between text-[#4B5563]">
              <dt>Visit fee</dt>
              <dd>₹{fees.visitFee}</dd>
            </div>
            <div className="flex justify-between text-[#4B5563]">
              <dt>Taxes ({fees.taxPercent}%)</dt>
              <dd>₹{fees.taxAmount}</dd>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-2 font-semibold text-[#0F172A]">
              <dt>Total</dt>
              <dd>₹{fees.total}</dd>
            </div>
          </dl>
        </div>

        <label className="flex items-start gap-2 text-sm text-[#4B5563]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          />
          I agree to the visit terms and confirm the details above are correct.
        </label>

        <button
          type="button"
          disabled={paying}
          onClick={handlePay}
          className="w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: MENTAL_ACCENT }}
        >
          {paying ? "Processing…" : `Pay ₹${fees.total}`}
        </button>
      </div>
    </MentalShell>
  )
}
