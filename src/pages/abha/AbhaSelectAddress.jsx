import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  verifyLoginUser,
  getAbhaUserProfile,
  getPhrAppLoginProfile,
  buildProfileFromResponses,
  extractTokens,
  saveAbhaSession,
} from "../../api/abha"
import { AbhaShell } from "./AbhaShell"

export default function AbhaSelectAddress() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const users = Array.isArray(state.users) ? state.users : []

  const [selected, setSelected] = useState(users[0]?.abhaAddress || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!state.txnId || !users.length) {
      navigate("/app/abha/login", { replace: true })
    }
  }, [state.txnId, users.length, navigate])

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    setError("")
    try {
      const response = await verifyLoginUser(
        state.txnId,
        selected,
        state.tToken,
        state.loginType,
      )
      if (!response.success) {
        setError(response.error || "Failed to select ABHA address")
        return
      }

      const payload = response.data || {}
      const { xToken, xAuthToken } = extractTokens({
        ...payload,
        tokens: payload.tokens || state.tokens,
      })
      const token = xToken || extractTokens({ tokens: state.tokens }).xToken
      if (!token) {
        setError("Authentication token not found")
        return
      }

      const [abhaProfile, phrProfile] = await Promise.all([
        getAbhaUserProfile(token),
        getPhrAppLoginProfile(token),
      ])
      const profile = await buildProfileFromResponses(abhaProfile, phrProfile, {
        abhaAddress: selected,
      })
      saveAbhaSession({
        xToken: token,
        xAuthToken,
        profile,
        loginType: state.loginType,
      })
      navigate("/app/abha/profile", { replace: true })
    } catch (err) {
      setError(err.message || "Failed to select address")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AbhaShell title="Select ABHA address" backTo="/app/abha/login">
      <div className="space-y-3">
        {users.map((u) => {
          const addr = u.abhaAddress || u.phrAddress || ""
          return (
            <button
              key={addr}
              type="button"
              onClick={() => setSelected(addr)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selected === addr
                  ? "border-[#2F387E] bg-[#EEF0FF]"
                  : "border-[#E2E5F0] bg-white"
              }`}
            >
              <p className="font-semibold text-[#1A1F3C]">
                {u.fullName || u.name || addr}
              </p>
              <p className="mt-1 text-sm text-[#6B7289]">{addr}</p>
              {u.abhaNumber ? (
                <p className="mt-0.5 text-xs text-[#9CA3AF]">{u.abhaNumber}</p>
              ) : null}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!selected || loading}
        onClick={handleContinue}
        className="mt-5 w-full rounded-xl bg-[#2F387E] py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Continuing…" : "Continue"}
      </button>
    </AbhaShell>
  )
}
