import { authUrl } from "../config/api"
import { authFetch } from "./http"

async function parseJson(response) {
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

function extractUserPayload(payload) {
  if (!payload || typeof payload !== "object") return null
  const nested =
    payload?.data?.response ||
    payload?.response ||
    payload?.data?.user ||
    payload?.user ||
    payload?.data
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    if (nested.first_name || nested.username || nested.uhid || nested.user_id || nested.mobile) {
      return nested
    }
  }
  if (payload.first_name || payload.username || payload.uhid || payload.user_id) {
    return payload
  }
  return nested && typeof nested === "object" ? nested : null
}

function isUserNotFound(payload, status) {
  if (status === 404) return true
  const msg = String(payload?.message || payload?.data?.message || "").toLowerCase()
  if (msg.includes("user not found") || msg.includes("not found")) return true
  if (payload?.hasError && msg.includes("user")) return true
  return false
}

export async function sendRegistrationOtp(mobile, receiveUpdates = false) {
  const { response, data } = await parseJson(
    await fetch(authUrl("/register/send-otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, receiveUpdates }),
    }),
  )

  if (response.ok && data.success) {
    return { kind: "register", mobile }
  }

  if (response.status === 409) {
    return sendLoginOtp(mobile)
  }

  throw new Error(data.message || "Failed to send OTP.")
}

export async function sendLoginOtp(mobile) {
  const { response, data } = await parseJson(
    await fetch(authUrl("/otp/send"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    }),
  )

  if (response.ok && data.success) {
    return { kind: "login", mobile }
  }

  const msg = String(data.message || "").toLowerCase()
  if (msg.includes("user not found")) {
    return { kind: "profile", mobile, mobileAlreadyVerified: true }
  }

  throw new Error(data.message || "Failed to send login OTP.")
}

export async function verifyRegistrationOtp(mobile, otp) {
  const { response, data } = await parseJson(
    await fetch(authUrl("/register/verify-otp"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    }),
  )

  if (response.ok) {
    return { kind: "profile", mobile }
  }

  throw new Error(data.message || "Invalid OTP.")
}

export async function loginWithOtp(mobile, otp) {
  const { response, data } = await parseJson(
    await fetch(authUrl("/loginWithSmartpingOtp"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    }),
  )

  const apiData = data?.data ?? data ?? {}
  const hasError =
    apiData?.hasError ?? data?.hasError ?? (data?.success === false ? true : undefined)

  if (response.ok && hasError === false) {
    return {
      token: apiData.token || "",
      refreshToken: apiData.refreshToken || "",
      user_id: apiData.user_id ? String(apiData.user_id) : "",
      uhid: apiData.uhid ? String(apiData.uhid) : "",
      username: apiData.username ? String(apiData.username) : "",
      first_name: apiData.first_name || "",
      mobile,
    }
  }

  throw new Error(apiData?.message || data?.message || "OTP verification failed.")
}

/** POST /auth/getUsers — same session check as RN splash / dashboard */
export async function checkUserExists(userId, token, refreshToken) {
  if (!userId) {
    return { exists: false, message: "User not found" }
  }

  try {
    const { response, data } = await authFetch(authUrl("/getUsers"), {
      method: "POST",
      token,
      refreshToken,
      body: JSON.stringify({ user_id: String(userId) }),
    })

    if (isUserNotFound(data, response.status)) {
      return { exists: false, message: data?.message || "User not found" }
    }

    if (!response.ok && response.status >= 500) {
      // Network/server blip — allow session like RN
      return { exists: true }
    }

    if (!response.ok) {
      return { exists: false, message: data?.message || "Session invalid" }
    }

    return { exists: true, profile: extractUserPayload(data) }
  } catch {
    return { exists: true }
  }
}

export async function fetchUserProfile(userId, token, refreshToken) {
  const { response, data } = await authFetch(authUrl("/getUsers"), {
    method: "POST",
    token,
    refreshToken,
    body: JSON.stringify({ user_id: String(userId) }),
  })

  if (isUserNotFound(data, response.status)) {
    const err = new Error(data?.message || "User not found")
    err.code = "USER_NOT_FOUND"
    throw err
  }

  if (!response.ok) {
    throw new Error(data?.message || "Could not load profile.")
  }

  const user = extractUserPayload(data)
  if (!user) {
    throw new Error("Could not load profile.")
  }

  return {
    first_name: user.first_name || "",
    username: user.username ? String(user.username) : "",
    uhid: user.uhid != null ? String(user.uhid) : "",
    user_id: user.user_id != null ? String(user.user_id) : String(userId),
    mobile: user.mobile ? String(user.mobile) : "",
    raw: user,
  }
}
