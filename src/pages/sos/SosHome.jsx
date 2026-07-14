import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Ambulance,
  Building2,
  FlaskConical,
  MapPin,
  Pill,
  Shield,
  ShieldCheck,
  Stethoscope,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../components/ui/Toast"
import {
  buildDoctorMapsQuery,
  fetchEmergencyContacts,
  getBrowserLocationUrl,
  loadSosHome,
  openMapsSearch,
  sendSosAlert,
  sosUserFromSession,
} from "../../api/sos"
import { SosShell } from "./SosShell"

const SOS_RED = "#EA080E"
const TAP_RED = "#E95455"

function QuickActionIcon({ iconName }) {
  const cls = "h-5 w-5 text-white"
  switch (iconName) {
    case "local-police":
      return <Shield className={cls} />
    case "ambulance":
      return <Ambulance className={cls} />
    case "female":
      return <UserRound className={cls} />
    default:
      return <Shield className={cls} />
  }
}

function ServiceIcon({ iconName }) {
  const cls = "h-5 w-5 text-[#111]"
  switch (iconName) {
    case "hospital-o":
      return <Building2 className={cls} />
    case "person-search":
      return <Stethoscope className={cls} />
    case "medical-services":
      return <Pill className={cls} />
    case "science":
      return <FlaskConical className={cls} />
    case "ambulance":
      return <Ambulance className={cls} />
    case "local-police":
      return <Shield className={cls} />
    case "shield-checkmark-outline":
      return <ShieldCheck className={cls} />
    default:
      return <MapPin className={cls} />
  }
}

function HelpCountdownModal({ open, countdown, sending, onCancel, onConfirm }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="text-lg font-semibold text-[#1C1C1C]">Send SOS alert?</p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Your emergency contacts will be notified
          {countdown > 0 ? ` in ${countdown}s` : ""}.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={sending}
            onClick={onConfirm}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: SOS_RED }}
          >
            {sending ? "Sending…" : countdown > 0 ? `Confirm (${countdown})` : "Confirm now"}
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={onCancel}
            className="rounded-xl border border-[#E9EBEF] px-4 py-3 text-sm font-medium text-[#1C1C1C]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageModal({ open, title, message, confirmLabel, onClose, onConfirm }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-lg font-semibold text-[#1C1C1C]">{title}</p>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
        <div className="mt-6 flex flex-col gap-2">
          {onConfirm ? (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: SOS_RED }}
            >
              {confirmLabel || "OK"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E9EBEF] px-4 py-3 text-sm font-medium text-[#1C1C1C]"
          >
            {onConfirm ? "Close" : "OK"}
          </button>
        </div>
      </div>
    </div>
  )
}

