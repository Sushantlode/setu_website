import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  Star,
} from "lucide-react"
import { filterDoctors, getDoctorSlots } from "../../api/telemedicine"
import {
  DoctorDetailSkeleton,
  SlotSkeleton,
} from "../../components/AppSkeleton"
import {
  addDaysIso,
  cacheDoctor,
  doctorImageUrl,
  formatDoctorRatingDisplay,
  formatShortDate,
  isPastSlot,
  readCachedDoctor,
  slotPeriod,
  todayIso,
} from "../../utils/telemedicine"

const PERIODS = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
]

export default function DoctorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [doctor, setDoctor] = useState(
    location.state?.doctor || readCachedDoctor(id),
  )
  const [loadingDoctor, setLoadingDoctor] = useState(!doctor)
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [imgErr, setImgErr] = useState(false)

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysIso(todayIso(), i)),
    [],
  )

  useEffect(() => {
    if (doctor?.staff_id) {
      cacheDoctor(doctor)
      return
    }
    let cancelled = false
    async function load() {
      setLoadingDoctor(true)
      try {
        const { list } = await filterDoctors({
          staffId: [id],
          page: 1,
          limit: 5,
        })
        if (cancelled) return
        const found =
          list.find((d) => String(d.staff_id) === String(id)) || list[0]
        if (found) {
          setDoctor(found)
          cacheDoctor(found)
        }
      } catch {
        /* keep empty */
      } finally {
        if (!cancelled) setLoadingDoctor(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [doctor, id])

  useEffect(() => {
    if (!doctor?.staff_id) return undefined
    let cancelled = false
    async function loadSlots() {
      setLoadingSlots(true)
      setSlotError("")
      setSelectedSlot("")
      try {
        const content = await getDoctorSlots({
          staffId: doctor.staff_id,
          dur: doctor.staffMinDuration || "20",
          currAppDate: selectedDate,
          dayOfWeek: new Date(`${selectedDate}T12:00:00`).getDay(),
        })
        if (cancelled) return
        setSlots(content)
      } catch (err) {
        if (!cancelled) {
          setSlots([])
          setSlotError(err?.message || "Could not load slots")
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }
    loadSlots()
    return () => {
      cancelled = true
    }
  }, [doctor, selectedDate])

  const grouped = useMemo(() => {
    const map = { morning: [], afternoon: [], evening: [], other: [] }
    for (const item of slots) {
      const slot = item?.slot || item?.time || ""
      if (!slot) continue
      const status = item?.status
      const available = status == null || Number(status) === 1
      const past = isPastSlot(selectedDate, slot)
      map[slotPeriod(slot)].push({
        slot,
        available: available && !past,
        past,
      })
    }
    return map
  }, [slots, selectedDate])

  const img = !imgErr ? doctorImageUrl(doctor) : ""
  const rating = formatDoctorRatingDisplay(
    doctor?.average_rating ?? doctor?.rating,
  )

  const continueBooking = () => {
    if (!doctor || !selectedSlot) return
    cacheDoctor(doctor)
    navigate(`/app/telemedicine/book/${doctor.staff_id}`, {
      state: {
        doctor,
        review: {
          selectedDate,
          selectedDateDmy: selectedDate.split("-").reverse().join("-"),
          timeSlot: selectedSlot,
        },
      },
    })
  }

  if (loadingDoctor) {
    return <DoctorDetailSkeleton />
  }

  if (!doctor) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-setu-muted">Doctor not found.</p>
        <button
          type="button"
          onClick={() => navigate("/app/telemedicine/doctors")}
          className="mt-4 text-sm font-medium text-[#1C39BB] hover:underline"
        >
          Back to doctors
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 text-sm text-setu-muted hover:text-setu-charcoal"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-2xl border border-[#D2DEFF] bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#EEF3FF]">
              {img ? (
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setImgErr(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#1C39BB]">
                  {(doctor.name || "D").charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-2xl text-setu-charcoal sm:text-3xl">
                {doctor.name}
              </h1>
              {doctor.sname ? (
                <p className="mt-1 text-[#1C39BB]">{doctor.sname}</p>
              ) : null}
              <p className="mt-2 text-sm text-setu-muted">
                {doctor.education || "MBBS"}
                {doctor.exp ? ` · ${doctor.exp} yrs experience` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-setu-muted">
                {rating ? (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Star size={14} fill="currentColor" />
                    {rating}
                  </span>
                ) : null}
                {doctor.city_name ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {doctor.city_name}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-setu-muted">
            Book a video consultation with {doctor.name}. Choose a date and
            available time slot, then confirm your appointment.
          </p>
        </section>

        <section className="rounded-2xl border border-[#D2DEFF] bg-[#F7FAFF] p-5">
          <h2 className="font-serif text-xl text-setu-charcoal">Select slot</h2>
          <p className="mt-1 text-sm text-setu-muted">Next 7 days</p>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {dates.map((iso) => {
              const active = iso === selectedDate
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className={`min-w-[4.75rem] shrink-0 rounded-2xl px-3 py-3 text-center text-xs transition-colors ${
                    active
                      ? "bg-[#1C39BB] text-white"
                      : "bg-white text-setu-charcoal border border-[#D2DEFF]"
                  }`}
                >
                  {formatShortDate(iso)}
                </button>
              )
            })}
          </div>

          <div className="mt-5 space-y-4">
            {loadingSlots ? (
              <SlotSkeleton />
            ) : slotError ? (
              <p className="text-sm text-red-600">{slotError}</p>
            ) : slots.length === 0 ? (
              <p className="py-6 text-sm text-setu-muted">
                No slots available for this date.
              </p>
            ) : (
              PERIODS.map((period) => {
                const list = grouped[period.key] || []
                if (!list.length) return null
                return (
                  <div key={period.key}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-setu-muted">
                      {period.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((item) => {
                        const active = selectedSlot === item.slot
                        return (
                          <button
                            key={item.slot}
                            type="button"
                            disabled={!item.available}
                            onClick={() => setSelectedSlot(item.slot)}
                            className={`rounded-full px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              active
                                ? "bg-[#1C39BB] text-white"
                                : "border border-[#D2DEFF] bg-white text-setu-charcoal hover:bg-[#EEF3FF]"
                            }`}
                          >
                            {item.slot}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            disabled={!selectedSlot}
            onClick={continueBooking}
            className="w-full rounded-full bg-[#1C39BB] py-3.5 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to book
          </button>
        </div>
      </div>
    </main>
  )
}
