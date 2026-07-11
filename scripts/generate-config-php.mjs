#!/usr/bin/env node
/**
 * Generate public/api/config.php for GoDaddy from environment variables.
 * Used locally (with .env) and in CI/CD (GitHub Secrets).
 */
import "dotenv/config"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

function phpString(value) {
  return `'${String(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`
}

function phpBool(value) {
  return value === true || value === "true" ? "true" : "false"
}

function phpArray(items) {
  const lines = items.map((item) => `        ${phpString(item)},`)
  return `[\n${lines.join("\n")}\n    ]`
}

const smtpPass = process.env.SMTP_PASS
const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true"

if (!smtpPass) {
  const message =
    "SMTP_PASS is not set. Add it in GitHub: Settings → Secrets and variables → Actions → New repository secret → Name: SMTP_PASS"

  if (isCi) {
    console.error(`ERROR: ${message}`)
    process.exit(1)
  }

  console.log(`${message} (skipping config.php for local build).`)
  process.exit(0)
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "https://setuai.com,https://www.setuai.com")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)

const config = `<?php
/**
 * Auto-generated — do not commit. Created by scripts/generate-config-php.mjs
 */
return [
    "smtp_host" => ${phpString(process.env.SMTP_HOST || "setuai.com")},
    "smtp_port" => ${Number(process.env.SMTP_PORT) || 465},
    "smtp_secure" => ${phpBool(process.env.SMTP_SECURE ?? "true")},
    "smtp_user" => ${phpString(process.env.SMTP_USER || "no_reply@setuai.com")},
    "smtp_pass" => ${phpString(smtpPass)},
    "smtp_from" => ${phpString(process.env.SMTP_FROM || "Setu <no_reply@setuai.com>")},
    "contact_to" => ${phpString(process.env.CONTACT_TO_EMAIL || "support@setuai.com")},
    "site_name" => ${phpString(process.env.SITE_NAME || "SETU")},
    "daily_limit" => ${Number(process.env.CONTACT_DAILY_LIMIT) || 3},
    "allowed_origins" => ${phpArray(allowedOrigins)},
    "send_user_confirmation" => ${phpBool(process.env.SEND_USER_CONFIRMATION ?? "false")},
];
`

const outDir = path.join(root, "public", "api")
const outFile = path.join(outDir, "config.php")

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outFile, config)
console.log("Generated public/api/config.php (not committed — in .gitignore)")
