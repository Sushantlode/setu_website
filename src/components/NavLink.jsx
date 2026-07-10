import { useEffect, useState } from "react"

export default function NavLink({ href, label, onClick, onNavigate }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const section = document.querySelector(href)
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [href])

  const handleClick = (e) => {
    if (href.startsWith("#")) onNavigate?.(href)
    onClick?.(e)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`nav-link ${active ? "nav-link-active" : ""}`}
    >
      {label}
    </a>
  )
}
