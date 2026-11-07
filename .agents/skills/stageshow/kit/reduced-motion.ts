import { createContext, useContext, useEffect, useState } from 'react'

// Static stages settle motion parts too, even without an OS preference.
// When null, defer to the viewer's OS prefers-reduced-motion setting.
// When boolean, explicit control takes precedence (e.g. playground toggle).
export const StillContext = createContext<boolean | null>(null)

/** Whether the viewer asked for reduced motion. A stage shows its still; parts skip their tweens. */
export function useReducedMotion() {
  const override = useContext(StillContext)
  // Always initialize to false for consistent SSR and initial client hydration
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setReduced(true)
    const update = () => setReduced(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  if (override !== null && override !== undefined) {
    return override
  }
  return reduced
}
