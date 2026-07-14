import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

const MentalHealthContext = createContext(null)
const FLOW_KEY = "setu_mental_flow"

function readFlow() {
  try {
    const raw = sessionStorage.getItem(FLOW_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeFlow(flow) {
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow || {}))
  } catch {
    /* ignore */
  }
}

export function MentalHealthProvider({ children }) {
  const [flow, setFlowState] = useState(() => readFlow())

  const setFlow = useCallback((patch) => {
    setFlowState((prev) => {
      const next = { ...prev, ...patch }
      writeFlow(next)
      return next
    })
  }, [])

  const clearFlow = useCallback(() => {
    setFlowState({})
    writeFlow({})
  }, [])

  const subject = flow.subject || { type: "self" }
  const lastResult = flow.lastResult || null
  const bookingDraft = flow.bookingDraft || null

  const value = useMemo(
    () => ({
      flow,
      setFlow,
      clearFlow,
      subject,
      lastResult,
      bookingDraft,
    }),
    [flow, setFlow, clearFlow, subject, lastResult, bookingDraft],
  )

  return (
    <MentalHealthContext.Provider value={value}>{children}</MentalHealthContext.Provider>
  )
}

export function useMentalHealth() {
  const ctx = useContext(MentalHealthContext)
  if (!ctx) {
    throw new Error("useMentalHealth must be used within MentalHealthProvider")
  }
  return ctx
}
