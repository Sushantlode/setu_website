import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { fetchUserProfile } from "../../api/auth"
import {
  TELEMEDICINE_TEST_PAYMENT_RUPEES,
  createAppointment,
  createPaymentOrder,
  fetchAmountBreakdown,
  getDoctorSlots,
  saveTelemedAppointment,
  verifyPayment,
} from "../../api/telemedicine"
import {
  cacheDoctor,
  doctorImageUrl,
  dmyToIso,
  formatShortDate,
  isPastSlot,
  readCachedDoctor,
} from "../../utils/telemedicine"

const RAZORPAY_KEY =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_Rgl75wP2oROCnL"

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

function formatUserDob(dob) {
  if (!dob) return ""
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return String(dob)
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

function calculateAge(dob) {
  if (!dob) return ""
  const birthDate = new Date(dob)
  if (Number.isNaN(birthDate.getTime())) return ""
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }
  return String(age)
}

export default function BookReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()

  const [doctor] = useState(
    location.state?.doctor || readCachedDoctor(id),
  )
  const review = location.state?.review
  const rawDate = String(review?.selectedDate || "")
  const selectedIso = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : /^\d{2}-\d{2}-\d{4}$/.test(rawDate)
      ? dmyToIso(rawDate)
      : ""
  const timeSlot = review?.timeSlot || ""

  const [terms, setTerms] = useState(false)
  const [breakdown, setBreakdown] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [imgErr, setImgErr] = useState(false)

  useEffect(() => {
    if (doctor) cacheDoctor(doctor)
  }, [doctor])

  useEffect(() => {
    fetchAmountBreakdown(TELEMEDICINE_TEST_PAYMENT_RUPEES)
      .then(setBreakdown)
      .catch(() =>
        setBreakdown({
          total_amount: TELEMEDICINE_TEST_PAYMENT_RUPEES,
          total_amount_paise: TELEMEDICINE_TEST_PAYMENT_RUPEES * 100,
          amount_payable: TELEMEDICINE_TEST_PAYMENT_RUPEES,
          platform_fee: 0,
        }),
      )
  }, [])

  useEffect(() => {
    if (!session?.user_id) return
    fetchUserProfile(session.user_id, session.token, session.refreshToken)
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [session])

  const amountPaise = useMemo(() => {
    const paise = Number(breakdown?.total_amount_paise)
    if (Number.isFinite(paise) && paise > 0) return Math.round(paise)
    const rupees = Number(
      breakdown?.total_amount ?? TELEMEDICINE_TEST_PAYMENT_RUPEES,
    )
    return Math.round((Number.isFinite(rupees) ? rupees : 1) * 100)
  }, [breakdown])

  const consultationRupee = Number(
    breakdown?.amount_payable ?? TELEMEDICINE_TEST_PAYMENT_RUPEES,
  )

  const confirmSlotStillOpen = async () => {
    const content = await getDoctorSlots({
      staffId: doctor.staff_id,
      dur: doctor.staffMinDuration || "20",
      currAppDate: selectedIso,
      dayOfWeek: new Date(`${selectedIso}T12:00:00`).getDay(),
    })
    const match = content.find((s) => {
      const slot = s?.slot || s?.time
      return slot === timeSlot && (s?.status == null || Number(s.status) === 1)
    })
    return Boolean(match)
  }

  const createBookingAfterPay = async (paymentId) => {
    const raw = profile?.raw || {}
    const requestBody = {
      appointmentReason: "",
      appointmentService: "1",
      appointmentDate: selectedIso,
      appointmentTime: timeSlot,
      appointmentAmount: consultationRupee,
      isCheckConsent1: terms,
      isCheckConsent2: false,
      ehsUserId: session.user_id,
      appointmentUserId: {
        userFirstname: raw.first_name || profile?.first_name || session.first_name || "",
        userLastname: raw.last_name || "",
        userDob: formatUserDob(raw.dob),
        userAge: calculateAge(raw.dob),
        userEmail: raw.email || "",
        userMobile: raw.phone_number || raw.mobile || profile?.mobile || session.mobile || "",
        userArea: "Pune",
        userAddress: "Pune",
        userPincode: 412308,
      },
      appointmentUnitId: 1,
      userCityId: 41391,
      userNationalityId: 1,
      userGenderId: 1,
      insuranceCoveredAppointment: true,
      staffId: doctor.staff_id,
      isVartualConsultation: true,
    }

    const { response, data } = await createAppointment(requestBody, {
      token: session.token,
      refreshToken: session.refreshToken,
    })

    const isBooked =
      response.status === 409 ||
      data?.code === "SLOT_TAKEN" ||
      /already\s*booked/i.test(String(data?.message || ""))

    if (isBooked) {
      throw new Error("This slot was just taken. Please choose another time.")
    }
    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || "Could not create appointment")
    }

    const created = data?.data ?? data
    const appointmentId = created?.appointmentId ?? created?.id
    if (appointmentId == null || String(appointmentId).trim() === "") {
      throw new Error(data?.message || "Appointment was not created")
    }

    let formattedAppointmentDate = new Date().toISOString()
    const appointmentDate = created?.appointmentDate
    if (appointmentDate && !Number.isNaN(Number(appointmentDate))) {
      const date = new Date(Number(appointmentDate))
      if (!Number.isNaN(date.getTime())) formattedAppointmentDate = date.toISOString()
    } else if (typeof appointmentDate === "string" && appointmentDate.includes("-")) {
      formattedAppointmentDate = new Date(`${selectedIso}T12:00:00`).toISOString()
    }

    const telemedBody = {
      userId: String(session.user_id),
      patientId: String(created?.patientId ?? ""),
      doctorId: String(doctor.staff_id),
      appointmentId: String(appointmentId),
      meetingId: String(created?.meetingId ?? ""),
      appointmentSlot: created?.appointmentSlot || timeSlot,
      appointmentDate: formattedAppointmentDate,
      transactionId: paymentId,
      appointmentFees: created?.appointmentAmount ?? consultationRupee,
      status: "pending",
    }

    const saved = await saveTelemedAppointment(telemedBody, {
      token: session.token,
      refreshToken: session.refreshToken,
    })
    if (!saved.response.ok || saved.data?.success === false) {
      throw new Error(saved.data?.message || "Could not save appointment record")
    }

    return {
      appointmentId: String(
        saved.data?.data?.appointmentId ??
          saved.data?.appointmentId ??
          appointmentId,
      ),
      meetingId: created?.meetingId,
      doctorName: doctor.name,
      date: selectedIso,
      timeSlot,
      amount: consultationRupee,
    }
  }

  const handlePayAndBook = async () => {
    if (!doctor || !selectedIso || !timeSlot) {
      setError("Missing booking details. Please select a slot again.")
      return
    }
    if (!terms) {
      setError("Please accept the teleconsultation terms to continue.")
      return
    }
    if (isPastSlot(selectedIso, timeSlot)) {
      setError("This time slot is in the past. Please pick another.")
      return
    }
    if (!session?.token || !session?.user_id) {
      setError("Please sign in again to book.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const stillOpen = await confirmSlotStillOpen()
      if (!stillOpen) {
        throw new Error("This slot is no longer available.")
      }

      const orderId = await createPaymentOrder({
        amountPaise,
        token: session.token,
        refreshToken: session.refreshToken,
      })

      const options = {
        key: RAZORPAY_KEY,
        amount: amountPaise,
        currency: "INR",
        name: "SETU",
        description: `Consultation with ${doctor.name}`,
        theme: { color: "#1C39BB" },
        prefill: {
          name: session.first_name || session.username || "",
          contact: session.mobile || "",
        },
      }
      if (orderId) options.order_id = orderId

      const payment = await openRazorpayCheckout(options)
      const paymentId = String(payment?.razorpay_payment_id || "").trim()
      if (!paymentId) throw new Error("Payment did not complete.")

      const verified = await verifyPayment({
        userId: session.user_id,
        paymentId,
        token: session.token,
        refreshToken: session.refreshToken,
      })
      if (!verified.ok) {
        throw new Error("Payment verification failed. Contact support if amount was deducted.")
      }

      const confirmation = await createBookingAfterPay(paymentId)
      navigate("/app/telemedicine/confirmation", {
        replace: true,
        state: { confirmation },
      })
    } catch (err) {
      setError(err?.message || "Booking failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!doctor || !timeSlot) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-setu-muted">
          Booking details are missing. Please select a doctor and slot again.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/app/telemedicine/doctors/${id}`)}
          className="mt-4 text-sm font-medium text-[#1C39BB] hover:underline"
        >
          Choose a slot
        </button>
      </main>
    )
  }

  const img = !imgErr ? doctorImageUrl(doctor) : ""

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 pt-4 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 text-sm text-setu-muted hover:text-setu-charcoal"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h1 className="font-serif text-2xl text-setu-charcoal sm:text-3xl">
        Review & pay
      </h1>
      <p className="mt-1 text-sm text-setu-muted">
        Confirm details and complete payment to book your consultation.
      </p>

      <div className="mt-6 rounded-2xl border border-[#D2DEFF] bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#EEF3FF]">
            {img ? (
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImgErr(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-semibold text-[#1C39BB]">
                {(doctor.name || "D").charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-setu-charcoal">{doctor.name}</p>
            {doctor.sname ? (
              <p className="text-sm text-[#1C39BB]">{doctor.sname}</p>
            ) : null}
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-setu-muted">Date</dt>
            <dd className="font-medium text-setu-charcoal">
              {formatShortDate(selectedIso)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-setu-muted">Time</dt>
            <dd className="font-medium text-setu-charcoal">{timeSlot}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-setu-muted">Consultation</dt>
            <dd className="font-medium text-setu-charcoal">
              ₹{Number(breakdown?.amount_payable ?? consultationRupee).toFixed(2)}
            </dd>
          </div>
          {Number(breakdown?.platform_fee) > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-setu-muted">Platform fee</dt>
              <dd className="font-medium text-setu-charcoal">
                ₹{Number(breakdown.platform_fee).toFixed(2)}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-[#D2DEFF] pt-3">
            <dt className="font-medium text-setu-charcoal">Total</dt>
            <dd className="font-semibold text-[#1C39BB]">
              ₹{(amountPaise / 100).toFixed(2)}
            </dd>
          </div>
        </dl>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[#D2DEFF] bg-[#F7FAFF] p-4 text-sm">
        <input
          type="checkbox"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-0.5 rounded border-[#D2DEFF] text-[#1C39BB] focus:ring-[#1C39BB]"
        />
        <span className="text-setu-charcoal">
          I accept the teleconsultation terms and consent to a video consultation
          with this doctor.
        </span>
      </label>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-100 bg-[#FFF5F5] px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading || !terms}
        onClick={handlePayAndBook}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1C39BB] py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Processing…
          </>
        ) : (
          `Pay ₹${(amountPaise / 100).toFixed(2)} & book`
        )}
      </button>
    </main>
  )
}
