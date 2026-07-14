import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { checkUserExists, fetchUserProfile } from "../api/auth"

const STORAGE_KEY = "setu_auth_session"

const AuthContext = createContext(null)

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStoredSession(session) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function normalizeSession(payload) {
  return {
    token: payload.token || "",
    refreshToken: payload.refreshToken || "",
    user_id: payload.user_id ? String(payload.user_id) : "",
    uhid: payload.uhid ? String(payload.uhid) : "",
    username: payload.username ? String(payload.username) : "",
    first_name: payload.first_name || "",
    mobile: payload.mobile ? String(payload.mobile) : "",
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [loading, setLoading] = useState(true)
  const [bootChecked, setBootChecked] = useState(false)

  const logout = useCallback(() => {
    setSession(null)
    writeStoredSession(null)
  }, [])

  const login = useCallback((payload) => {
    const next = normalizeSession(payload)
    setSession(next)
    writeStoredSession(next)
  }, [])

  const updateProfile = useCallback((patch) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = normalizeSession({ ...prev, ...patch })
      writeStoredSession(next)
      return next
    })
  }, [])

  /** Splash-equivalent: validate token + user_id via getUsers on boot */
  useEffect(() => {
    let cancelled = false

    async function validate() {
      const stored = readStoredSession()
      if (!stored?.token || !stored?.user_id) {
        if (!cancelled) {
          setSession(null)
          setLoading(false)
          setBootChecked(true)
        }
        return
      }

      try {
        const check = await checkUserExists(
          stored.user_id,
          stored.token,
          stored.refreshToken,
        )

        if (cancelled) return

        if (!check.exists) {
          logout()
          setLoading(false)
          setBootChecked(true)
          return
        }

        try {
          const profile = await fetchUserProfile(
            stored.user_id,
            stored.token,
            stored.refreshToken,
          )
          if (!cancelled && profile) {
            const next = normalizeSession({
              ...stored,
              first_name: profile.first_name || stored.first_name,
              username: profile.username || stored.username,
              uhid: profile.uhid || stored.uhid,
              mobile: profile.mobile || stored.mobile,
            })
            setSession(next)
            writeStoredSession(next)
          }
        } catch (err) {
          if (err?.code === "USER_NOT_FOUND") {
            if (!cancelled) logout()
          } else if (!cancelled) {
            setSession(stored)
          }
        }
      } catch {
        if (!cancelled) setSession(stored)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setBootChecked(true)
        }
      }
    }

    validate()
    return () => {
      cancelled = true
    }
  }, [logout])

  const refreshSession = useCallback(async () => {
    if (!session?.token || !session?.user_id) return null
    const profile = await fetchUserProfile(
      session.user_id,
      session.token,
      session.refreshToken,
    )
    updateProfile({
      first_name: profile.first_name || session.first_name,
      username: profile.username || session.username,
      uhid: profile.uhid || session.uhid,
      mobile: profile.mobile || session.mobile,
    })
    return profile
  }, [session, updateProfile])

  useEffect(() => {
    function onTokens(event) {
      const detail = event?.detail
      if (!detail?.token) return
      setSession((prev) => {
        if (!prev) return prev
        const next = normalizeSession({
          ...prev,
          token: detail.token,
          refreshToken: detail.refreshToken || prev.refreshToken,
        })
        writeStoredSession(next)
        return next
      })
    }
    window.addEventListener("setu:tokens", onTokens)
    return () => window.removeEventListener("setu:tokens", onTokens)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token && session?.user_id),
      loading,
      bootChecked,
      login,
      logout,
      updateProfile,
      refreshSession,
    }),
    [session, loading, bootChecked, login, logout, updateProfile, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
