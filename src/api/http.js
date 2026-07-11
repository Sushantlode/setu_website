/**
 * Shared fetch helpers with SETU auth headers (mirrors RN axios utils).
 */

export function authHeaders(token, refreshToken, extra = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (refreshToken) {
    headers["x-refresh-token"] = refreshToken
    headers["X-REFRESH-TOKEN"] = refreshToken
  }
  return headers
}

/**
 * fetch() with Bearer + refresh token headers.
 * @returns {{ response: Response, data: any }}
 */
export async function authFetch(url, { token, refreshToken, headers, ...init } = {}) {
  const response = await fetch(url, {
    ...init,
    headers: authHeaders(token, refreshToken, headers),
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}
