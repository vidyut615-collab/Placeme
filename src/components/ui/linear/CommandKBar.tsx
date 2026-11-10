'use client'

import React, { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

export interface CommandKBarProps {
  placeholder?: string
  value?: string
  onChange?: (val: string) => void
  onTrigger?: () => void
  className?: string
  autoFocus?: boolean
}

export function CommandKBar({
  placeholder = 'Search jobs, applications, or type ⌘K...',
  value,
  onChange,
  onTrigger,
  className = '',
  autoFocus = false,
}: CommandKBarProps) {
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setIsMac(typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform))
  }, [])

  return (
    <div
      onClick={onTrigger}
      className={`group relative flex items-center w-full max-w-md h-8.5 px-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-text focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 focus-within:border-transparent ${className}`}
    >
      <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 stroke-[1.5] mr-2 flex-shrink-0 transition-colors" />

      {onChange ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent border-none text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />
      ) : (
        <span className="w-full text-xs text-zinc-400 select-none truncate">
          {placeholder}
        </span>
      )}

      <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 ml-2 select-none flex-shrink-0">
        <kbd className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded shadow-2xs">
          {isMac ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </div>
    </div>
  )
}
