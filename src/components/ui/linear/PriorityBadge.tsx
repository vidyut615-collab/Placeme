'use client'

import React from 'react'
import {
  TrendingUp,
  Zap,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Lock,
} from 'lucide-react'

export type PlacementTier =
  | 'core'
  | 'dream'
  | 'super_dream'
  | 'multiplier_unlocked'
  | 'eligible'
  | 'locked'

export interface PriorityBadgeProps {
  tier: PlacementTier | string
  labelOverride?: string
  className?: string
  size?: 'sm' | 'md'
}

export function PriorityBadge({
  tier,
  labelOverride,
  className = '',
  size = 'md',
}: PriorityBadgeProps) {
  const badgeConfigs: Record<
    string,
    { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }
  > = {
    core: {
      label: 'Core Tier',
      icon: <TrendingUp className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-zinc-600 dark:text-zinc-300',
      bgClass: 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700',
    },
    dream: {
      label: 'Dream Tier',
      icon: <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-indigo-600 dark:text-indigo-400',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
    },
    super_dream: {
      label: 'Super Dream',
      icon: <Zap className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    },
    multiplier_unlocked: {
      label: '1.5× Upgrade Unlocked',
      icon: <Sparkles className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-blue-600 dark:text-blue-400',
      bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    },
    eligible: {
      label: 'Eligible',
      icon: <CheckCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    },
    locked: {
      label: 'Policy Blocked',
      icon: <Lock className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-zinc-500 dark:text-zinc-400',
      bgClass: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700',
    },
  }

  const current = badgeConfigs[tier.toLowerCase()] || {
    label: tier,
    icon: <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />,
    colorClass: 'text-zinc-600 dark:text-zinc-300',
    bgClass: 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700',
  }

  const label = labelOverride || current.label

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium tracking-tight select-none ${
        current.bgClass
      } ${current.colorClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } ${className}`}
    >
      <span className="flex-shrink-0">{current.icon}</span>
      <span>{label}</span>
    </span>
  )
}
