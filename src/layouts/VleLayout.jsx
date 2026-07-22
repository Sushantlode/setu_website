import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Phone,
  Trophy,
  UserPlus,
  Wallet,
  X,
} from "lucide-react"
import { assets } from "../data/content"
import { useAuth } from "../context/AuthContext"

const SOS_RED = "#EA080E"

const VLE_TABS = [
  { id: "dashboard", label: "Dashboard", to: "/vle/dashboard", end: true, Icon: Home },
  { id: "register", label: "Register", to: "/vle/register-user", Icon: UserPlus },
  { id: "wallet", label: "Wallet", to: "/vle/wallet", Icon: Wallet },
  { id: "leaderboard", label: "Leaderboard", to: "/vle/leaderboard", Icon: Trophy },
]

export default function VleLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate("/")
  }

  const displayName = session?.name || session?.vlePublicId || "VLE Portal"
  const vleId = session?.vlePublicId || session?.vle_id || ""

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "border-setu-coral/55 bg-setu-coral/10 text-setu-beige"
        : "border-transparent text-setu-sand/90 hover:border-setu-coral hover:bg-setu-coral/10 hover:text-setu-beige"
    }`

  const mutedLinkClass =
    "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-2 text-sm font-medium text-setu-sand/90 transition-colors hover:border-setu-coral hover:bg-setu-coral/10 hover:text-setu-beige"

  const renderNavLink = (tab, { iconOnly = false } = {}) => (
    <NavLink
      key={tab.id}
      to={tab.to}
      end={tab.end}
      onClick={() => setMenuOpen(false)}
      className={linkClass}
      title={tab.label}
    >
      <tab.Icon size={16} />
      {!iconOnly && <span>{tab.label}</span>}
      {iconOnly && <span className="sr-only">{tab.label}</span>}
    </NavLink>
  )

  return (
    <div className="flex min-h-svh min-h-dvh flex-col overflow-x-hidden bg-[#F7FAFF]">
      <header
        className="app-safe-top sticky top-0 z-40 border-b text-setu-sand shadow-sm backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-setu-charcoal) 92%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-setu-stone) 20%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
          <Link
            to="/vle/dashboard"
            className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[40%] sm:flex-none sm:gap-3"
          >
            <img
              src={assets.logo}
              alt="SETU"
              className="h-7 w-auto shrink-0 brightness-0 invert sm:h-8"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-setu-sand">{displayName}</p>
              {vleId ? (
                <p className="truncate text-[11px] text-setu-sand/70 sm:text-xs">VLE · {vleId}</p>
              ) : (
                <p className="truncate text-[11px] text-setu-sand/70 sm:text-xs">VLE Portal</p>
              )}
            </div>
          </Link>

          <nav className="ml-auto hidden min-w-0 items-center gap-1 lg:flex" aria-label="VLE">
            {VLE_TABS.map((tab) => renderNavLink(tab))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              to="/app/sos"
              className="tap-target inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: SOS_RED }}
              aria-label="SOS Help"
            >
              <Phone size={16} />
              <span className="hidden sm:inline">SOS</span>
            </Link>

            <Link to="/" className={`${mutedLinkClass} hidden md:inline-flex`} title="Website">
              <LayoutGrid size={16} />
              <span className="hidden lg:inline">Website</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="tap-target hidden items-center justify-center gap-1.5 rounded-full border border-setu-stone/25 px-2.5 py-2 text-sm font-medium text-setu-sand transition-colors hover:border-setu-coral hover:bg-setu-coral/10 hover:text-setu-beige md:inline-flex"
            >
              <LogOut size={16} />
              <span className="hidden lg:inline">Logout</span>
            </button>

            <button
              type="button"
              className="tap-target inline-flex items-center justify-center rounded-full p-2 text-setu-sand transition-colors hover:bg-setu-coral/10 hover:text-setu-beige lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="border-t px-3 py-3 lg:hidden"
            style={{
              borderColor: "color-mix(in srgb, var(--color-setu-stone) 20%, transparent)",
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {VLE_TABS.map((tab) => renderNavLink(tab))}
              <Link to="/" onClick={() => setMenuOpen(false)} className={mutedLinkClass}>
                <LayoutGrid size={16} />
                Website
              </Link>
              <Link to="/app/sos" onClick={() => setMenuOpen(false)} className={mutedLinkClass}>
                <Phone size={16} />
                SOS Help
              </Link>
              <button type="button" onClick={handleLogout} className={`${mutedLinkClass} justify-start`}>
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Tablet: compact icon nav */}
      <nav
        className="sticky top-[var(--vle-nav-offset,3.25rem)] z-30 hidden border-b border-[#D2DEFF] bg-white/95 px-2 py-2 backdrop-blur-sm md:flex lg:hidden"
        aria-label="VLE tabs"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-1">
          {VLE_TABS.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `inline-flex flex-1 max-w-[8rem] flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-[#1C39BB] text-white"
                    : "text-setu-muted hover:bg-[#EEF3FF] hover:text-[#1C39BB]"
                }`
              }
            >
              <tab.Icon size={18} />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile bottom nav — matches app-style thumb reach */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D2DEFF] bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
        aria-label="VLE bottom navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {VLE_TABS.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? "text-[#1C39BB]" : "text-setu-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isActive ? "bg-[#EEF3FF]" : ""
                    }`}
                  >
                    <tab.Icon size={20} className={isActive ? "text-[#1C39BB]" : ""} />
                  </span>
                  <span className="truncate">{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1 overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </div>
    </div>
  )
}
