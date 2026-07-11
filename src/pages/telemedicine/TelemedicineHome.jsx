import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  Search,
  Loader2,
} from "lucide-react"
import {
  getDoctorSpecialities,
  getSymptoms,
  getTelemedicineBanners,
  searchDoctorsTypeahead,
} from "../../api/telemedicine"
import {
  doctorImageUrl,
  normalizeTeleSpecialities,
  normalizeTeleSymptoms,
} from "../../utils/telemedicine"
import { TelemedicineHomeSkeleton } from "../../components/AppSkeleton"
import TeleIcon from "../../components/telemedicine/TeleIcon"

function itemId(item) {
  return (
    item?.id ??
    item?.specialityId ??
    item?.specialtyId ??
    item?.symptomId ??
    item?.name
  )
}

function itemName(item) {
  return (
    item?.name ||
    item?.specialityName ||
    item?.specialtyName ||
    item?.symptomName ||
    item?.title ||
    "Item"
  )
}

export default function TelemedicineHome() {
  const navigate = useNavigate()
  const [specialities, setSpecialities] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const [bannerIndex, setBannerIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError("")
      try {
        const [specs, syms, bans] = await Promise.all([
          getDoctorSpecialities().catch(() => []),
          getSymptoms().catch(() => []),
          getTelemedicineBanners().catch(() => []),
        ])
        if (cancelled) return
        // RN FindDoctors: canonical specialty labels + iconKey; curated symptom chips
        const normalizedSpecs = normalizeTeleSpecialities(specs)
        setSpecialities(normalizedSpecs)
        setSymptoms(normalizeTeleSymptoms(syms, normalizedSpecs))
        setBanners(
          bans
            .map((b, i) => ({
              key: `b-${i}`,
              src:
                b?.imageUrl ||
                b?.image_url ||
                b?.banner_url ||
                b?.url ||
                b?.iconUrl ||
                "",
              title: b?.title || "",
              specialityId: b?.specialityId || b?.specialtyId,
              specialityName: b?.specialityName || b?.specialtyName,
            }))
            .filter((b) => b.src),
        )
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not load telemedicine home")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (banners.length < 2) return undefined
    const id = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length)
    }, 4500)
    return () => clearInterval(id)
  }, [banners.length])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      return undefined
    }
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const { list } = await searchDoctorsTypeahead(q, 12)
        if (cancelled) return
        const localSpecs = specialities
          .filter((s) => itemName(s).toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
          .map((s) => ({ type: "speciality", item: s }))
        const localSyms = symptoms
          .filter((s) => itemName(s).toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
          .map((s) => ({ type: "symptom", item: s }))
        const docs = list.slice(0, 8).map((d) => ({ type: "doctor", item: d }))
        setSuggestions([...docs, ...localSpecs, ...localSyms])
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 180)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [query, specialities, symptoms])

  const activeBanner = banners[bannerIndex]

  const openSpeciality = (item) => {
    navigate("/app/telemedicine/doctors", {
      state: {
        specialityId: itemId(item),
        specialityName: itemName(item),
      },
    })
  }

  const openSymptom = (item) => {
    navigate("/app/telemedicine/doctors", {
      state: {
        symptomId: itemId(item),
        symptomName: itemName(item),
      },
    })
  }

  const onSuggestion = (entry) => {
    setQuery("")
    setSuggestions([])
    if (entry.type === "doctor") {
      navigate("/app/telemedicine/doctors", {
        state: {
          staffId: [entry.item.staff_id],
          doctorName: entry.item.name,
          prefillDoctor: entry.item,
          singleDoctorPick: true,
        },
      })
    } else if (entry.type === "speciality") {
      openSpeciality(entry.item)
    } else {
      openSymptom(entry.item)
    }
  }

  const shownSpecialities = useMemo(() => specialities.slice(0, 12), [specialities])
  const shownSymptoms = useMemo(() => symptoms.slice(0, 12), [symptoms])

  return (
    <main className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/app")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D2DEFF] text-[#1C39BB] transition-colors hover:bg-[#EEF3FF]"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-2xl text-setu-charcoal sm:text-3xl">
              Find doctors
            </h1>
            <p className="text-sm text-setu-muted">
              Search by specialty, symptom, or name
            </p>
          </div>
        </div>
        <Link
          to="/app/telemedicine/appointments"
          className="inline-flex items-center gap-2 rounded-full border border-[#D2DEFF] bg-white px-4 py-2 text-sm font-medium text-[#1C39BB] transition-colors hover:bg-[#EEF3FF]"
        >
          <CalendarDays size={16} />
          Appointments
        </Link>
      </div>

      <div className="relative mb-5">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-setu-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search doctors, specialties, symptoms…"
          className="w-full rounded-2xl border border-[#D2DEFF] bg-white py-3 pl-11 pr-4 text-sm text-setu-charcoal outline-none ring-[#1C39BB]/30 focus:ring-2"
        />
        {searching && (
          <Loader2
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-[#1C39BB]"
          />
        )}
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-[#D2DEFF] bg-white py-2 shadow-lg">
            {suggestions.map((entry, i) => {
              const name = itemName(entry.item)
              const img =
                entry.type === "doctor" ? doctorImageUrl(entry.item) : ""
              return (
                <li key={`${entry.type}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onSuggestion(entry)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#EEF3FF]"
                  >
                    {entry.type === "doctor" ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEF3FF] text-xs font-semibold text-[#1C39BB]">
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          name.charAt(0)
                        )}
                      </span>
                    ) : (
                      <TeleIcon
                        item={entry.item}
                        kind={entry.type === "speciality" ? "speciality" : "symptom"}
                        size={28}
                        className="shrink-0 rounded-full bg-[#EEF3FF] p-1"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium text-setu-charcoal">
                      {name}
                    </span>
                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-setu-muted">
                      {entry.type}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {activeBanner && (
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-[#EEF3FF]">
          <img
            src={activeBanner.src}
            alt={activeBanner.title || "Telemedicine"}
            className="h-36 w-full object-cover sm:h-44"
            loading="lazy"
          />
        </div>
      )}

      {loading ? (
        <TelemedicineHomeSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-[#FFF5F5] px-4 py-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <section className="mb-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl text-setu-charcoal">Specialties</h2>
                <p className="text-sm text-setu-muted">Browse doctors by medical specialty</p>
              </div>
              <Link
                to="/app/telemedicine/doctors"
                className="text-sm font-medium text-[#1C39BB] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {shownSpecialities.map((item) => (
                <button
                  key={String(itemId(item))}
                  type="button"
                  onClick={() => openSpeciality(item)}
                  className="rounded-2xl border border-[#D2DEFF] bg-[#F7FAFF] px-3 py-4 text-center transition-colors hover:bg-[#EEF3FF]"
                >
                  <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white p-1.5 shadow-sm sm:h-14 sm:w-14 sm:p-2">
                    <TeleIcon
                      item={item}
                      kind="speciality"
                      size={null}
                      className="h-full w-full"
                    />
                  </span>
                  <span className="block text-xs font-medium leading-snug text-setu-charcoal sm:text-sm">
                    {itemName(item)}
                  </span>
                </button>
              ))}
              {shownSpecialities.length === 0 && (
                <p className="col-span-full text-sm text-setu-muted">
                  No specialties available right now.
                </p>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3">
              <h2 className="font-serif text-xl text-setu-charcoal">Symptoms</h2>
              <p className="text-sm text-setu-muted">Find care based on how you feel</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {shownSymptoms.map((item) => (
                <button
                  key={String(itemId(item))}
                  type="button"
                  onClick={() => openSymptom(item)}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#D2DEFF] bg-white px-3 py-2 text-left transition-colors hover:bg-[#EEF3FF] sm:px-4 sm:py-2.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEF3FF] sm:h-10 sm:w-10">
                    <TeleIcon
                      item={item}
                      kind="symptom"
                      size={null}
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 truncate text-xs font-medium text-setu-charcoal sm:text-sm">
                    {itemName(item)}
                  </span>
                </button>
              ))}
              {shownSymptoms.length === 0 && (
                <p className="w-full text-sm text-setu-muted">
                  No symptoms listed right now.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
