import * as React from "react"

const MOBILE_BREAKPOINT = 768

function query() {
  return `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
}

export function useIsMobile() {
  // useSyncExternalStore evita o setState-em-effect (regra react-hooks) e
  // já entrega o valor correto na 1ª renderização no client.
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query())
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query()).matches,
    () => false, // SSR: assume desktop
  )
}
