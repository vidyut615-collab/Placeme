'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface TactileButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'sage' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function TactileButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  icon,
  className = '',
  disabled,
  ...props
}: TactileButtonProps) {
  // Linear-grade variants
  const variants = {
    primary: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 border border-zinc-900 dark:border-white shadow-2xs font-semibold',
    secondary: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700',
    outline: 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 shadow-2xs',
    ghost: 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    sage: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent shadow-2xs font-semibold',
    destructive: 'bg-rose-600 text-white hover:bg-rose-700 border border-transparent shadow-2xs font-semibold',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-xs font-medium gap-2',
    lg: 'h-11 px-5 text-sm font-medium gap-2.5',
  }

  const effectiveLeftIcon = icon || leftIcon
  const isDisabled = disabled || isLoading

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-lg font-sans transition-all select-none ${variants[variant]} ${sizes[size]} ${
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
      ) : effectiveLeftIcon ? (
        <span className="shrink-0 flex items-center">{effectiveLeftIcon}</span>
      ) : null}

      <span>{children}</span>

      {rightIcon && !isLoading && (
        <span className="shrink-0 flex items-center">{rightIcon}</span>
      )}
    </motion.button>
  )
}
