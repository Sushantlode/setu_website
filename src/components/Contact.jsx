import { useState } from "react"
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react"
import { contactInfo } from "../data/content"
import { submitContactForm } from "../api/contact"
import FadeIn from "./FadeIn"

export default function Contact() {
  const [status, setStatus] = useState("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus("sending")
    setErrorMessage("")

    const formData = new FormData(e.currentTarget)

    try {
      await submitContactForm({
        name: formData.get("name"),
        email: formData.get("email"),
        subject: formData.get("subject"),
        message: formData.get("message"),
      })
      setStatus("success")
      e.target.reset()
    } catch (err) {
      setStatus("error")
      setErrorMessage(err.message || "Failed to send message. Please try again.")
    }
  }

  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-setu-muted">
            Contact
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal text-setu-charcoal sm:text-4xl lg:text-5xl">
            Get in Touch.
          </h2>
          <p className="mt-4 text-lg text-setu-muted">
            Have a question, collaboration idea, or want to explore how SETU can
            support your healthcare goals? We&apos;d love to hear from you.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-12 lg:grid-cols-5">
          <FadeIn className="space-y-4 lg:col-span-2">
            {[
              { icon: Mail, label: "Email us", value: contactInfo.email, href: `mailto:${contactInfo.email}` },
              { icon: Phone, label: "Call us", value: contactInfo.phone, href: `tel:${contactInfo.phone.replace(/\s/g, "")}` },
            ].map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                className="group flex items-start gap-4 rounded-2xl border border-setu-stone/20 bg-white p-5 transition-all duration-300 hover:border-setu-stone/40 hover:shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-setu-sand text-setu-teal-dark transition-colors group-hover:bg-setu-teal-dark group-hover:text-setu-cream">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-sm font-medium text-setu-muted">{label}</p>
                  <p className="mt-1 font-semibold text-setu-charcoal">{value}</p>
                </div>
              </a>
            ))}

            <div className="flex items-start gap-4 rounded-2xl border border-setu-stone/20 bg-white p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-setu-sand text-setu-teal-dark">
                <MapPin size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-setu-muted">Visit us</p>
                <p className="mt-1 font-semibold leading-relaxed text-setu-charcoal">
                  {contactInfo.address}
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15} className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-setu-teal-deep p-8 sm:p-10"
            >
              {status === "success" ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <p className="font-serif text-2xl text-setu-cream">
                    Thank you for reaching out!
                  </p>
                  <p className="mt-2 text-setu-stone/70">
                    Your inquiry has been sent to our team. We&apos;ll get back to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="nav-link mt-6 text-setu-cream"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {["name", "email"].map((field) => (
                      <div key={field}>
                        <label htmlFor={field} className="mb-1.5 block text-sm font-medium text-setu-stone/80">
                          {field === "name" ? "Full Name" : "Email Address"}
                        </label>
                        <input
                          id={field}
                          name={field}
                          type={field === "email" ? "email" : "text"}
                          required
                          disabled={status === "sending"}
                          className="w-full rounded-xl border border-setu-stone/15 bg-setu-teal-dark/50 px-4 py-3 text-sm text-setu-cream outline-none transition-colors placeholder:text-setu-stone/40 focus:border-setu-coral/50 disabled:opacity-60"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-setu-stone/80">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      disabled={status === "sending"}
                      className="w-full rounded-xl border border-setu-stone/15 bg-setu-teal-dark/50 px-4 py-3 text-sm text-setu-cream outline-none transition-colors placeholder:text-setu-stone/40 focus:border-setu-coral/50 disabled:opacity-60"
                    />
                  </div>
                  <div className="mt-5">
                    <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-setu-stone/80">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      disabled={status === "sending"}
                      className="w-full resize-none rounded-xl border border-setu-stone/15 bg-setu-teal-dark/50 px-4 py-3 text-sm text-setu-cream outline-none transition-colors placeholder:text-setu-stone/40 focus:border-setu-coral/50 disabled:opacity-60"
                    />
                  </div>

                  {status === "error" && (
                    <p className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="btn-primary btn-primary-white mt-6 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "sending" ? (
                      <>
                        Sending...
                        <Loader2 size={16} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
