import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, Trash2, Upload } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useGenericMedicine } from "../../context/GenericMedicineContext"
import { useToast } from "../../components/ui/Toast"
import {
  FormErrorBanner,
  FormTextField,
  FormSelectField,
  FormSuccessBanner,
  FormTextAreaField,
} from "../../components/ui/FormField"
import {
  fetchPrescriptions,
  removePrescription,
  submitPlainPrescription,
  uploadPrescription,
} from "../../api/generic"
import GenericShell, { GenericPrimaryButton } from "../../components/generic/GenericShell"
import {
  LAST_DOCTOR_VISIT_OPTIONS,
  MEDICINE_CONSUME_OPTIONS,
  PRE_FOR_OPTIONS,
} from "../../utils/generic"
import { numberRange, required, validateForm } from "../../utils/validation"

const RX_SCHEMA = {
  patient_name: [required("Patient name is required")],
  patient_age: [required("Age is required"), numberRange(1, 120, "Enter a valid age")],
  dosage: [required("Dosage is required")],
}

export default function GenericPrescription() {
  const { session } = useAuth()
  const toast = useToast()
  const { orderId, refreshCart } = useGenericMedicine()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    pre_for_id: "1",
    patient_name: session?.first_name || "",
    patient_age: "",
    dosage: "",
    allergies: "",
    last_doctor_visit_id: "1",
    medicine_consume_id: "1",
    order_note: "",
  })

  const reload = async () => {
    setLoading(true)
    try {
      const rows = await fetchPrescriptions(session)
      setList(Array.isArray(rows) ? rows : [])
    } catch (err) {
      setError(err.message || "Could not load prescriptions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    setSuccess("")
    setUploading(true)
    try {
      await uploadPrescription(session, {
        file,
        orderId: orderId || undefined,
        cart: Boolean(orderId),
      })
      setSuccess("Prescription uploaded")
      toast.success("Prescription uploaded")
      await reload()
      await refreshCart()
    } catch (err) {
      const msg = err.message || "Upload failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const onRemove = async (docId) => {
    try {
      await removePrescription(session, docId)
      await reload()
      toast.info("Prescription removed")
    } catch (err) {
      toast.error(err.message || "Could not remove")
    }
  }

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((e) => ({ ...e, [key]: "" }))
  }

  const onSubmitDetails = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const { ok, errors } = validateForm(form, RX_SCHEMA)
    setFieldErrors(errors)
    if (!ok) {
      toast.error("Please complete prescription details")
      return
    }
    setSubmitting(true)
    try {
      await submitPlainPrescription(session, {
        ...form,
        order_id: orderId || undefined,
      })
      setSuccess("Prescription details submitted")
      toast.success("Prescription details submitted")
      await refreshCart()
    } catch (err) {
      const msg = err.message || "Could not submit details"
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GenericShell title="Prescription">
      <div className="space-y-5">
        <FormErrorBanner>{error}</FormErrorBanner>
        <FormSuccessBanner>{success}</FormSuccessBanner>

        <div className="rounded-2xl border border-teal-100 bg-white p-5">
          <h2 className="font-semibold">Upload Rx image / PDF</h2>
          <p className="mt-1 text-sm text-setu-muted">
            Attach a clear photo of your doctor’s prescription.
            {orderId ? ` Linked to cart order #${orderId}.` : ""}
          </p>
          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-teal-300 bg-teal-50/50 px-4 py-8 text-center">
            <Upload className="text-teal-700" size={28} />
            <span className="mt-2 text-sm font-semibold text-teal-900">
              {uploading ? "Uploading…" : "Choose file"}
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={onFile}
            />
          </label>
        </div>

        <div className="rounded-2xl border border-teal-100 bg-white p-5">
          <h2 className="mb-3 font-semibold">Uploaded prescriptions</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-teal-700" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-sm text-setu-muted">No prescriptions uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((doc) => {
                const id = doc.doc_id || doc.id || doc.prescription_id
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-teal-50 px-3 py-3 text-sm"
                  >
                    <span className="line-clamp-1">
                      {doc.file_name || doc.doc_name || doc.name || `Rx #${id}`}
                    </span>
                    <button
                      type="button"
                      className="rounded-full p-2 text-red-600 hover:bg-red-50"
                      onClick={() => onRemove(id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <form
          onSubmit={onSubmitDetails}
          className="space-y-3 rounded-2xl border border-teal-100 bg-white p-5"
          noValidate
        >
          <h2 className="font-semibold">Or submit prescription details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormSelectField
              label="For"
              value={form.pre_for_id}
              onChange={(e) => setField("pre_for_id", e.target.value)}
            >
              {PRE_FOR_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </FormSelectField>
            <FormTextField
              label="Patient name"
              required
              error={fieldErrors.patient_name}
              value={form.patient_name}
              onChange={(e) => setField("patient_name", e.target.value)}
            />
            <FormTextField
              label="Age"
              required
              type="number"
              error={fieldErrors.patient_age}
              value={form.patient_age}
              onChange={(e) => setField("patient_age", e.target.value)}
            />
            <FormTextField
              label="Dosage"
              required
              error={fieldErrors.dosage}
              value={form.dosage}
              onChange={(e) => setField("dosage", e.target.value)}
            />
            <FormTextField
              label="Allergies"
              className="sm:col-span-2"
              value={form.allergies}
              onChange={(e) => setField("allergies", e.target.value)}
            />
            <FormSelectField
              label="Last doctor visit"
              value={form.last_doctor_visit_id}
              onChange={(e) => setField("last_doctor_visit_id", e.target.value)}
            >
              {LAST_DOCTOR_VISIT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </FormSelectField>
            <FormSelectField
              label="Medicine consume"
              value={form.medicine_consume_id}
              onChange={(e) => setField("medicine_consume_id", e.target.value)}
            >
              {MEDICINE_CONSUME_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </FormSelectField>
            <FormTextAreaField
              label="Note"
              className="sm:col-span-2"
              value={form.order_note}
              onChange={(e) => setField("order_note", e.target.value)}
            />
          </div>
          <GenericPrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit details"}
          </GenericPrimaryButton>
        </form>

        <Link
          to="/app/generic-medicine/cart"
          className="inline-flex w-full items-center justify-center rounded-2xl border border-teal-200 py-3 text-sm font-semibold text-teal-800"
        >
          Continue to cart
        </Link>
      </div>
    </GenericShell>
  )
}