function DoctorSearchModal({ open, onClose, onSearch }) {
  const [specialty, setSpecialty] = useState("")
  const [location, setLocation] = useState("")

  useEffect(() => {
    if (!open) {
      setSpecialty("")
      setLocation("")
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-[#1C1C1C]">Find a doctor</p>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#6B7280]">
            <X size={20} />
          </button>
        </div>
        <label className="block text-sm font-medium text-[#1C1C1C]">
          Specialty
          <input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="e.g. Cardiologist"
            className="mt-1 w-full rounded-xl border border-[#E9EBEF] px-3 py-2.5 text-sm outline-none focus:border-[#1C39BB]"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-[#1C1C1C]">
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or area"
            className="mt-1 w-full rounded-xl border border-[#E9EBEF] px-3 py-2.5 text-sm outline-none focus:border-[#1C39BB]"
          />
        </label>
        <button
          type="button"
          onClick={() => onSearch(specialty, location)}
          className="mt-5 w-full rounded-xl bg-[#1C39BB] px-4 py-3 text-sm font-semibold text-white"
        >
          Search on Maps
        </button>
      </div>
    </div>
  )
}

export default function SosHome() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const auth = {
    token: session?.token,
    refreshToken: session?.refreshToken,
  }

  const [loading, setLoading] = useState(true)
  const [quickActions, setQuickActions] = useState([])
  const [helpButton, setHelpButton] = useState({
    buttonText: "HELP",
    buttonColor: SOS_RED,
    buttonSize: 160,
  })
  const [nearbyServices, setNearbyServices] = useState([])
  const [personalProfileModule, setPersonalProfileModule] = useState(null)
  const [emergencyContactsModule, setEmergencyContactsModule] = useState(null)
  const [bottomImage, setBottomImage] = useState(null)
  const [contacts, setContacts] = useState([])

  const [helpOpen, setHelpOpen] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [sending, setSending] = useState(false)
  const [alertSentOpen, setAlertSentOpen] = useState(false)
  const [noContactsOpen, setNoContactsOpen] = useState(false)
  const [doctorModalOpen, setDoctorModalOpen] = useState(false)

  const countdownRef = useRef(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [home, contactList] = await Promise.all([
        loadSosHome("en"),
        session?.user_id
          ? fetchEmergencyContacts(session.user_id, auth).catch(() => [])
          : Promise.resolve([]),
      ])
      setQuickActions(home.quickActions)
      setHelpButton(home.helpButton)
      setNearbyServices(home.nearbyServices)
      setPersonalProfileModule(home.personalProfileModule)
      setEmergencyContactsModule(home.emergencyContactsModule)
      setBottomImage(home.bottomImage)
      setContacts(contactList)
    } finally {
      setLoading(false)
    }
  }, [session?.user_id, session?.token, session?.refreshToken])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!helpOpen) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      return undefined
    }

    setCountdown(5)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [helpOpen])

  const handleHelpPress = () => {
    if (contacts.length === 0) {
      setNoContactsOpen(true)
      return
    }
    setHelpOpen(true)
  }

  const closeHelpModal = () => {
    setHelpOpen(false)
    setCountdown(5)
  }

  const handleHelpConfirm = async () => {
    if (contacts.length === 0) {
      setNoContactsOpen(true)
      closeHelpModal()
      return
    }

    const { userId, userName, userPhone } = sosUserFromSession(session)
    if (!userId) {
      toast.error("Sign in again to send an SOS alert.")
      return
    }

    setSending(true)
    try {
      const locationUrl = await getBrowserLocationUrl()
      await sendSosAlert(
        {
          userId,
          userName,
          userPhone,
          liveLocationOverride: locationUrl,
        },
        auth,
      )
      closeHelpModal()
      setAlertSentOpen(true)
    } catch (err) {
      toast.error(err?.message || "Failed to send SOS alert.")
    } finally {
      setSending(false)
    }
  }

  const handleQuickCall = (number, label) => {
    window.location.href = `tel:${number}`
    toast.success(`Calling ${label}…`)
  }

  const handleServicePress = (service) => {
    if (service.titleText === "DOCTORS") {
      setDoctorModalOpen(true)
      return
    }
    openMapsSearch(`${service.searchKeyword} near me`)
  }

  const handleDoctorSearch = (specialty, location) => {
    setDoctorModalOpen(false)
    openMapsSearch(buildDoctorMapsQuery(specialty, location))
  }

  const btnSize = Math.min(Math.max(Number(helpButton.buttonSize) || 160, 120), 200)

  if (loading) {
    return (
      <SosShell title="HELP" showBack={false}>
        <div className="flex flex-col items-center gap-6 py-8">
          <div
            className="animate-pulse rounded-full bg-[#EA080E]/20"
            style={{ width: btnSize, height: btnSize }}
          />
          <div className="h-4 w-40 animate-pulse rounded bg-[#E9EBEF]" />
          <div className="grid w-full grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-[#E9EBEF]" />
            ))}
          </div>
        </div>
      </SosShell>
    )
  }

  return (
    <SosShell title="HELP" showBack={false}>
      {/* HELP button */}
      <div className="flex flex-col items-center pt-2">
        <div className="relative flex items-center justify-center">
          <span
            className="absolute rounded-full opacity-40 animate-ping"
            style={{
              width: btnSize + 24,
              height: btnSize + 24,
              backgroundColor: helpButton.buttonColor || SOS_RED,
            }}
          />
          <button
            type="button"
            disabled={sending}
            onClick={handleHelpPress}
            className="relative z-10 flex items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 sm:text-3xl"
            style={{
              width: btnSize,
              height: btnSize,
              backgroundColor: helpButton.buttonColor || SOS_RED,
            }}
          >
            {sending ? "…" : helpButton.buttonText || "HELP"}
          </button>
        </div>
        <p className="mt-3 text-lg font-bold sm:text-xl" style={{ color: TAP_RED }}>
          Tap for emergency
        </p>
      </div>

      {/* Quick actions */}
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {quickActions.map((item, index) => (
          <button
            key={item.id || `${item.titleText}-${index}`}
            type="button"
            onClick={() => handleQuickCall(item.contactNumber, item.titleText)}
            className="flex min-h-[120px] flex-col items-center rounded-xl px-1 py-4 text-white shadow-sm transition-opacity hover:opacity-95 sm:min-h-[135px]"
            style={{
              background: `linear-gradient(135deg, ${item.gradientStartColor}, ${item.gradientEndColor})`,
            }}
          >
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/25">
              <QuickActionIcon iconName={item.iconName} />
            </span>
            <span className="text-[10px] font-bold leading-tight sm:text-xs">{item.titleText}</span>
            <span className="mt-1 text-[9px] leading-tight opacity-95 sm:text-[10px]">
              {item.subtitleText}
            </span>
          </button>
        ))}
      </div>

      {/* Profile + contacts cards */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          to="/app/sos/profile"
          className="flex items-start gap-3 rounded-xl border border-[#E9EBEF] bg-[#F7F7F9] p-4 transition-colors hover:border-[#D0D5DD]"
        >
          <User className="mt-0.5 h-5 w-5 shrink-0 text-[#1C1C1C]" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1C1C1C]">
              {personalProfileModule?.title || "Personal Profile"}
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              {personalProfileModule?.description || "Complete your personal details"}
            </p>
          </div>
        </Link>

        <Link
          to="/app/sos/contacts"
          className="flex items-start gap-3 rounded-xl border border-[#E9EBEF] bg-[#F7F7F9] p-4 transition-colors hover:border-[#D0D5DD]"
        >
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#1C1C1C]" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1C1C1C]">
              {emergencyContactsModule?.title || "Emergency Contacts"}
            </p>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              {emergencyContactsModule?.description ||
                "Your registered emergency contacts"}
              {contacts.length > 0 ? ` · ${contacts.length} saved` : ""}
            </p>
          </div>
        </Link>
      </div>

      {/* Nearby services */}
      <div className="mt-6 flex items-center gap-2">
        <h2 className="text-sm font-bold text-[#1C1C1C]">Nearby emergency services</h2>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F0F0F0]">
          <MapPin size={12} className="text-[#1C1C1C]" />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {nearbyServices.map((service, index) => (
          <button
            key={`${service.titleText}-${index}`}
            type="button"
            onClick={() => handleServicePress(service)}
            className="flex items-center gap-2 rounded-xl border border-[#E9EBEF] bg-white px-3 py-3 text-left transition-colors hover:bg-[#FAFAFA]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F9]">
              <ServiceIcon iconName={service.iconName} />
            </span>
            <span className="text-xs font-semibold leading-tight text-[#1C1C1C]">
              {service.titleText}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom image */}
      {bottomImage?.imageUrl ? (
        <div className="mt-6 flex justify-center">
          <img
            src={bottomImage.imageUrl}
            alt={bottomImage.imageAltText || "Empower live healthy"}
            className="max-w-full object-contain"
            style={{
              width: bottomImage.widthPercentage
                ? `${Number(bottomImage.widthPercentage)}%`
                : "100%",
              maxHeight: bottomImage.heightPercentage
                ? `${Number(bottomImage.heightPercentage)}vw`
                : "40vh",
            }}
          />
        </div>
      ) : null}

      <HelpCountdownModal
        open={helpOpen}
        countdown={countdown}
        sending={sending}
        onCancel={closeHelpModal}
        onConfirm={handleHelpConfirm}
      />

      <MessageModal
        open={alertSentOpen}
        title="Alert sent"
        message="Your current location has been shared with your emergency contacts."
        onClose={() => setAlertSentOpen(false)}
      />

      <MessageModal
        open={noContactsOpen}
        title="No emergency contacts"
        message="Please add an emergency contact before using the SOS feature."
        confirmLabel="Add contacts"
        onClose={() => setNoContactsOpen(false)}
        onConfirm={() => {
          setNoContactsOpen(false)
          navigate("/app/sos/contacts")
        }}
      />

      <DoctorSearchModal
        open={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        onSearch={handleDoctorSearch}
      />
    </SosShell>
  )
}
