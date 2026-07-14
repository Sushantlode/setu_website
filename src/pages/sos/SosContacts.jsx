import { useCallback, useEffect, useState } from "react"
import { Phone, Pencil, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../components/ui/Toast"
import {
  createEmergencyContact,
  deleteEmergencyContact,
  fetchEmergencyContacts,
  updateEmergencyContact,
} from "../../api/sos"
import { SosShell } from "./SosShell"

const MAX_CONTACTS = 5

const EMPTY_FORM = { name: "", phone: "", relation: "" }

export default function SosContacts() {
  const { session } = useAuth()
  const toast = useToast()
  const auth = {
    token: session?.token,
    refreshToken: session?.refreshToken,
  }

  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const loadContacts = useCallback(async () => {
    if (!session?.user_id) return
    setLoading(true)
    try {
      const list = await fetchEmergencyContacts(session.user_id, auth)
      setContacts(list)
    } catch (err) {
      toast.error(err?.message || "Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }, [session?.user_id, session?.token, session?.refreshToken, toast])

  useEffect(() => {
    loadContacts()
  }, [loadContacts])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (contact) => {
    setEditingId(contact.id)
    setForm({
      name: contact.name || "",
      phone: contact.contactNumber || contact.contact_number || "",
      relation: contact.relation || "",
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const phone = form.phone.trim()
    const relation = form.relation.trim()

    if (!name || !phone || !relation) {
      toast.error("Please fill name, phone, and relation.")
      return
    }

    if (!session?.user_id) {
      toast.error("Sign in again to manage contacts.")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateEmergencyContact(
          editingId,
          {
            name,
            contactNumber: phone,
            relation,
            userid: Number(session.user_id),
          },
          auth,
        )
        toast.success("Contact updated")
      } else {
        if (contacts.length >= MAX_CONTACTS) {
          toast.error(`You can add up to ${MAX_CONTACTS} contacts.`)
          return
        }
        await createEmergencyContact(
          {
            userid: Number(session.user_id),
            name,
            contactNumber: phone,
            relation,
          },
          auth,
        )
        toast.success("Contact added")
      }
      resetForm()
      await loadContacts()
    } catch (err) {
      toast.error(err?.message || "Failed to save contact")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    try {
      await deleteEmergencyContact(deleteId, auth)
      toast.success("Contact deleted")
      setDeleteId(null)
      await loadContacts()
    } catch (err) {
      toast.error(err?.message || "Failed to delete contact")
    } finally {
      setSaving(false)
    }
  }

  return (
    <SosShell title="Emergency Contacts" backTo="/app/sos">
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#E9EBEF]" />
          ))}
        </div>
      ) : (
        <>
          {contacts.length === 0 && !showForm ? (
            <p className="mb-4 rounded-xl border border-dashed border-[#E9EBEF] bg-[#F7F7F9] px-4 py-6 text-center text-sm text-[#6B7280]">
              No emergency contacts yet. Add someone who should be notified when you use SOS.
            </p>
          ) : (
            <ul className="mb-4 space-y-3">
              {contacts.map((contact) => (
                <li
                  key={contact.id}
                  className="rounded-xl border border-[#E9EBEF] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1C1C1C]">{contact.name}</p>
                      <p className="text-xs text-[#6B7280]">{contact.relation}</p>
                      <a
                        href={`tel:${contact.contactNumber || contact.contact_number}`}
                        className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#1C39BB]"
                      >
                        <Phone size={14} />
                        {contact.contactNumber || contact.contact_number}
                      </a>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(contact)}
                        className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F7F7F9]"
                        aria-label="Edit contact"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(contact.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        aria-label="Delete contact"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!showForm && contacts.length < MAX_CONTACTS ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full rounded-xl border border-[#1C39BB] px-4 py-3 text-sm font-semibold text-[#1C39BB] hover:bg-[#EEF4FF]"
            >
              Add contact
            </button>
          ) : null}

          {showForm ? (
            <form
              onSubmit={handleSubmit}
              className="mt-4 rounded-xl border border-[#E9EBEF] bg-[#F7F7F9] p-4"
            >
              <p className="mb-3 text-sm font-semibold text-[#1C1C1C]">
                {editingId ? "Edit contact" : "New contact"}
              </p>
              <label className="block text-sm text-[#1C1C1C]">
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[#E9EBEF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1C39BB]"
                />
              </label>
              <label className="mt-3 block text-sm text-[#1C1C1C]">
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  inputMode="tel"
                  className="mt-1 w-full rounded-xl border border-[#E9EBEF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1C39BB]"
                />
              </label>
              <label className="mt-3 block text-sm text-[#1C1C1C]">
                Relation
                <input
                  value={form.relation}
                  onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                  placeholder="e.g. Spouse, Parent"
                  className="mt-1 w-full rounded-xl border border-[#E9EBEF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1C39BB]"
                />
              </label>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#1C39BB] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-[#E9EBEF] px-4 py-2.5 text-sm font-medium text-[#1C1C1C]"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </>
      )}

      {deleteId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-lg font-semibold text-[#1C1C1C]">Delete contact?</p>
            <p className="mt-2 text-sm text-[#6B7280]">This cannot be undone.</p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl border border-[#E9EBEF] px-4 py-2.5 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SosShell>
  )
}
