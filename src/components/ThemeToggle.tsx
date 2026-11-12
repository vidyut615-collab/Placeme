"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

const emptySubscribe = () => () => {}

function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

export function executeSmoothThemeSwitch(
  nextTheme: "light" | "dark",
  setTheme: (theme: string) => void,
  event?: React.MouseEvent<HTMLElement>
) {
  if (typeof document === "undefined") {
    setTheme(nextTheme)
    return
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches

  const docEl = document.documentElement

  const docWithTransition = document as Document & {
    startViewTransition?: (callback: () => void | Promise<void>) => {
      ready: Promise<void>
      finished: Promise<void>
    }
  }

  if (
    !prefersReducedMotion &&
    typeof docWithTransition.startViewTransition === "function"
  ) {
    try {
      // Capture pointer origin or button center before DOM updates
      let x = window.innerWidth - 48
      let y = 32
      if (event?.currentTarget) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
        x = rect.left + rect.width / 2
        y = rect.top + rect.height / 2
      } else if (event && (event.clientX || event.clientY)) {
        x = event.clientX
        y = event.clientY
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      const transition = docWithTransition.startViewTransition(() => {
        // Apply class synchronously so the view-transition new snapshot captures the target theme
        docEl.classList.remove("light", "dark")
        docEl.classList.add(nextTheme)
        docEl.style.colorScheme = nextTheme
        flushSync(() => {
          setTheme(nextTheme)
        })
      })

      transition.ready
        .then(() => {
          docEl.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 520,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          )
        })
        .catch(() => {})

      return
    } catch {
      // Fall through to CSS transition fallback
    }
  }

  // Fallback smooth CSS color/surface transition
  docEl.classList.add("theme-transitioning")
  setTheme(nextTheme)
  window.setTimeout(() => {
    docEl.classList.remove("theme-transitioning")
  }, 450)
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useIsMounted()

  const currentTheme = mounted ? (resolvedTheme || theme) : "light"
  const isDark = currentTheme === "dark"

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = isDark ? "light" : "dark"
    executeSmoothThemeSwitch(nextTheme, setTheme, e)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={`relative rounded-lg w-8 h-8 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] transition-colors duration-200 cursor-pointer ${
        className || ""
      }`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle visual theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500 stroke-[1.5]" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-[#14B8A6] stroke-[1.5]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function SidebarThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useIsMounted()

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark")

  return (
    <div className="flex items-center justify-between p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs w-full select-none">
      <button
        type="button"
        onClick={(e) => executeSmoothThemeSwitch("light", setTheme, e)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
          !isDark && mounted
            ? "bg-white text-zinc-900 shadow-2xs font-semibold"
            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500 stroke-[1.5]" />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={(e) => executeSmoothThemeSwitch("dark", setTheme, e)}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
          isDark && mounted
            ? "bg-zinc-800 text-zinc-100 shadow-2xs font-semibold"
            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-[#14B8A6] stroke-[1.5]" />
        <span>Dark</span>
      </button>
    </div>
  )
}
