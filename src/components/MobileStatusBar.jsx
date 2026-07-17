import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const THEMES = {
  dark: {
    top: "#2a2826",
    bottom: "#faf9f7",
    themeColor: "#2a2826",
    appleStatusBar: "black-translucent",
  },
  auth: {
    top: "#F7FAFF",
    bottom: "#F7FAFF",
    themeColor: "#1C39BB",
    appleStatusBar: "default",
  },
}

function resolveTheme(pathname) {
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register/profile") ||
    pathname.startsWith("/register/complete")
  ) {
    return THEMES.auth
  }
  if (pathname.startsWith("/register")) {
    return THEMES.auth
  }
  return THEMES.dark
}

function setMeta(name, content, attribute = "name") {
  let el = document.querySelector(`meta[${attribute}="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attribute, name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

export default function MobileStatusBar() {
  const { pathname } = useLocation()
  const theme = resolveTheme(pathname)

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--status-bar-top-bg", theme.top)
    root.style.setProperty("--status-bar-bottom-bg", theme.bottom)
    root.dataset.statusBarTheme = pathname.startsWith("/login") ||
      pathname.startsWith("/register")
      ? "auth"
      : "dark"

    setMeta("theme-color", theme.themeColor)
    setMeta("apple-mobile-web-app-status-bar-style", theme.appleStatusBar)
  }, [pathname, theme])

  return (
    <>
      <div className="mobile-status-bar mobile-status-bar--top" aria-hidden="true" />
      <div className="mobile-status-bar mobile-status-bar--bottom" aria-hidden="true" />
    </>
  )
}
