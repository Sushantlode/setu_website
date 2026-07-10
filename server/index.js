import "dotenv/config"
import express from "express"
import cors from "cors"
import { sendContactEmail } from "./mailer.js"
import {
  canSendToday,
  recordDailySend,
  dailyLimitMessage,
  DAILY_LIMIT,
} from "./dailyLimit.js"

const app = express()
const PORT = Number(process.env.CONTACT_API_PORT) || 3001

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error("Not allowed by CORS"))
    },
  }),
)

app.use(express.json({ limit: "32kb" }))

function validateContactBody(body) {
  const name = String(body?.name || "").trim()
  const email = String(body?.email || "").trim().toLowerCase()
  const subject = String(body?.subject || "").trim()
  const message = String(body?.message || "").trim()

  if (name.length < 2 || name.length > 120) {
    return { error: "Please enter a valid name." }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { error: "Please enter a valid email address." }
  }

  if (subject.length < 3 || subject.length > 200) {
    return { error: "Please enter a subject (at least 3 characters)." }
  }

  if (message.length < 10 || message.length > 5000) {
    return { error: "Please enter a message (at least 10 characters)." }
  }

  return { name, email, subject, message }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || "unknown"
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "setu-contact-api", dailyLimit: DAILY_LIMIT })
})

app.post("/api/contact", async (req, res) => {
  try {
    const parsed = validateContactBody(req.body)
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error })
    }

    const clientIp = getClientIp(req)

    if (!canSendToday("ip", clientIp)) {
      return res.status(429).json({ success: false, message: dailyLimitMessage() })
    }

    if (!canSendToday("email", parsed.email)) {
      return res.status(429).json({ success: false, message: dailyLimitMessage() })
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(503).json({
        success: false,
        message: "Email service is not configured. Please try again later.",
      })
    }

    await sendContactEmail(parsed)

    recordDailySend("ip", clientIp)
    recordDailySend("email", parsed.email)

    return res.json({
      success: true,
      message: "Your message has been sent successfully.",
    })
  } catch (err) {
    console.error("Contact form error:", err.message)
    return res.status(500).json({
      success: false,
      message: "Failed to send your message. Please try again later.",
    })
  }
})

app.listen(PORT, () => {
  console.log(`SETU contact API listening on http://localhost:${PORT}`)
})
