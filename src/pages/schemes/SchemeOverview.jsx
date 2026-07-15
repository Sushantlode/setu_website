import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Loader2, Send } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { fetchSchemeBySlug, submitSchemeInterest } from "../../api/schemes"
import { SchemesShell } from "./SchemesShell"

function Section({ title, items }) {
  if (!items?.length) return null
  return (
    <section className="mb-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-[#1e3a8a]">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={`${title}-${i}`} className="flex gap-2 text-sm leading-relaxed text-[#334155]">
            <span className="mt-0.5 text-[#2563eb]">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function SchemeOverview() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const decoded = decodeURIComponent(slug || "")
  const summary = location.state?.summary

  const [scheme, setScheme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [phone, setPhone] = useState(() => session?.mobile || "")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("Need help")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitOk, setSubmitOk] = useState(false)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        setLoading(true)
        setError("")
        const data = await fetchSchemeBySlug(decoded, {
          token: session?.token,
          refreshToken: session?.refreshToken,
        })
        if (!cancel) setScheme(data)
      } catch (err) {
        if (!cancel) {
          if (summary?.title) {
            setScheme({
              slug: decoded,
              title: summary.title,
              description: summary.description || "",
              details: [],
              benefits: [],
              eligibility: [],
              application_process: [],
              documentsRequired: [],
              state: summary.state_code || summary.state || "—",
              sector: summary.sector || "General",
            })
            setError("")
          } else {
            setError(err.message || "Failed to load scheme")
          }
        }
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [decoded, session?.token, session?.refreshToken, summary])

  const handleInquiry = async (e) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitOk(false)
    const digits = String(phone || "").replace(/\D/g, "").slice(-10)
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setSubmitError("Please enter a valid 10-digit mobile number.")
      return
    }
    if (!message.trim()) {
      setSubmitError("Please enter a message.")
      return
    }
    setSubmitting(true)
    try {
      await submitSchemeInterest(
        {
          scheme_slug: scheme?.slug || decoded,
          scheme_name: scheme?.title || summary?.title || "",
          scheme_external_id: String(scheme?.external_id || ""),
          message: message.trim(),
          contact_phone: digits,
          contact_email: email.trim(),
        },
        { token: session?.token, refreshToken: session?.refreshToken },
      )
      setSubmitOk(true)
      setTimeout(() => setInquiryOpen(false), 1200)
    } catch (err) {
      setSubmitError(err.message || "Failed to submit inquiry.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    const from = location.state?.from
    if (from === "home-search") {
      navigate("/app/govt-schemes", {
        state: {
          showSearch: true,
          searchQuery: location.state?.resumeSearch?.query || "",
        },
      })
      return
    }
    if (from === "find-results") {
      navigate("/app/govt-schemes/find/results", {
        state: {
          searchParams: location.state?.searchParams,
          from: location.state?.resultsFrom || "wizard",
        },
      })
      return
    }
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate("/app/govt-schemes")
  }

  return (
    <SchemesShell title="Scheme details" onBack={handleBack}>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[#1F4B99]" size={28} />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {scheme && !loading ? (
        <>
          <h2 className="mb-2 text-xl font-extrabold text-[#1e293b] sm:text-2xl">
            {scheme.title}
          </h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-xs text-[#475569]">
              {scheme.sector}
            </span>
            <span className="rounded-full bg-[#e2e8f0] px-3 py-1 text-xs text-[#475569]">
              {scheme.state}
            </span>
          </div>

          {scheme.description ? (
            <p className="mb-4 text-sm leading-relaxed text-[#334155]">{scheme.description}</p>
          ) : null}

          <Section title="Details" items={scheme.details} />
          <Section title="Benefits" items={scheme.benefits} />
          <Section title="Eligibility" items={scheme.eligibility} />
          <Section title="Application process" items={scheme.application_process} />
          <Section title="Documents required" items={scheme.documentsRequired} />

          <button
            type="button"
            onClick={() => {
              setInquiryOpen(true)
              setSubmitOk(false)
              setSubmitError("")
            }}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 py-3 text-sm font-bold text-white sm:w-auto"
          >
            <Send size={16} />
            Send Inquiry
          </button>
        </>
      ) : null}

      {inquiryOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-[#1C1C1C]">Scheme Inquiry</h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Need more details about this scheme? Send an inquiry and we will get back to you.
            </p>
            <form onSubmit={handleInquiry} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Mobile</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#2563eb]"
                  placeholder="10 digit number"
                  inputMode="numeric"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Email (optional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#2563eb]"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#2563eb]"
                  placeholder="Enter your message"
                />
              </label>
              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
              {submitOk ? (
                <p className="text-sm text-green-700">Inquiry submitted successfully.</p>
              ) : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setInquiryOpen(false)}
                  className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563eb] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </SchemesShell>
  )
}
