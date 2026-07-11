import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Video } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { cancelAppointment, getUserAppointments } from "../../api/telemedicine"
import { AppointmentListSkeleton } from "../../components/AppSkeleton"
import {
  formatShortDate,
  getJoinPhases,
  resolveMeetingLink,
} from "../../utils/telemedicine"

function formatApptDate(value) {
  if (!value) return ""
  const str = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return formatShortDate(str.slice(0, 10))
  }
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) {
    try {
      return new Date(n).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return str
    }
  }
  return str
}

export default function MyAppointments() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(
    location.state?.initialTab === "past" ? "past" : "upcoming",
  )
  const [upcoming, setUpcoming] = useState([])
  const [past, setPast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState("")
  const [banner, setBanner] = useState("")

  const load = useCallback(async () => {
    if (!session?.user_id || !session?.token) return
    setLoading(true)
    setError("")
    try {
      const data = await getUserAppointments({
        userId: session.user_id,
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setUpcoming(data.upcoming)
      setPast(data.past)
    } catch (err) {
      setError(err?.message || "Could not load appointments")
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (location.state?.bookingStatus === "success") {
      setBanner("Your appointment was booked successfully.")
      setTab("upcoming")
    } else if (location.state?.bookingStatus === "failed") {
      setBanner("Booking did not complete. You can try again from Find doctors.")
    }
  }, [location.state])

  const onCancel = async (appointmentId) => {
    if (!appointmentId || !session?.token) return
    if (!window.confirm("Cancel this appointment?")) return
    setBusyId(String(appointmentId))
    try {
      await cancelAppointment(appointmentId, {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      await load()
    } catch (err) {
      setError(err?.message || "Could not cancel")
    } finally {
      setBusyId("")
    }
  }

  /** Same URL RN MeetingWebView loads — open in a new tab (web equivalent). */
  const onJoin = (appt) => {
    const meetingLink = resolveMeetingLink(appt)
    if (!meetingLink) {
      window.alert(
        "Meeting link is not available yet. Please try again closer to your appointment time, or contact support if this persists.",
      )
      return
    }
    const { isPreWindow, isDuringSlot } = getJoinPhases(
      appt.appointmentDate || appt.appointment_date,
      appt.appointmentSlot || appt.appointment_slot,
    )
    if (!isPreWindow && !isDuringSlot) {
      window.alert(
        "You can join from 10 minutes before the appointment until the slot ends.",
      )
      return
    }
    window.open(meetingLink, "_blank", "noopener,noreferrer")
  }

  const list = tab === "upcoming" ? upcoming : past

  return (
    <main className="mx-auto max-w-3xl px-4 pb-6 pt-4 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/app/telemedicine/home")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D2DEFF] text-[#1C39BB] hover:bg-[#EEF3FF]"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-serif text-2xl text-setu-charcoal sm:text-3xl">
            My appointments
          </h1>
          <p className="text-sm text-setu-muted">Upcoming and past consultations</p>
        </div>
      </div>

      {banner ? (
        <div className="mb-4 rounded-2xl border border-[#D2DEFF] bg-[#EEF3FF] px-4 py-3 text-sm text-[#1C39BB]">
          {banner}
        </div>
      ) : null}

      <div className="mb-5 flex rounded-full border border-[#D2DEFF] bg-white p-1">
        {["upcoming", "past"].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition-colors ${
              tab === key
                ? "bg-[#1C39BB] text-white"
                : "text-setu-muted hover:text-setu-charcoal"
            }`}
          >
            {key}
            <span className="ml-1 opacity-80">
              ({key === "upcoming" ? upcoming.length : past.length})
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <AppointmentListSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-[#FFF5F5] px-4 py-6 text-center text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => load()}
            className="mt-3 block w-full font-medium text-[#1C39BB]"
          >
            Retry
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-[#D2DEFF] bg-white px-4 py-12 text-center">
          <p className="font-medium text-setu-charcoal">No {tab} appointments</p>
          <Link
            to="/app/telemedicine/home"
            className="mt-3 inline-block text-sm font-medium text-[#1C39BB] hover:underline"
          >
            Find a doctor
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((appt) => {
            const appointmentId =
              appt.appointmentId ?? appt.id ?? appt.appointment_id
            const meetingLink = resolveMeetingLink(appt)
            const statusText = String(appt.status ?? "").toLowerCase()
            const isCancelled =
              statusText === "cancelled" || appt.isCancelled === true
            const { isPreWindow, isDuringSlot } = getJoinPhases(
              appt.appointmentDate || appt.appointment_date,
              appt.appointmentSlot || appt.appointment_slot,
            )
            const joinEnabled =
              Boolean(meetingLink) &&
              !isCancelled &&
              (isPreWindow || isDuringSlot)
            const cancelDisabled =
              isCancelled || isPreWindow || isDuringSlot
            const focused =
              location.state?.focusAppointmentId &&
              String(location.state.focusAppointmentId) === String(appointmentId)

            let joinHint = ""
            if (isCancelled) joinHint = "This appointment was cancelled"
            else if (!meetingLink)
              joinHint = "Meeting link is not available for this appointment"
            else if (!isPreWindow && !isDuringSlot)
              joinHint =
                "Join opens 10 minutes before the appointment until the slot ends"

            return (
              <li
                key={String(appointmentId)}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  focused ? "border-[#1C39BB]" : "border-[#D2DEFF]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-setu-charcoal">
                      {appt.doctorName || appt.doctor_name || "Doctor"}
                    </p>
                    {appt.specialityName || appt.speciality_name ? (
                      <p className="text-sm text-[#1C39BB]">
                        {appt.specialityName || appt.speciality_name}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-setu-muted">
                      {formatApptDate(appt.appointmentDate || appt.appointment_date)}
                      {appt.appointmentSlot || appt.appointment_slot
                        ? ` · ${appt.appointmentSlot || appt.appointment_slot}`
                        : ""}
                    </p>
                    {appt.status ? (
                      <p className="mt-1 text-xs uppercase tracking-wide text-setu-muted">
                        {appt.status}
                      </p>
                    ) : null}
                  </div>
                  {tab === "upcoming" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!joinEnabled}
                        title={joinHint || undefined}
                        onClick={() => onJoin(appt)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#1C39BB] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Video size={14} />
                        {isDuringSlot ? "Join live" : "Join"}
                      </button>
                      <button
                        type="button"
                        disabled={
                          cancelDisabled || busyId === String(appointmentId)
                        }
                        onClick={() => onCancel(appointmentId)}
                        className="rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busyId === String(appointmentId) ? "…" : "Cancel"}
                      </button>
                    </div>
                  ) : null}
                </div>
                {tab === "upcoming" && joinHint && !joinEnabled ? (
                  <p className="mt-2 text-xs text-setu-muted">{joinHint}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
