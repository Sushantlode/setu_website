import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useAuth } from "./AuthContext"
import { fetchCartList, onboardUser } from "../api/generic"

const GenericMedicineContext = createContext(null)
const FLOW_KEY = "setu_generic_flow"

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

export function GenericMedicineProvider({ children }) {
  const { session } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [orderId, setOrderId] = useState(null)
  const [prescriptionNeeded, setPrescriptionNeeded] = useState("0")
  const [prescriptionMessage, setPrescriptionMessage] = useState("")
  const [cartLoading, setCartLoading] = useState(false)
  const [flow, setFlowState] = useState(() => readFlow())
  const [onboarded, setOnboarded] = useState(false)

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
    if (!session?.token) {
      setCartItems([])
      setOrderId(null)
      return null
    }
    setCartLoading(true)
    try {
      const cart = await fetchCartList(session)
      setCartItems(cart.items || [])
      setOrderId(cart.orderId)
      setPrescriptionNeeded(cart.prescriptionNeeded || "0")
      setPrescriptionMessage(cart.prescriptionMessage || "")
      return cart
    } catch {
      setCartItems([])
      return null
    } finally {
      setCartLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!session?.token || onboarded) return
    onboardUser(session).finally(() => setOnboarded(true))
  }, [session, onboarded])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const cartCount = useMemo(
    () =>
      cartItems.reduce(
        (sum, it) => sum + (parseInt(it.OrdDetailQTY || it.qty || 1, 10) || 1),
        0,
      ),
    [cartItems],
  )

  const value = useMemo(
    () => ({
      cartItems,
      orderId,
      prescriptionNeeded,
      prescriptionMessage,
      cartLoading,
      cartCount,
      refreshCart,
      flow,
      setFlow,
      clearFlow,
    }),
    [
      cartItems,
      orderId,
      prescriptionNeeded,
      prescriptionMessage,
      cartLoading,
      cartCount,
      refreshCart,
      flow,
      setFlow,
      clearFlow,
    ],
  )

  return (
    <GenericMedicineContext.Provider value={value}>
      {children}
    </GenericMedicineContext.Provider>
  )
}

export function useGenericMedicine() {
  const ctx = useContext(GenericMedicineContext)
  if (!ctx) {
    throw new Error("useGenericMedicine must be used within GenericMedicineProvider")
  }
  return ctx
}
