import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../components/ui/Toast"
import {
  FormErrorBanner,
  FormTextField,
  FormSuccessBanner,
  FormTextAreaField,
} from "../../components/ui/FormField"
import {
  fetchMyMedicineRequests,
  submitMedicineRequest,
} from "../../api/generic"
import GenericShell, { GenericPrimaryButton } from "../../components/generic/GenericShell"
import { ACCENT } from "../../utils/generic"
import {
  digitsOnly,
  email,
  mobile10,
  required,
  validateForm,
} from "../../utils/validation"

const SCHEMA = {
  medicine_name: [required("Please enter medicine name.")],
  requestor_name: [required("Please enter your name.")],
  mobile_number: [mobile10()],
  email: [email()],
  description: [required("Please add a short description.")],
}

export default function GenericRequests() {
  const location = useLocation()
  const { session } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({
    medicine_name: location.state?.medicineName || "",
    requestor_name: session?.first_name || "",
    mobile_number: session?.mobile || "",
    email: "",
    description: "",
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [mine, setMine] = useState([])
  const [loadingMine, setLoadingMine] = useState(true)

  const loadMine = async () => {
    setLoadingMine(true)
    try {
      const rows = await fetchMyMedicineRequests(session)
      setMine(Array.isArray(rows) ? rows : [])
    } catch {
      setMine([])
    } finally {
      setLoadingMine(false)
    }
  }

  useEffect(() => {
    loadMine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((err) => ({ ...err, [key]: "", submit: "" }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSuccess("")
    const values = {
      ...form,
      mobile_number: digitsOnly(form.mobile_number, 10),
    }
    const { ok, errors } = validateForm(values, SCHEMA)
    setFieldErrors(errors)
    if (!ok) {
      toast.error("Please fix the highlighted fields")
      return
    }

    setSubmitting(true)
    try {
      await submitMedicineRequest(session, {
        medicine_name: values.medicine_name.trim(),
        requestor_name: values.requestor_name.trim(),
        mobile_number: values.mobile_number,
        email: values.email.trim(),
        description: values.description.trim(),
      })
      setSuccess("Inquiry submitted. We will get back to you.")
      toast.success("Inquiry submitted")
      setForm((f) => ({
        ...f,
        medicine_name: "",
        description: "",
      }))
      await loadMine()
    } catch (err) {
      const msg = err.message || "Failed to submit request."
      setFieldErrors({ submit: msg })
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GenericShell title="Medicine inquiry">
      <div className="space-y-5">
        <p className="text-sm text-setu-muted">
          Can&apos;t find your medicine? Send an inquiry and we will get back to you.
        </p>

        <FormSuccessBanner>{success}</FormSuccessBanner>
        <FormErrorBanner>{fieldErrors.submit}</FormErrorBanner>

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-teal-100 bg-white p-5"
          noValidate
        >
          <FormTextField
            label="Medicine name"
            required
            error={fieldErrors.medicine_name}
            value={form.medicine_name}
            onChange={(e) => setField("medicine_name", e.target.value)}
          />
          <FormTextField
            label="Your name"
            required
            error={fieldErrors.requestor_name}
            value={form.requestor_name}
            onChange={(e) => setField("requestor_name", e.target.value)}
          />
          <FormTextField
            label="Mobile number"
            required
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter 10 digit number"
            error={fieldErrors.mobile_number}
            value={form.mobile_number}
            onChange={(e) => setField("mobile_number", digitsOnly(e.target.value, 10))}
          />
          <FormTextField
            label="Email (optional)"
            type="email"
            error={fieldErrors.email}
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
          />
          <FormTextAreaField
            label="Description"
            required
            rows={4}
            error={fieldErrors.description}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
          <GenericPrimaryButton type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit inquiry"}
          </GenericPrimaryButton>
        </form>

        <section>
          <h2 className="mb-3 font-display text-xl">My inquiries</h2>
          {loadingMine ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-teal-700" />
            </div>
          ) : mine.length === 0 ? (
            <p className="text-sm text-setu-muted">No inquiries yet.</p>
          ) : (
            <ul className="space-y-2">
              {mine.map((row, idx) => (
                <li
                  key={row.id || row.request_id || idx}
                  className="rounded-2xl border border-teal-100 bg-white p-4 text-sm"
                >
                  <p className="font-semibold">{row.medicine_name || row.MedicineName}</p>
                  <p className="mt-1 text-setu-muted">
                    {row.description || row.Description || ""}
                  </p>
                  <p className="mt-2 text-xs font-medium" style={{ color: ACCENT }}>
                    {row.status || row.Status || "Submitted"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </GenericShell>
  )
}
