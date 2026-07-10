import { useEffect, useState } from "react"

export function usePageReady({ minMs = 450, maxMs = 2800 } = {}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      setReady(true)
    }

    const minTimer = setTimeout(finish, minMs)
    const maxTimer = setTimeout(finish, maxMs)

    const waitForLoad = () =>
      new Promise((resolve) => {
        if (document.readyState === "complete") {
          resolve()
          return
        }
        window.addEventListener("load", resolve, { once: true })
      })

    const waitForFonts = document.fonts?.ready ?? Promise.resolve()

    Promise.all([waitForLoad(), waitForFonts]).then(finish)

    return () => {
      clearTimeout(minTimer)
      clearTimeout(maxTimer)
    }
  }, [minMs, maxMs])

  return ready
}
