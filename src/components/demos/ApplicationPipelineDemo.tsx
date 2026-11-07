'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCommit, CheckCircle2, Clock, ShieldCheck, ArrowRight, Award } from 'lucide-react'

const STAGES = [
  { step: '01', title: 'Application Submitted', time: 'Aug 01 · 10:30 AM', detail: 'GPA 9.2 verified · Resume auto-matched', status: 'Completed' },
  { step: '02', title: 'Resume Shortlisted', time: 'Aug 03 · 02:15 PM', detail: 'Selected in top 5% candidate batch', status: 'Passed' },
  { step: '03', title: 'Technical Rounds (R1 & R2)', time: 'Aug 06 · 11:00 AM', detail: 'DSA & Systems Architecture: 9.4/10', status: 'Passed' },
  { step: '04', title: 'Committee Selection', time: 'Aug 09 · 04:45 PM', detail: 'Placement Cell rulebook verification', status: 'Approved' },
  { step: '05', title: 'Official Offer Released', time: 'Aug 10 · 06:00 PM', detail: 'Google LLC · Staff SDE-2 (₹34.0 LPA)', status: 'Offer Locked' },
]

export function ApplicationPipelineDemo() {
  const [activeStage, setActiveStage] = useState(1)

  useEffect(() => {
    let mounted = true

    const runConveyor = async () => {
      while (mounted) {
        for (let i = 1; i <= 5; i++) {
          if (!mounted) break
          setActiveStage(i)
          await new Promise((r) => setTimeout(r, 900))
        }
        await new Promise((r) => setTimeout(r, 2600))
      }
    }

    runConveyor()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="w-full bg-[#faf9f8] text-[#242424] rounded-[24px] overflow-hidden border border-[#cecac8] shadow-lg font-mono text-[13px]">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#cecac8]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2b59d1]/10 flex items-center justify-center text-[#2b59d1]">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-semibold text-[15px] text-[#242424] block">
              14-State Application Machine
            </span>
            <span className="text-[10px] text-[#797776]">Immutable Audit Trail · Zero Data Drift</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#cfdaf5]/40 border border-[#2b59d1]/20 px-3 py-1 rounded-full text-[10px] text-[#2b59d1] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cryptographically Verified</span>
        </div>
      </div>

      {/* Pipeline Conveyor List */}
      <div className="p-6 space-y-3">
        {STAGES.map((s, idx) => {
          const isDone = idx + 1 <= activeStage
          const isCurrent = idx + 1 === activeStage
          const isFinal = idx === 4

          return (
            <motion.div
              key={s.step}
              animate={isCurrent ? { scale: [1, 1.01, 1] } : {}}
              className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                isFinal && isDone
                  ? 'bg-[#a7fccd]/25 border-[#16a34a]/40 shadow-xs'
                  : isDone
                  ? 'bg-white border-[#cecac8]/70 shadow-xs'
                  : 'bg-white/40 border-[#cecac8]/30 opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${
                  isFinal && isDone
                    ? 'bg-[#16a34a] text-white'
                    : isDone
                    ? 'bg-[#2b59d1] text-white'
                    : 'bg-gray-200 text-[#797776]'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13px] text-[#242424]">{s.title}</span>
                    <span className="text-[10px] text-[#797776]">{s.time}</span>
                  </div>
                  <span className="text-[11px] text-[#4e4d4d]">{s.detail}</span>
                </div>
              </div>

              <div>
                <span className={`text-[10px] font-semibold uppercase tracking-[0.05em] px-2.5 py-1 rounded-full ${
                  isFinal && isDone
                    ? 'bg-[#16a34a] text-white'
                    : isDone
                    ? 'bg-[#cfdaf5] text-[#2b59d1]'
                    : 'bg-gray-100 text-[#797776]'
                }`}>
                  {isDone ? s.status : 'Pending'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

    </div>
  )
}
