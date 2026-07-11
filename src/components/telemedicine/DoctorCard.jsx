import { Star, MapPin } from "lucide-react"
import { doctorImageUrl, formatDoctorRatingDisplay } from "../../utils/telemedicine"

export default function DoctorCard({ doctor, onBook, onOpen }) {
  const img = doctorImageUrl(doctor)
  const rating = formatDoctorRatingDisplay(doctor?.average_rating ?? doctor?.rating)
  const exp = doctor?.exp ? String(doctor.exp) : null

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[#D2DEFF] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => onOpen?.(doctor)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#EEF3FF] sm:h-[4.5rem] sm:w-[4.5rem]">
          {img ? (
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#1C39BB]">
              {(doctor?.name || "D").charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-setu-charcoal">{doctor?.name}</h3>
          {doctor?.sname ? (
            <p className="mt-0.5 truncate text-sm text-[#1C39BB]">{doctor.sname}</p>
          ) : null}
          <p className="mt-1 truncate text-xs text-setu-muted">
            {doctor?.education || "MBBS"}
            {exp ? ` · ${exp} yrs` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-setu-muted">
            {rating ? (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <Star size={12} fill="currentColor" />
                {rating}
              </span>
            ) : null}
            {doctor?.city_name ? (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {doctor.city_name}
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onBook?.(doctor)}
        className="w-full shrink-0 rounded-full bg-[#1C39BB] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 sm:w-auto"
      >
        Book
      </button>
    </article>
  )
}
