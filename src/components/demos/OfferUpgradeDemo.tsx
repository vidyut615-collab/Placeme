'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, ArrowUpRight, CheckCircle2, ShieldCheck, Zap, Award } from 'lucide-react'

export function OfferUpgradeDemo() {
  const [cleared, setCleared] = useState(false)
  const [lpa, setLpa] = useState(12)

  useEffect(() => {
    let mounted = true

    const runLoop = async () => {
      while (mounted) {
        setCleared(false)
        setLpa(12)
        await new Promise((r) => setTimeout(r, 1400))
        if (!mounted) break

        setCleared(true)
        setLpa(34)
        await new Promise((r) => setTimeout(r, 3400))
        if (!mounted) break
      }
    }

    runLoop()
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
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-semibold text-[15px] text-[#242424] block">
              Offer Upgrade & Multiplier Gate
            </span>
            <span className="text-[10px] text-[#797776]">Eliminating Lateral Disputes · 1.5× Rule Threshold</span>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 transition-all ${
          cleared
            ? 'bg-[#a7fccd]/40 border-[#16a34a]/30 text-[#16a34a]'
            : 'bg-[#cfdaf5]/40 border-[#2b59d1]/30 text-[#2b59d1]'
        }`}>
          <Zap className="w-3.5 h-3.5" />
          <span>{cleared ? 'Super Dream Unlocked' : 'Evaluating Threshold'}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-4">
        
        {/* Current Base Holding */}
        <div className="p-4 rounded-xl bg-white border border-[#cecac8]/60 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-[#797776] uppercase tracking-[0.08em] block">Current Verified Holding</span>
            <span className="font-semibold text-[14px] text-[#242424]">TCS Digital · Core Systems</span>
            <span className="text-[11px] text-[#797776] block">Base Tier Protection Gate</span>
          </div>
          <div className="text-right">
            <span className="font-heading font-bold text-[24px] text-[#242424]">₹12.0 LPA</span>
            <span className="text-[10px] text-[#797776] block">Base Anchor</span>
          </div>
        </div>

        {/* Multiplier Gate Formula Box */}
        <div className="p-4 rounded-xl bg-[#cfdaf5]/30 border border-[#2b59d1]/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[11px] text-[#2b59d1] uppercase tracking-[0.06em]">
              Autonomous Rule Computation
            </span>
            <span className="text-[10px] bg-[#2b59d1] text-white px-2 py-0.5 rounded font-bold">
              1.5× Rule Active
            </span>
          </div>
          <p className="text-[12px] text-[#242424] font-medium leading-relaxed">
            Threshold Formula: ₹12.0 LPA base × 1.5 multiplier = <strong className="text-[#2b59d1]">₹18.0 LPA Gate Requirement</strong>
          </p>
          <p className="text-[10px] text-[#797776]">
            Subsequent applications blocked unless compensation strictly exceeds ₹18.0 LPA.
          </p>
        </div>

        {/* Incoming Target Opportunity */}
        <div className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between shadow-xs ${
          cleared ? 'bg-[#a7fccd]/20 border-[#16a34a]/40' : 'bg-white border-[#cecac8]/60'
        }`}>
          <div>
            <span className="text-[10px] text-[#16a34a] font-semibold uppercase tracking-[0.08em] block">
              Incoming Opportunity
            </span>
            <span className="font-semibold text-[14px] text-[#242424] flex items-center gap-1.5">
              Google LLC · Staff SDE-2 <ArrowUpRight className="w-4 h-4 text-[#16a34a]" />
            </span>
            <span className="text-[11px] text-[#797776] block">Exceeds threshold by +88%</span>
          </div>
          <div className="text-right">
            <motion.span
              key={lpa}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="font-heading font-bold text-[26px] text-[#16a34a] block"
            >
              ₹{lpa}.0 LPA
            </motion.span>
            <span className="text-[10px] font-semibold text-[#16a34a] bg-[#a7fccd]/40 px-2 py-0.5 rounded">
              Gate Passed ✓
            </span>
          </div>
        </div>

      </div>

    </div>
  )
}
