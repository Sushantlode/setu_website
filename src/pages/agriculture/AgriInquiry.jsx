import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { submitAgriInquiry } from "../../api/agri"
import { AgriShell } from "./AgriShell"

export default function AgriInquiry() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const auth = { token: session?.token, refreshToken: session?.refreshToken }

  const [name, setName] = useState(session?.first_name || "")
  const [phone, setPhone] = useState(session?.mobile || "")
  const [email, setEmail] = useState("")
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [ok, setOk] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    if (!auth.token) {
      navigate("/login", { state: { from: "/app/agriculture/inquiry" } })
      return
    }
    if (!name.trim() || !question.trim()) {
      setError("Name and question are required.")
      return
    }
    setLoading(true)
    setError("")
    setOk("")
    try {
      await submitAgriInquiry(
        {
          name: name.trim(),
          question: question.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        },
        auth,
      )
      setOk("Inquiry submitted. Our experts will get back to you.")
      setQuestion("")
    } catch (err) {
      setError(err.message || "Failed to submit inquiry")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AgriShell
      title="Ask an expert"
      backTo="/app/agriculture"
      rightAction={
        <Link
          to="/app/agriculture/inquiry/history"
          className="text-xs text-white/90 hover:text-white"
        >
          History
        </Link>
      }
    >
      <p className="mb-4 text-sm text-[#6E8371]">
        Get farming advice from SETU agri experts — same as the app.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Mobile</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Your question</span>
          <textarea
            rows={5}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Describe your crop issue or farming question..."
            className="w-full rounded-xl border border-[#D9E3D7] bg-white px-3 py-2.5 outline-none focus:border-[#1E6E33]"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="text-sm text-green-700">{ok}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#307E33] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Submit inquiry
        </button>
      </form>
    </AgriShell>
  )
}
