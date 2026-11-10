'use client'

import React from 'react'
import {
  Circle,
  CircleDot,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'

export type ApplicationStage =
  | 'applied'
  | 'shortlisted'
  | 'interviewing'
  | 'selected'
  | 'offered'
  | 'offer_accepted'
  | 'offer_declined'
  | 'hired'
  | 'joined'
  | 'not_joined'
  | 'withdrawn'
  | 'rejected'
  | 'dropped'
  | 'forfeited'

export interface LinearStatusDotProps {
  status: ApplicationStage | string
  showLabel?: boolean
  labelOverride?: string
  size?: 'sm' | 'md'
  className?: string
}

export function LinearStatusDot({
  status,
  showLabel = true,
  labelOverride,
  size = 'md',
  className = '',
}: LinearStatusDotProps) {
  // Configured purely with precision Lucide SVGs (1.5px stroke) and subtle semantic tints
  const configMap: Record<
    string,
    { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }
  > = {
    applied: {
      label: 'Applied',
      icon: <Circle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-zinc-400',
      bgClass: 'bg-zinc-500/10 border-zinc-500/20',
    },
    shortlisted: {
      label: 'Shortlisted',
      icon: <CircleDot className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-amber-500 dark:text-amber-400',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
    },
    interviewing: {
      label: 'Interviewing',
      icon: <Clock className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-indigo-600 dark:text-indigo-400',
      bgClass: 'bg-indigo-500/10 border-indigo-500/20',
    },
    selected: {
      label: 'Selected',
      icon: <Award className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    },
    offered: {
      label: 'Offered',
      icon: <Award className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    },
    offer_accepted: {
      label: 'Offer Accepted',
      icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    },
    offer_declined: {
      label: 'Offer Declined',
      icon: <XCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-zinc-500',
      bgClass: 'bg-zinc-500/10 border-zinc-500/20',
    },
    hired: {
      label: 'Hired',
      icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/15 border-emerald-500/30',
    },
    joined: {
      label: 'Joined',
      icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/15 border-emerald-500/30',
    },
    not_joined: {
      label: 'Not Joined',
      icon: <XCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-zinc-400',
      bgClass: 'bg-zinc-500/10 border-zinc-500/20',
    },
    withdrawn: {
      label: 'Withdrawn',
      icon: <XCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-zinc-500',
      bgClass: 'bg-zinc-500/10 border-zinc-500/20',
    },
    rejected: {
      label: 'Not Selected',
      icon: <XCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-zinc-400',
      bgClass: 'bg-zinc-500/10 border-zinc-500/20',
    },
    dropped: {
      label: 'Dropped',
      icon: <XCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-red-500 dark:text-red-400',
      bgClass: 'bg-red-500/10 border-red-500/20',
    },
    forfeited: {
      label: 'Forfeited',
      icon: <XCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
      colorClass: 'text-red-500 dark:text-red-400',
      bgClass: 'bg-red-500/10 border-red-500/20',
    },
  }

  const current = configMap[status] || {
    label: status.replace(/_/g, ' '),
    icon: <HelpCircle className="w-3.5 h-3.5 stroke-[1.5]" />,
    colorClass: 'text-zinc-400',
    bgClass: 'bg-zinc-500/10 border-zinc-500/20',
  }

  const displayLabel = labelOverride || current.label

  if (!showLabel) {
    return (
      <span className={`inline-flex items-center ${current.colorClass} ${className}`} title={displayLabel}>
        {current.icon}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium tracking-tight ${current.bgClass} ${current.colorClass} ${
        size === 'sm' ? 'text-[11px] py-0.5 px-2' : ''
      } ${className}`}
    >
      <span className="flex-shrink-0">{current.icon}</span>
      <span className="capitalize">{displayLabel}</span>
    </span>
  )
}
