import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
  CONSUMPTION_OPTIONS,
  REMINDER_DAY_OPTIONS,
  createReminder,
  deleteReminder,
  fetchReminders,
  updateReminder,
} from "../../api/drug"
import { DrugShell } from "./DrugShell"

const emptyForm = {
  medicine_name: "",
  dosage: "1",
  reminder_time: "08:00",
  consumption_time: "before_food",
  is_daily: true,
  reminder_days: [],
  is_active: true,
}

function toDisplayTime(value) {
  const raw = String(value || "").trim()
  if (!raw) return "—"
  // Already "08:00 AM" style
  if (/\s?(AM|PM)$/i.test(raw)) return raw
  // HH:mm 24h → 12h
  const m = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return raw
  let h = Number(m[1])
  const min = m[2]
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${String(h).padStart(2, "0")}:${min} ${ampm}`
}

function toApiTime(value) {
  const raw = String(value || "").trim()
  if (/\s?(AM|PM)$/i.test(raw)) return raw
  const m = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return raw
  let h = Number(m[1])
  const min = m[2]
  const ampm = h >= 12 ? "PM" : "AM"
  h = h % 12 || 12
  return `${String(h).padStart(2, "0")}:${min} ${ampm}`
}

function dayLabel(days) {
  if (!Array.isArray(days) || days.length === 0) return "Daily"
  if (days.length === 7) return "Daily"
  return days
    .map((d) => REMINDER_DAY_OPTIONS.find((o) => o.value === d)?.label || d)
    .join(", ")
}

export default function DrugReminders() {
  const { session } = useAuth()
  const auth = {
    token: session?.token,
    refreshToken: session?.refreshToken,
  }

  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const list = await fetchReminders(auth)
      setReminders(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err.message || "Failed to load reminders")
    } finally {
      setLoading(false)
    }
  }, [session?.token, session?.refreshToken])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
    setError("")
  }

  const openEdit = (item) => {
    setEditingId(item.id)
    const days = Array.isArray(item.reminder_days) ? item.reminder_days : []
    setForm({
      medicine_name: item.medicine_name || "",
      dosage: String(item.dosage ?? "1"),
      reminder_time: String(item.reminder_time || "08:00")
        .replace(/\s?(AM|PM)/i, "")
        .trim()
        .slice(0, 5) || "08:00",
      consumption_time: item.consumption_time || "before_food",
      is_daily: Boolean(item.is_daily) || days.length === 0 || days.length === 7,
      reminder_days: days,
      is_active: item.is_active !== false,
    })
    setFormOpen(true)
    setError("")
  }

  const toggleDay = (value) => {
    setForm((prev) => {
      const has = prev.reminder_days.includes(value)
      return {
        ...prev,
        is_daily: false,
        reminder_days: has
          ? prev.reminder_days.filter((d) => d !== value)
          : [...prev.reminder_days, value],
      }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const name = form.medicine_name.trim()
    if (!name) {
      setError("Enter a medicine name.")
      return
    }
    const dosage = Number(form.dosage)
    if (!dosage || dosage < 1) {
      setError("Enter a valid dosage.")
      return
    }
    const days = form.is_daily
      ? REMINDER_DAY_OPTIONS.map((d) => d.value)
      : form.reminder_days
    if (!form.is_daily && days.length === 0) {
      setError("Select at least one day, or choose Daily.")
      return
    }

    const payload = {
      medicine_name: name,
      dosage,
      reminder_time: toApiTime(form.reminder_time),
      consumption_time: form.consumption_time,
      is_active: form.is_active,
      is_daily: form.is_daily || days.length === 7,
      reminder_days: days,
    }

    setSaving(true)
    setError("")
    try {
      if (editingId) {
        await updateReminder(editingId, payload, auth)
      } else {
        await createReminder(payload, auth)
      }
      setFormOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.message || "Failed to save reminder")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return
    setDeletingId(id)
    try {
      await deleteReminder(id, auth)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.message || "Failed to delete reminder")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DrugShell
      title="Medicine Reminders"
      backTo="/app/drug-directory"
      rightAction={
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg p-1.5 text-white hover:bg-white/10"
          aria-label="Add reminder"
        >
          <Plus size={18} />
        </button>
      }
    >
      <p className="mb-4 text-sm text-[#6B7280]">
        Set dosage reminders — synced with your SETU account, same as the app.
      </p>

      {error && !formOpen ? (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1C39BB]" size={28} />
        </div>
      ) : null}

      {!loading ? (
        <div className="space-y-3">
          {reminders.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1C1C1C]">
                    {item.medicine_name || "Medicine"}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {toDisplayTime(item.reminder_time)} · Dosage {item.dosage || 1}
                  </p>
                  <p className="mt-1 text-xs text-[#1C39BB]">
                    {CONSUMPTION_OPTIONS.find(
                      (o) => o.value === item.consumption_time,
                    )?.label || item.consumption_time}{" "}
                    · {dayLabel(item.reminder_days)}
                    {item.is_active === false ? " · Paused" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-lg p-2 text-[#6B7280] hover:bg-[#EEF2FF] hover:text-[#1C39BB]"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-[#6B7280] hover:bg-red-50 hover:text-red-600"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reminders.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6B7280]">
              No reminders yet. Tap + to add your first.
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={openCreate}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1C39BB] px-5 py-3 text-sm font-semibold text-white"
      >
        <Plus size={16} />
        Add reminder
      </button>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-[#1C1C1C]">
              {editingId ? "Edit reminder" : "New reminder"}
            </h3>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium">Medicine name</span>
              <input
                value={form.medicine_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, medicine_name: e.target.value }))
                }
                className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#1C39BB]"
                placeholder="e.g. Metformin"
              />
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Dosage</span>
                <input
                  type="number"
                  min={1}
                  value={form.dosage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dosage: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#1C39BB]"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Time</span>
                <input
                  type="time"
                  value={form.reminder_time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reminder_time: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#1C39BB]"
                />
              </label>
            </div>

            <fieldset className="mt-3">
              <legend className="mb-2 text-sm font-medium">
                Consumption time
              </legend>
              <div className="flex flex-wrap gap-2">
                {CONSUMPTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, consumption_time: opt.value }))
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      form.consumption_time === opt.value
                        ? "bg-[#1C39BB] text-white"
                        : "border border-[#E5E7EB] bg-white text-[#1C1C1C]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_daily}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    is_daily: e.target.checked,
                    reminder_days: e.target.checked ? [] : f.reminder_days,
                  }))
                }
              />
              Daily reminder
            </label>

            {!form.is_daily ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {REMINDER_DAY_OPTIONS.map((d) => {
                  const on = form.reminder_days.includes(d.value)
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        on
                          ? "bg-[#1C39BB] text-white"
                          : "border border-[#E5E7EB] bg-white text-[#1C1C1C]"
                      }`}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  setEditingId(null)
                }}
                className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1C39BB] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : null}
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </DrugShell>
  )
}
