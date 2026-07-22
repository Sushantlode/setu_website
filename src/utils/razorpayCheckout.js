/** Public Razorpay key — same as SETU app / booktest flows */
export const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_Rgl75wP2oROCnL"

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(window.Razorpay)
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error("Could not load Razorpay checkout"))
    document.body.appendChild(script)
  })
}

/**
 * Opens Razorpay modal and resolves with payment response
 * { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export function openRazorpayCheckout(options) {
  return new Promise((resolve, reject) => {
    loadRazorpayScript()
      .then((Razorpay) => {
        const rzp = new Razorpay({
          ...options,
          handler: (response) => resolve(response),
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        })
        rzp.on("payment.failed", (resp) => {
          reject(new Error(resp?.error?.description || "Payment failed"))
        })
        rzp.open()
      })
      .catch(reject)
  })
}
