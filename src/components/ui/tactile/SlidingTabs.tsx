'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface TabItem {
  id: string
  label: string
  count?: number | string
  icon?: React.ReactNode
}

export interface SlidingTabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
  tabClassName?: string
}

export function SlidingTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  tabClassName = '',
}: SlidingTabsProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-[#E2E8F0]/60 dark:bg-zinc-800/60 p-1.5 rounded-full border border-[#cecac8]/50 dark:border-zinc-700/60 shadow-xs ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-full font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B59D1] select-none ${
              isActive
                ? 'text-[#242424] dark:text-white'
                : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-zinc-200'
            } ${tabClassName}`}
          >
            {isActive && (
              <motion.div
                layoutId="sliding-active-pill"
                className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-full shadow-xs border border-[#cecac8]/60 dark:border-zinc-700"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 30,
                }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-[#cfdaf5] text-[#2B59D1]'
                      : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
