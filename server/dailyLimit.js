const DAY_MS = 24 * 60 * 60 * 1000
const MAX_PER_DAY = Number(process.env.CONTACT_DAILY_LIMIT) || 3

const usage = new Map()

function todayKey(prefix, value) {
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}:${value}:${date}`
}

function pruneOldEntries() {
  const today = new Date().toISOString().slice(0, 10)

  for (const key of usage.keys()) {
    if (!key.endsWith(`:${today}`)) {
      usage.delete(key)
    }
  }
}

export function getDailyUsage(prefix, value) {
  pruneOldEntries()
  return usage.get(todayKey(prefix, value)) || 0
}

export function canSendToday(prefix, value) {
  return getDailyUsage(prefix, value) < MAX_PER_DAY
}

export function recordDailySend(prefix, value) {
  const key = todayKey(prefix, value)
  const count = usage.get(key) || 0
  usage.set(key, count + 1)
}

export function dailyLimitMessage() {
  return `You can only send ${MAX_PER_DAY} messages per day. Please try again tomorrow.`
}

export const DAILY_LIMIT = MAX_PER_DAY
