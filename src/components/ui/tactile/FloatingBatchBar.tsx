'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X, ArrowRight, Download, Send } from 'lucide-react'

export interface FloatingBatchAction {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'sage' | 'destructive'
}

export interface FloatingBatchBarProps {
  selectedCount: number
  actions?: FloatingBatchAction[]
  onClear?: () => void
  labelSingular?: string
  labelPlural?: string
}

export function FloatingBatchBar({
  selectedCount,
  actions = [],
  onClear,
  labelSingular = 'Candidate',
  labelPlural = 'Candidates',
}: FloatingBatchBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 90, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 90, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-5 py-3 rounded-full shadow-2xl border border-white/15 flex items-center gap-4 z-50 font-mono text-xs select-none backdrop-blur-md"
        >
          {/* Badge Counter */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/20">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="bg-[#2B59D1] text-white px-2.5 py-0.5 rounded-full font-bold">
              {selectedCount}
            </span>
            <span className="text-white/80">
              {selectedCount === 1 ? labelSingular : labelPlural} selected
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {actions.map((act, i) => (
              <button
                key={i}
                onClick={act.onClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            ))}
          </div>

          {/* Dismiss / Clear Button */}
          {onClear && (
            <button
              onClick={onClear}
              className="text-white/40 hover:text-white p-1 rounded-full transition-colors ml-1"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
