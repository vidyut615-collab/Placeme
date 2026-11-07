'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sliders, ShieldAlert, Check, RefreshCw, AlertTriangle, Lock } from 'lucide-react'

export function PolicyEngineDemo() {
  const [noShowActive, setNoShowActive] = useState(false)
  const [violationTriggered, setViolationTriggered] = useState(false)

  // Animated continuous scenario
  useEffect(() => {
    let mounted = true

    const runScenario = async () => {
      while (mounted) {
        // State 0: Switch is OFF
        setNoShowActive(false)
        setViolationTriggered(false)
        await new Promise((r) => setTimeout(r, 1400))
        if (!mounted) break

        // State 1: Coordinator or engine activates No-Show Policy
        setNoShowActive(true)
        await new Promise((r) => setTimeout(r, 800))
        if (!mounted) break

        // State 2: Student triggers violation -> Auto-blacklist event triggers
        setViolationTriggered(true)
        await new Promise((r) => setTimeout(r, 3400))
        if (!mounted) break

        // Reset
        setViolationTriggered(false)
        setNoShowActive(false)
        await new Promise((r) => setTimeout(r, 800))
      }
    }

    runScenario()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="w-full bg-[#faf9f8] text-[#242424] rounded-[24px] overflow-hidden border border-[#cecac8] shadow-lg font-mono text-[13px]">
      
      {/* Switchboard Header */}
      <div className="px-6 py-4 bg-white border-b border-[#cecac8]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2b59d1]/10 flex items-center justify-center text-[#2b59d1]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-semibold text-[15px] text-[#242424] block">
              Autonomous Policy Switchboard
            </span>
            <span className="text-[10px] text-[#797776]">Deterministic Rule Matrix · Zero Discretion</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#a7fccd]/40 border border-[#16a34a]/30 px-3 py-1 rounded-full text-[10px] text-[#16a34a] font-semibold">
          <Check className="w-3.5 h-3.5" />
          <span>20 / 20 Active Rules Enforced</span>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="p-6 space-y-3.5">
        
        {/* Rule 1: Always Active */}
        <div className="p-3.5 rounded-xl bg-white border border-[#cecac8]/60 flex items-center justify-between shadow-xs">
          <div>
            <span className="font-semibold text-[12px] text-[#242424] block">Rule 01: Minimum GPA Barrier</span>
            <span className="text-[10px] text-[#797776]">Min 7.5 CGPA required · Zero standing backlogs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#16a34a] font-semibold bg-[#a7fccd]/30 px-2 py-0.5 rounded">Enforced</span>
            <div className="w-10 h-6 bg-[#2b59d1] rounded-full p-1 flex items-center justify-end">
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </div>

        {/* Rule 2: Offer Upgrade Gate */}
        <div className="p-3.5 rounded-xl bg-white border border-[#cecac8]/60 flex items-center justify-between shadow-xs">
          <div>
            <span className="font-semibold text-[12px] text-[#242424] block">Rule 02: Offer Upgrade Multiplier</span>
            <span className="text-[10px] text-[#797776]">1.5× CTC multiplier threshold before lateral re-apply</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#16a34a] font-semibold bg-[#a7fccd]/30 px-2 py-0.5 rounded">Enforced</span>
            <div className="w-10 h-6 bg-[#2b59d1] rounded-full p-1 flex items-center justify-end">
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </div>

        {/* Rule 3: Animated No-Show Policy */}
        <div className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
          noShowActive ? 'bg-[#cfdaf5]/30 border-[#2b59d1]/40' : 'bg-white border-[#cecac8]/60'
        }`}>
          <div>
            <span className="font-semibold text-[12px] text-[#242424] block">Rule 03: Unexcused No-Show Limit</span>
            <span className="text-[10px] text-[#797776]">Max 2 unexcused interview absences before disciplinary suspension</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              noShowActive ? 'text-[#2b59d1] bg-[#cfdaf5]' : 'text-[#797776] bg-gray-100'
            }`}>
              {noShowActive ? 'Arming Rule' : 'Armed'}
            </span>
            <div className={`w-10 h-6 rounded-full p-1 flex items-center transition-colors cursor-pointer ${
              noShowActive ? 'bg-[#2b59d1] justify-end' : 'bg-[#cecac8] justify-start'
            }`}>
              <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </div>

        {/* Dynamic Violation / Conflict Event Alert */}
        <AnimatePresence>
          {violationTriggered && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="p-4 rounded-xl bg-[#fee2e2] border border-[#ef4444]/40 flex items-start gap-3 shadow-sm"
            >
              <AlertTriangle className="w-5 h-5 text-[#b91c1c] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[12px] text-[#b91c1c] uppercase tracking-[0.06em]">
                    Disciplinary Flag Automatically Enforced
                  </span>
                  <span className="text-[9px] bg-[#ef4444] text-white px-2 py-0.2 rounded font-semibold uppercase">
                    Tamper Proof
                  </span>
                </div>
                <p className="text-[11px] text-[#7f1d1d] leading-relaxed">
                  Candidate Aman Gupta missed 2 consecutive Google interview calls without medical approval. System applied 14-day recruitment suspension. 1 reinstatement chance reserved.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
