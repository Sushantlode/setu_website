import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import { CheckCircle2, Info, X, XCircle } from "lucide-react"

const ToastContext = createContext(null)

const VARIANT_STYLES = {
  success: {
    bar: "bg-emerald-500",
    icon: "text-emerald-600",
    Icon: CheckCircle2,
  },
  error: {
    bar: "bg-red-500",
    icon: "text-red-600",
    Icon: XCircle,
  },
  info: {
    bar: "bg-sky-500",
    icon: "text-sky-600",
    Icon: Info,
  },
}

let toastId = 0

export function ToastProvider({ children, defaultDuration = 3200 }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, { variant = "info", duration = defaultDuration, title } = {}) => {
      const text = String(message || "").trim()
      if (!text) return null
      const id = ++toastId
      setToasts((prev) => [...prev.slice(-4), { id, message: text, variant, title }])
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [defaultDuration, dismiss],
  )

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, opts) => push(message, { ...opts, variant: "success" }),
      error: (message, opts) => push(message, { ...opts, variant: "error" }),
      info: (message, opts) => push(message, { ...opts, variant: "info" }),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => {
          const meta = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info
          const Icon = meta.Icon
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/10 animate-[toast-in_220ms_ease-out]"
              role="status"
            >
              <span className={`w-1.5 shrink-0 ${meta.bar}`} />
              <div className="flex flex-1 items-start gap-3 px-3.5 py-3">
                <Icon className={`mt-0.5 shrink-0 ${meta.icon}`} size={18} />
                <div className="min-w-0 flex-1">
                  {toast.title && (
                    <p className="text-sm font-semibold text-setu-charcoal">{toast.title}</p>
                  )}
                  <p className="text-sm text-setu-charcoal/90">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-full p-1 text-setu-muted hover:bg-black/5 hover:text-setu-charcoal"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}
