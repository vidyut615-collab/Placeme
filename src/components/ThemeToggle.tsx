"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={`rounded-full w-9 h-9 border-none hover:bg-slate-100 dark:hover:bg-slate-800 ${className || ''}`}
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export function SidebarThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark')

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 text-xs transition-colors group cursor-pointer"
      title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
    >
      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
        {mounted && isDark ? (
          <>
            <Moon className="h-3.5 w-3.5 text-blue-400" />
            <span>Dark Mode</span>
          </>
        ) : (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light Mode</span>
          </>
        )}
      </div>
      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 font-normal">
        Switch
      </span>
    </button>
  )
}
