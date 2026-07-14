import { useEffect, useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { Copy, Check, FileText, Home, Info, LogOut, Menu, Phone, X } from "lucide-react"
import { assets } from "../data/content"
import { useAuth } from "../context/AuthContext"
import { getBottomApps } from "../api/dashboard"
import { resolveAppLabel } from "../utils/appLabels"

const SOS_RED = "#EA080E"

const FALLBACK_TABS = [
  { id: "home", label: "Home", to: "/app", end: true, Icon: Home },
  { id: "reports", label: "Reports", to: "/app/reports", Icon: FileText },
  { id: "about", label: "About Us", to: "/#about", Icon: Info, external: true },
]

function mapApiTab(tab) {
  const route = String(tab.route_name || "").toLowerCase()
  const labelKey = String(tab.label || "").toLowerCase()
  const label = resolveAppLabel(tab.label, tab.route_name)

  if (route.includes("report") || labelKey === "report" || labelKey === "reports") {
    return {
      id: `api-${tab.id || "reports"}`,
      label,
      to: "/app/reports",
      Icon: FileText,
      iconUrl: tab.icon_url,
    }
  }
  if (
    route.includes("home") ||
    route.includes("dashboard") ||
    labelKey === "home" ||
    labelKey === "dashboard.home"
  ) {
    return {
      id: `api-${tab.id || "home"}`,
      label,
      to: "/app",
      end: true,
      Icon: Home,
      iconUrl: tab.icon_url,
    }
  }
  if (route.includes("about") || labelKey === "about_us") {
    return {
      id: `api-${tab.id || "about"}`,
      label,
      to: "/#about",
      Icon: Info,
      external: true,
      iconUrl: tab.icon_url,
    }
  }
  if (
    route.includes("rate") ||
    route.includes("feedback") ||
    labelKey === "rate_us" ||
    labelKey === "rate_the_app"
  ) {
    return {
      id: `api-${tab.id || "rate"}`,
      label,
      to: "/#contact",
      Icon: Info,
      external: true,
      iconUrl: tab.icon_url,
    }
  }
  return null
}

function NavIcon({ tab, className = "h-4 w-4" }) {
  if (tab.iconUrl) {
    return (
      <img
        src={tab.iconUrl}
        alt=""
        className={`${className} object-contain brightness-0 invert opacity-90`}
      />
    )
  }
  const Icon = tab.Icon
  return <Icon className={className} size={16} />
}

function tabLabel(tab) {
  return resolveAppLabel(tab.label, tab.route_name)
}

export default function AppLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [tabs, setTabs] = useState(FALLBACK_TABS)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    getBottomApps()
      .then((apps) => {
        if (cancelled || !Array.isArray(apps) || apps.length === 0) return
        const mapped = apps
          .filter(
            (item) =>
              item.route_name !== "NewSosHome" &&
              item.label !== "dashboardSOS" &&
              item.id !== 5,
          )
          .map(mapApiTab)
          .filter(Boolean)
        if (mapped.length > 0) {
          setTabs(mapped)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate("/")
  }

  const copyUhid = async () => {
    if (!session?.uhid) return
    try {
      await navigator.clipboard.writeText(String(session.uhid))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const displayName = session?.first_name || session?.username || "SETU User"

  const primaryTabs = tabs.filter((t) => {
    const id = String(t.id || "").toLowerCase()
    const label = String(t.label || "").toLowerCase()
    const to = String(t.to || "")
    return (
      to === "/app" ||
      to === "/app/reports" ||
      id.includes("home") ||
      id.includes("report") ||
      label.includes("home") ||
      label.includes("report")
    )
  })
  const navTabs = primaryTabs.length >= 2 ? primaryTabs.slice(0, 2) : FALLBACK_TABS.slice(0, 2)
  const secondaryTabs = tabs.filter((t) => !navTabs.some((n) => n.id === t.id))

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "border-setu-coral/55 bg-setu-coral/10 text-setu-beige"
        : "border-transparent text-setu-sand/90 hover:border-setu-coral hover:bg-setu-coral/10 hover:text-setu-beige"
    }`

  const mutedLinkClass =
    "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-2 text-sm font-medium text-setu-sand/90 transition-colors hover:border-setu-coral hover:bg-setu-coral/10 hover:text-setu-beige"

  const renderNavLink = (tab, { iconOnly = false } = {}) => {
    const label = tabLabel(tab)
    if (tab.external) {
      return (
        <a
          key={tab.id}
          href={tab.to}
          onClick={() => setMenuOpen(false)}
          className={mutedLinkClass}
          title={label}
        >
          <NavIcon tab={tab} />
          {!iconOnly && <span>{label}</span>}
          {iconOnly && <span className="sr-only">{label}</span>}
        </a>
      )
    }
    return (
      <NavLink
        key={tab.id}
        to={tab.to}
        end={tab.end}
        onClick={() => setMenuOpen(false)}
        className={linkClass}
        title={label}
      >
        <NavIcon tab={tab} />
        {!iconOnly && <span>{label}</span>}
        {iconOnly && <span className="sr-only">{label}</span>}
      </NavLink>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-setu-cream">
      <header
        className="sticky top-0 z-40 border-b text-setu-sand shadow-sm backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-setu-charcoal) 92%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-setu-stone) 20%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
          <Link to="/app" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src={assets.logo}
              alt="SETU"
              className="h-7 w-auto shrink-0 brightness-0 invert sm:h-8"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-setu-sand">{displayName}</p>
              {session?.uhid ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    copyUhid()
                  }}
                  className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs text-setu-sand/70 transition-colors hover:text-setu-beige"
                  title="Copy UHID"
                >
                  <span className="truncate">UHID {session.uhid}</span>
                  {copied ? (
                    <Check size={12} className="shrink-0" />
                  ) : (
                    <Copy size={12} className="shrink-0" />
                  )}
                </button>
              ) : session?.mobile ? (
                <p className="truncate text-xs text-setu-sand/70">+91 {session.mobile}</p>
              ) : null}
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="App">
            {navTabs.map((tab) => renderNavLink(tab))}
            {secondaryTabs.map((tab) => renderNavLink(tab))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {/* Mobile: compact icon nav */}
            <nav className="flex items-center gap-0.5 md:hidden" aria-label="App">
              {navTabs.map((tab) => renderNavLink(tab, { iconOnly: true }))}
            </nav>

            <Link
              to="/app/sos"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: SOS_RED }}
              aria-label="SOS Help"
            >
              <Phone size={16} />
              <span className="hidden sm:inline">SOS</span>
            </Link>

            <a
              href="tel:108"
              className={`${mutedLinkClass} hidden lg:inline`}
              title="Call 108"
            >
              108
            </a>

            <Link to="/" className={`${mutedLinkClass} hidden sm:inline`}>
              Website
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-setu-stone/25 px-2.5 py-2 text-sm font-medium text-setu-sand transition-colors hover:border-setu-coral hover:bg-setu-coral/10 hover:text-setu-beige"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full p-2 text-setu-sand transition-colors hover:bg-setu-coral/10 hover:text-setu-beige md:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile overflow menu */}
        {menuOpen && (
          <div
            className="border-t px-3 py-3 md:hidden"
            style={{
              borderColor: "color-mix(in srgb, var(--color-setu-stone) 20%, transparent)",
            }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {secondaryTabs.map((tab) => renderNavLink(tab))}
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className={`${mutedLinkClass} sm:hidden`}
              >
                Website
              </Link>
              <a href="tel:108" className={mutedLinkClass}>
                Call 108 Ambulance
              </a>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
