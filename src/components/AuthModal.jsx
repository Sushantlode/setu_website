import { useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, LogIn, UserPlus } from "lucide-react"

export default function AuthModal({ open, onClose, mode = "login" }) {
  const isLogin = mode === "login"

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose()
    }
    if (open) window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-setu-charcoal/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-setu-stone/20 bg-setu-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-setu-muted transition-colors hover:bg-setu-sand hover:text-setu-charcoal"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="px-6 pb-8 pt-10 text-center sm:px-8 sm:pb-10 sm:pt-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#1C39BB]">
                {isLogin ? <LogIn size={28} /> : <UserPlus size={28} />}
              </span>

              <h2
                id="auth-modal-title"
                className="mt-5 font-serif text-2xl text-setu-charcoal sm:text-3xl"
              >
                {isLogin ? "Sign in to SETU" : "Join SETU"}
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-setu-muted sm:text-base">
                {isLogin
                  ? "Use the same mobile number and OTP as the SETU app to open your web dashboard."
                  : "Create your account with OTP verification, then explore SETU modules on the web."}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  to={isLogin ? "/login" : "/register"}
                  onClick={onClose}
                  className="btn-primary btn-primary-dark"
                >
                  {isLogin ? "Continue to login" : "Create account"}
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary border border-setu-stone/30 bg-white px-5 py-2.5 text-sm text-setu-charcoal hover:border-setu-coral"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
