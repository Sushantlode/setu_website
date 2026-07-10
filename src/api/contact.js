const API_BASE = import.meta.env.VITE_CONTACT_API_URL || ""

export async function submitContactForm({ name, email, subject, message }) {
  const response = await fetch(`${API_BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, subject, message }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || "Failed to send message.")
  }

  return data
}
