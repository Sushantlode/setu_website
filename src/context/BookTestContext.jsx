import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "./AuthContext"
import { fetchCartDetails } from "../api/booktest"
import { normalizeCartPayload } from "../utils/booktest"

const BookTestContext = createContext(null)

const FLOW_KEY = "setu_booktest_flow"

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

export function BookTestProvider({ children }) {
  const { session } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [billing, setBilling] = useState(null)
  const [cartLoading, setCartLoading] = useState(false)
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

  const refreshCart = useCallback(async () => {
    if (!session?.token || !session?.user_id) {
      setCartItems([])
      setBilling(null)
      return null
    }
    setCartLoading(true)
    try {
      const raw = await fetchCartDetails(session, session.user_id)
      const normalized = normalizeCartPayload(raw)
      setCartItems(normalized.items)
      setBilling(normalized.billing)
      return normalized
    } catch {
      setCartItems([])
      setBilling(null)
      return null
    } finally {
      setCartLoading(false)
    }
  }, [session])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const cartCount = useMemo(
    () =>
      cartItems.reduce((sum, it) => sum + (parseInt(it.quantity, 10) || 1), 0),
    [cartItems],
  )

  const value = useMemo(
    () => ({
      cartItems,
      billing,
      cartLoading,
      cartCount,
      refreshCart,
      flow,
      setFlow,
      clearFlow,
    }),
    [
      cartItems,
      billing,
      cartLoading,
      cartCount,
      refreshCart,
      flow,
      setFlow,
      clearFlow,
    ],
  )

  return (
    <BookTestContext.Provider value={value}>{children}</BookTestContext.Provider>
  )
}

export function useBookTest() {
  const ctx = useContext(BookTestContext)
  if (!ctx) throw new Error("useBookTest must be used within BookTestProvider")
  return ctx
}
