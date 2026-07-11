import { Link } from "react-router-dom"
import { ArrowLeft, Phone, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchNearbyServices } from "../api/dashboard"

const HELPLINES = [
  { label: "Ambulance", number: "108", note: "National emergency medical" },
  { label: "Police", number: "100", note: "Local police emergency" },
  { label: "Fire", number: "101", note: "Fire & rescue" },
  { label: "Women helpline", number: "1091", note: "Women in distress" },
  { label: "Child helpline", number: "1098", note: "Child protection" },
  { label: "Disaster", number: "1078", note: "NDRF / disaster response" },
]

export default function SosPage() {
  const [services, setServices] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchNearbyServices("en")
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.services)
            ? data.services
            : []
        setServices(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:max-w-5xl lg:px-8">
      <Link
        to="/app"
        className="mb-5 inline-flex items-center gap-2 text-sm text-setu-muted transition-colors hover:text-setu-charcoal"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="overflow-hidden rounded-[1.75rem] border border-red-100 bg-white shadow-sm">
        <div className="bg-[#EA080E] px-6 py-8 text-white sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            Emergency
          </p>
          <h1 className="mt-2 font-serif text-3xl">SOS / Help</h1>
          <p className="mt-2 max-w-md text-sm text-white/90">
            Call a national helpline immediately in a medical or safety emergency.
          </p>
        </div>

        <div className="space-y-4 px-6 py-6 sm:px-8">
          <a
            href="tel:108"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EA080E] px-4 py-4 text-lg font-semibold text-white transition-opacity hover:opacity-95"
          >
            <Phone size={22} />
            Call 108 Ambulance
          </a>

          <div className="grid gap-2 sm:grid-cols-2">
            {HELPLINES.map((line) => (
              <a
                key={line.number}
                href={`tel:${line.number}`}
                className="rounded-2xl border border-setu-stone/15 bg-setu-cream px-4 py-3 transition-colors hover:border-red-200 hover:bg-[#FFF5F5]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-setu-charcoal">{line.label}</p>
                  <p className="text-lg font-semibold text-[#EA080E]">{line.number}</p>
                </div>
                <p className="mt-0.5 text-xs text-setu-muted">{line.note}</p>
              </a>
            ))}
          </div>

          {loaded && services.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-setu-charcoal">
                <MapPin size={16} className="text-[#1C39BB]" />
                Nearby services
              </h2>
              <ul className="space-y-2">
                {services.slice(0, 8).map((svc, i) => (
                  <li
                    key={svc.id || svc.name || i}
                    className="rounded-xl border border-setu-stone/15 bg-setu-sand/40 px-4 py-3 text-sm text-setu-charcoal"
                  >
                    {svc.name || svc.title || svc.label || "Service"}
                    {svc.phone || svc.contact ? (
                      <a
                        href={`tel:${svc.phone || svc.contact}`}
                        className="mt-1 block text-[#1C39BB] hover:underline"
                      >
                        {svc.phone || svc.contact}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
