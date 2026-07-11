import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { appModules, assets } from "../../data/content"

export default function TelemedicineWelcome() {
  const navigate = useNavigate()
  const module = appModules.find((m) => m.id === "telemedicine")
  const hero =
    module?.heroImage || assets.telemedicine?.[0] || assets.heroFallback
  const [imgOk, setImgOk] = useState(true)

  return (
    <main className="relative min-h-[calc(100svh-4.5rem)] overflow-hidden bg-setu-charcoal text-white">
      {imgOk ? (
        <img
          src={hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #0b1a6e 0%, #1C39BB 45%, #4b6bff 100%)",
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/55 to-black/25" />

      <div className="relative z-10 flex min-h-[calc(100svh-4.5rem)] flex-col px-5 pb-10 pt-5 sm:px-8">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="mt-[12vh] max-w-xl sm:mt-[14vh]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
            SETU
          </p>
          <h1 className="mt-2 font-serif text-4xl font-normal leading-tight sm:text-5xl">
            {module?.welcomeTitle || "Doctors"}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
            {module?.welcomeSubtitle ||
              "Consult doctors online quickly and conveniently from anywhere."}
          </p>
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 pt-10 sm:flex-row sm:justify-center">
          <Link
            to="/app/telemedicine/home"
            replace
            className="inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-full bg-[#1C39BB] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/app/telemedicine/appointments"
            className="text-sm text-white/80 underline-offset-2 hover:text-white hover:underline"
          >
            My appointments
          </Link>
        </div>
      </div>
    </main>
  )
}
