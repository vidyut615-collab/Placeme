'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export interface LinearRowProps {
  onClick?: () => void
  isSelected?: boolean
  leftSlot?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  metadata?: React.ReactNode
  rightSlot?: React.ReactNode
  className?: string
}

export function LinearRow({
  onClick,
  isSelected = false,
  leftSlot,
  title,
  subtitle,
  metadata,
  rightSlot,
  className = '',
}: LinearRowProps) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={onClick}
      className={`group relative flex items-center justify-between px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer select-none ${
        isSelected
          ? 'bg-zinc-100/80 dark:bg-zinc-800/60 border-l-2 border-l-purple-600 dark:border-l-purple-400'
          : ''
      } ${className}`}
    >
      {/* Left items: Checkbox / Status Dot / Icon */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        {leftSlot && <div className="flex-shrink-0">{leftSlot}</div>}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {title}
            </span>
          </div>

          {subtitle && (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right items: Metadata pills / CTC / Chevron */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {metadata && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {metadata}
          </div>
        )}

        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}

        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.div>
  )
}
