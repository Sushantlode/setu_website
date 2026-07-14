/** Shared input validators for forms across modules */

export function required(message = "This field is required") {
  return (value) => {
    const v = value == null ? "" : String(value).trim()
    return v ? null : message
  }
}

export function email(message = "Please enter a valid email address") {
  return (value) => {
    const v = String(value || "").trim()
    if (!v) return null
    return /^\S+@\S+\.\S+$/.test(v) ? null : message
  }
}

export function mobile10(message = "Please enter 10 digit number") {
  return (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(-10)
    if (!digits) return "Please enter mobile number"
    return digits.length === 10 ? null : message
  }
}

export function minLength(min, message) {
  return (value) => {
    const v = String(value || "").trim()
    if (!v) return null
    return v.length >= min
      ? null
      : message || `Must be at least ${min} characters`
  }
}

export function maxLength(max, message) {
  return (value) => {
    const v = String(value || "")
    return v.length <= max
      ? null
      : message || `Must be at most ${max} characters`
  }
}

export function numberRange(min, max, message) {
  return (value) => {
    if (value === "" || value == null) return null
    const n = Number(value)
    if (!Number.isFinite(n)) return message || "Enter a valid number"
    if (min != null && n < min) return message || `Must be at least ${min}`
    if (max != null && n > max) return message || `Must be at most ${max}`
    return null
  }
}

export function pincode(message = "Enter a valid 6-digit pincode") {
  return (value) => {
    const v = String(value || "").replace(/\D/g, "")
    if (!v) return "Please enter pincode"
    return /^\d{6}$/.test(v) ? null : message
  }
}

export function oneOf(ids, message = "Please select an option") {
  const set = new Set(ids.map(String))
  return (value) => (set.has(String(value)) ? null : message)
}

/** Run validators in order; return first error message or "". */
export function runValidators(value, validators = []) {
  for (const fn of validators) {
    if (typeof fn !== "function") continue
    const err = fn(value)
    if (err) return err
  }
  return ""
}

/**
 * Validate a values object against a schema of validators.
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateForm(values, schema) {
  const errors = {}
  for (const [key, validators] of Object.entries(schema || {})) {
    const err = runValidators(values?.[key], validators)
    if (err) errors[key] = err
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

/** Digits-only helper for controlled mobile inputs */
export function digitsOnly(value, max = 10) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, max)
}
