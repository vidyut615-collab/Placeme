'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScreenLoaderProps {
  show: boolean
  title?: string
  message?: string
  variant?: 'default' | 'blue' | 'emerald' | 'amber' | 'red'
}

export function ScreenLoader({
  show,
  title = 'Processing...',
  message = 'Please wait while records are updated...',
  variant = 'default',
}: ScreenLoaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !show) return null

  const variantStyles = {
    default: {
      spinner: 'text-primary',
      bgGlow: 'bg-primary/10 border-primary/20',
    },
    blue: {
      spinner: 'text-blue-600 dark:text-blue-400',
      bgGlow: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    emerald: {
      spinner: 'text-emerald-600 dark:text-emerald-400',
      bgGlow: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    },
    amber: {
      spinner: 'text-amber-600 dark:text-amber-400',
      bgGlow: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    },
    red: {
      spinner: 'text-red-600 dark:text-red-400',
      bgGlow: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    },
  }[variant]

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in fade-in-0 zoom-in-95 duration-150">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 shadow-xs',
            variantStyles.bgGlow
          )}
        >
          <Loader2 className={cn('w-7 h-7 animate-spin', variantStyles.spinner)} />
        </div>
        <h3 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
        {message && (
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            {message}
          </p>
        )}
      </div>
    </div>,
    document.body
  )
}
