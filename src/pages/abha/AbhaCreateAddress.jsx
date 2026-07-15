import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  ABHA_SUFFIX,
  getAbhaAddressSuggestions,
  createAbhaAddress,
  extractTokens,
  saveAbhaSession,
  getAbhaUserProfile,
  getPhrAppLoginProfile,
  buildProfileFromResponses,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaCreateAddress() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}

  const [handle, setHandle] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!state.txnId) {
      navigate("/app/abha/create/aadhaar", { replace: true })
    }
  }, [state.txnId, navigate])

  const validation = useMemo(() => {
    const minChars = handle.length >= 8
    const maxChars = handle.length <= 18 && handle.length > 0
    const noStartSpecial = !/^[._]/.test(handle)
    const noEndSpecial = !/[._]$/.test(handle)
    const onlyOneSpecial = (handle.match(/[._]/g) || []).length <= 1
    return {
      minChars,
      maxChars,
      noStartSpecial,
      noEndSpecial,
      onlyOneSpecial,
      allValid:
        minChars && maxChars && noStartSpecial && noEndSpecial && onlyOneSpecial,
    }
  }, [handle])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (handle.length < 3 || !state.txnId) {
        setSuggestions([])
        return
      }
      try {
        const response = await getAbhaAddressSuggestions(state.txnId)
        if (cancelled) return
        const list =
          response?.abhaAddressList ||
          response?.data?.abhaAddressList ||
          []
        setSuggestions(
          list.map((address) =>
            typeof address === "string" ? { address } : address,
          ),
        )
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }
    const t = setTimeout(run, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [handle, state.txnId])

  const addressToCreate =
    selected ||
    (validation.allValid ? `${handle.toLowerCase()}${ABHA_SUFFIX}` : "")

  const handleCreate = async () => {
    if (!addressToCreate || !state.txnId) return
    setLoading(true)
    setError("")
    try {
      const response = await createAbhaAddress({
        txnId: state.txnId,
        abhaAddress: addressToCreate,
      })
      const data = response?.data || response || {}
      const { xToken, xAuthToken } = extractTokens({
        ...data,
        tokens: data.tokens,
        token: data.token || state.token,
      })

      let profile = {
        abhaAddress: addressToCreate,
        abhaNumber: data.abhaNumber || "",
        fullName: data.fullName || data.name || "",
      }

      if (xToken) {
        const [abhaProfile, phrProfile] = await Promise.all([
          getAbhaUserProfile(xToken),
          getPhrAppLoginProfile(xToken),
        ])
        profile = await buildProfileFromResponses(abhaProfile, phrProfile, profile)
        saveAbhaSession({ xToken, xAuthToken, profile })
      }

      navigate("/app/abha/profile", {
        replace: true,
        state: { justCreated: true },
      })
    } catch (err) {
      setError(err.message || "Failed to create ABHA address")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AbhaShell title="Create ABHA address" backTo="/app/abha/create/aadhaar">
      <div className="space-y-4 rounded-2xl border border-[#E2E5F0] bg-white p-5 shadow-sm">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#1A1F3C]">
            Choose ABHA address
          </span>
          <div className="flex items-center gap-2">
            <input
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
                setSelected("")
              }}
              className="w-full rounded-xl border border-[#E2E5F0] px-3.5 py-3 outline-none focus:border-[#2F387E]"
              placeholder="yourname"
              autoCapitalize="none"
            />
            <span className="shrink-0 text-sm font-medium text-[#6B7289]">
              {ABHA_SUFFIX}
            </span>
          </div>
        </label>

        <ul className="space-y-1 text-xs text-[#6B7289]">
          <Rule ok={validation.minChars}>Minimum 8 characters</Rule>
          <Rule ok={validation.maxChars || handle.length === 0}>
            Maximum 18 characters
          </Rule>
          <Rule ok={validation.noStartSpecial}>Must not start with . or _</Rule>
          <Rule ok={validation.noEndSpecial}>Must not end with . or _</Rule>
          <Rule ok={validation.onlyOneSpecial}>Only one . or _ allowed</Rule>
        </ul>

        {suggestions.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-[#1A1F3C]">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => {
                const addr = s.address || s
                return (
                  <button
                    key={addr}
                    type="button"
                    onClick={() => {
                      setSelected(addr)
                      setHandle(String(addr).split("@")[0] || "")
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      selected === addr
                        ? "border-[#2F387E] bg-[#EEF0FF] text-[#2F387E]"
                        : "border-[#E2E5F0] text-[#4B5168]"
                    }`}
                  >
                    {addr}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!addressToCreate || loading}
          onClick={handleCreate}
          className="w-full rounded-xl bg-[#2F387E] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : `Create ${addressToCreate || "ABHA address"}`}
        </button>
      </div>
    </AbhaShell>
  )
}

function Rule({ ok, children }) {
  return (
    <li className={ok ? "text-emerald-700" : "text-[#9CA3AF]"}>
      {ok ? "✓" : "○"} {children}
    </li>
  )
}
