import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Filter, Search, X } from "lucide-react"
import DoctorCard from "../../components/telemedicine/DoctorCard"
import { DoctorListSkeleton } from "../../components/AppSkeleton"
import { filterDoctors, getFilterOptions } from "../../api/telemedicine"
import { cacheDoctor } from "../../utils/telemedicine"

function optionId(item) {
  return item?.id ?? item?.specialityId ?? item?.genderId ?? item?.languageId ?? item?.symptomId
}

function optionName(item) {
  return (
    item?.name ||
    item?.specialityName ||
    item?.genderName ||
    item?.languageName ||
    item?.symptomName ||
    "Option"
  )
}

export default function DoctorsList() {
  const navigate = useNavigate()
  const location = useLocation()
  const initial = location.state || {}
  const specialityName = initial.specialityName
  const symptomName = initial.symptomName
  const singleDoctorPick = initial.singleDoctorPick
  const doctorName = initial.doctorName
  const prefillDoctor = initial.prefillDoctor
  const initialSpecialityId = initial.specialityId
  const initialSymptomId = initial.symptomId
  const initialStaffId = initial.staffId

  const [doctors, setDoctors] = useState(prefillDoctor ? [prefillDoctor] : [])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState(doctorName || "")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [options, setOptions] = useState({
    specialities: [],
    genders: [],
    languages: [],
    symptoms: [],
  })

  const [specialityIds, setSpecialityIds] = useState(
    initialSpecialityId ? [String(initialSpecialityId)] : [],
  )
  const [genderIds, setGenderIds] = useState([])
  const [langIds, setLangIds] = useState([])
  const [symptomsId, setSymptomsId] = useState(
    initialSymptomId ? [String(initialSymptomId)] : [],
  )
  const [staffId] = useState(
    Array.isArray(initialStaffId)
      ? initialStaffId.map(String)
      : initialStaffId
        ? [String(initialStaffId)]
        : [],
  )

  const title = useMemo(() => {
    if (specialityName) return specialityName
    if (symptomName) return symptomName
    if (singleDoctorPick) return doctorName || "Doctor"
    return "Doctors"
  }, [specialityName, symptomName, singleDoctorPick, doctorName])

  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(() => {})
  }, [])

  const load = useCallback(
    async (pageNum = 1, searchText = search) => {
      setLoading(true)
      setError("")
      try {
        const { list, totalRecords } = await filterDoctors({
          specialityIds,
          genderIds,
          langIds,
          symptomsId,
          staffId,
          page: pageNum,
          limit: 10,
          staffName: searchText.trim(),
        })
        setDoctors(list)
        setTotal(totalRecords || list.length)
        setPage(pageNum)
        if (list.length === 0 && prefillDoctor && singleDoctorPick) {
          setDoctors([prefillDoctor])
          setTotal(1)
        }
      } catch (err) {
        setError(err?.message || "Could not load doctors")
        if (prefillDoctor) {
          setDoctors([prefillDoctor])
          setTotal(1)
        }
      } finally {
        setLoading(false)
      }
    },
    [
      specialityIds,
      genderIds,
      langIds,
      symptomsId,
      staffId,
      search,
      prefillDoctor,
      singleDoctorPick,
    ],
  )

  useEffect(() => {
    const t = setTimeout(() => {
      void load(1, search)
    }, 150)
    return () => clearTimeout(t)
  }, [load, search])

  const openDoctor = (doctor) => {
    cacheDoctor(doctor)
    navigate(`/app/telemedicine/doctors/${doctor.staff_id}`, {
      state: { doctor },
    })
  }

  const bookDoctor = (doctor) => {
    cacheDoctor(doctor)
    navigate(`/app/telemedicine/doctors/${doctor.staff_id}`, {
      state: { doctor, focusSlots: true },
    })
  }

  const toggleId = (list, setList, id) => {
    const sid = String(id)
    setList((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / 10))

  return (
    <main className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/app/telemedicine/home")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D2DEFF] text-[#1C39BB] hover:bg-[#EEF3FF]"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl text-setu-charcoal sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-setu-muted">
              {loading ? "Loading…" : `${total || doctors.length} doctor(s)`}
            </p>
          </div>
        </div>
        <Link
          to="/app/telemedicine/appointments"
          className="text-sm font-medium text-[#1C39BB] hover:underline"
        >
          My appointments
        </Link>
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-setu-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name"
            className="w-full rounded-2xl border border-[#D2DEFF] bg-white py-3 pl-11 pr-4 text-sm outline-none ring-[#1C39BB]/30 focus:ring-2"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#D2DEFF] bg-white px-4 py-3 text-sm font-medium text-[#1C39BB] hover:bg-[#EEF3FF] lg:hidden"
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside
          className={`${
            filtersOpen ? "block" : "hidden"
          } rounded-2xl border border-[#D2DEFF] bg-[#F7FAFF] p-4 lg:block`}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-setu-charcoal">Filters</p>
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            >
              <X size={16} />
            </button>
          </div>

          <FilterGroup
            label="Specialty"
            options={options.specialities}
            selected={specialityIds}
            onToggle={(id) => toggleId(specialityIds, setSpecialityIds, id)}
          />
          <FilterGroup
            label="Gender"
            options={options.genders}
            selected={genderIds}
            onToggle={(id) => toggleId(genderIds, setGenderIds, id)}
          />
          <FilterGroup
            label="Language"
            options={options.languages}
            selected={langIds}
            onToggle={(id) => toggleId(langIds, setLangIds, id)}
          />
          <FilterGroup
            label="Symptom"
            options={options.symptoms}
            selected={symptomsId}
            onToggle={(id) => toggleId(symptomsId, setSymptomsId, id)}
          />
        </aside>

        <section>
          {loading ? (
            <DoctorListSkeleton />
          ) : error && doctors.length === 0 ? (
            <div className="rounded-2xl border border-red-100 bg-[#FFF5F5] px-4 py-8 text-center text-sm text-red-700">
              {error}
            </div>
          ) : doctors.length === 0 ? (
            <div className="rounded-2xl border border-[#D2DEFF] bg-white px-4 py-12 text-center">
              <p className="font-medium text-setu-charcoal">No doctors found</p>
              <p className="mt-1 text-sm text-setu-muted">
                Try another specialty, symptom, or search term.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSpecialityIds([])
                  setGenderIds([])
                  setLangIds([])
                  setSymptomsId([])
                  setSearch("")
                }}
                className="mt-4 text-sm font-medium text-[#1C39BB] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <DoctorCard
                  key={String(doctor.staff_id)}
                  doctor={doctor}
                  onOpen={openDoctor}
                  onBook={bookDoctor}
                />
              ))}
            </div>
          )}

          {!singleDoctorPick && totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => load(page - 1)}
                className="rounded-full border border-[#D2DEFF] px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-setu-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => load(page + 1)}
                className="rounded-full border border-[#D2DEFF] px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function FilterGroup({ label, options, selected, onToggle }) {
  if (!options?.length) return null
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-setu-muted">
        {label}
      </p>
      <div className="flex max-h-40 flex-col gap-1 overflow-auto pr-1">
        {options.map((opt) => {
          const id = String(optionId(opt))
          const checked = selected.includes(id)
          return (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(id)}
                className="rounded border-[#D2DEFF] text-[#1C39BB] focus:ring-[#1C39BB]"
              />
              <span className="truncate text-setu-charcoal">{optionName(opt)}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
