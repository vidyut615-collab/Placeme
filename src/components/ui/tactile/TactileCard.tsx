'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

export interface TactileCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}

export function TactileCard({
  children,
  className = '',
  interactive = true,
  ...props
}: TactileCardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -2, transition: { duration: 0.18, ease: 'easeOut' } } : undefined}
      className={`bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs transition-all ${
        interactive ? 'hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
