'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Sparkles, Building2, TrendingUp, ShieldCheck, Award, ArrowUpRight } from 'lucide-react'

export function PlacementHeroDemo() {
  const [step, setStep] = useState(0)
  const [lpa, setLpa] = useState(12)
  const [status, setStatus] = useState('In Review')
  const [checks, setChecks] = useState([false, false, false])

  // Continuous loop choreography
  useEffect(() => {
    let mounted = true

    const runLoop = async () => {
      while (mounted) {
        // Step 0: Initial state
        setStep(0)
        setLpa(12)
        setStatus('In Review')
        setChecks([false, false, false])
        await new Promise((r) => setTimeout(r, 1200))
        if (!mounted) break

        // Step 1: Candidate selected, verification starts
        setStep(1)
        await new Promise((r) => setTimeout(r, 600))
        if (!mounted) break
        setChecks([true, false, false])
        await new Promise((r) => setTimeout(r, 400))
        if (!mounted) break
        setChecks([true, true, false])
        await new Promise((r) => setTimeout(r, 400))
        if (!mounted) break
        setChecks([true, true, true])
        await new Promise((r) => setTimeout(r, 500))
        if (!mounted) break

        // Step 2: Dispatch button triggers
        setStep(2)
        setStatus('Shortlisted')
        await new Promise((r) => setTimeout(r, 700))
        if (!mounted) break

        // Step 3: Offer Approved & LPA rolls up
        setStep(3)
        setStatus('Offer Released')
        setLpa(34)
        await new Promise((r) => setTimeout(r, 3200))
        if (!mounted) break

        // Reset
        setStep(4)
        await new Promise((r) => setTimeout(r, 800))
      }
    }

    runLoop()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="w-full bg-[#1c1d20] text-white rounded-[24px] overflow-hidden border border-white/10 shadow-2xl font-mono text-[13px]">
      
      {/* Top Console Bar */}
      <div className="px-6 py-4 bg-[#141517] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="font-semibold tracking-[0.06em] text-white/90 uppercase text-[11px]">
            Placement Dispatch Terminal · Cycle 2026-I
          </span>
        </div>

        <div className="flex items-center gap-6 text-[11px] text-white/60">
          <div className="flex items-center gap-2">
            <span className="text-white/40">Tier:</span>
            <span className="text-[#a7fccd] font-semibold">Super Dream Pool</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40">Engine Mode:</span>
            <span className="text-[#cfdaf5] font-semibold">Autonomous RLS</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-white/40">Sync Latency:</span>
            <span className="text-white/90">12ms</span>
          </div>
        </div>
      </div>

      {/* Main Broad Grid */}
      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Live Candidate Context (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-[10px] uppercase tracking-[0.1em]">Target Candidate</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2b59d1]/30 border border-[#2b59d1]/50 text-[#cfdaf5] text-[10px] font-semibold">
                CS21B042
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2b59d1] to-[#60a5fa] flex items-center justify-center text-white font-bold text-[16px] shadow-md">
                AG
              </div>
              <div>
                <p className="font-heading font-semibold text-[17px] text-white">Aman Gupta</p>
                <p className="text-white/60 text-[11px]">B.Tech Computer Science · GPA 9.24</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50">Current Base Holding:</span>
                <span className="text-white/90 font-medium">TCS Digital · ₹12.0 LPA</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50">Target Enterprise:</span>
                <span className="text-white font-semibold flex items-center gap-1">
                  Google LLC <ArrowUpRight className="w-3.5 h-3.5 text-[#22c55e]" />
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50">Designated Role:</span>
                <span className="text-[#cfdaf5]">Staff Systems Engineer (SDE-2)</span>
              </div>
            </div>
          </div>

          {/* Live Package Counter */}
          <div className="bg-[#141517] rounded-xl p-4 border border-white/10 mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/50 text-[10px] uppercase tracking-[0.08em]">Compensation Package</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${step >= 3 ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-white/10 text-white/60'}`}>
                {step >= 3 ? 'Passed 1.5× Multiplier Gate' : 'Pending Verification'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[32px] md:text-[38px] font-bold text-white tracking-tight transition-all">
                ₹{lpa}.0
              </span>
              <span className="text-white/60 text-[13px]">LPA CTC</span>
            </div>
          </div>
        </div>

        {/* Right Column: Autonomous Policy Matrix & Live Verification (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 bg-white/5 border border-white/10 rounded-2xl p-5">
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-[10px] uppercase tracking-[0.1em]">Autonomous Policy Gate</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                <span className="text-[#cfdaf5] text-[11px] font-semibold">Deterministic Policy Engine</span>
              </div>
            </div>

            {/* Checklist of Real Policies */}
            <div className="space-y-3">
              {[
                { title: 'Rule 01: Academic Eligibility Barrier', desc: 'Min CGPA 7.5 & 0 Active Backlogs', passed: checks[0] },
                { title: 'Rule 02: 1.5× Offer Upgrade Multiplier', desc: '₹34 LPA exceeds ₹18.0 LPA gate requirement', passed: checks[1] },
                { title: 'Rule 03: Super Dream Quota Check', desc: 'Permitted max 2 Super Dream drives (Current: 1/2)', passed: checks[2] },
              ].map((rule, idx) => (
                <div
                  key={rule.title}
                  className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                    rule.passed
                      ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-white/50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className={`font-semibold text-[12px] ${rule.passed ? 'text-[#a7fccd]' : 'text-white/70'}`}>
                      {rule.title}
                    </p>
                    <p className="text-[10px] text-white/50">{rule.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {rule.passed ? (
                      <span className="flex items-center gap-1 text-[#22c55e] font-semibold text-[11px]">
                        <CheckCircle2 className="w-4 h-4" /> Passed
                      </span>
                    ) : (
                      <span className="text-white/30 text-[11px]">Evaluating...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-[11px]">Status:</span>
              <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.04em] uppercase ${
                status === 'Offer Released'
                  ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40'
                  : 'bg-[#2b59d1]/20 text-[#cfdaf5] border border-[#2b59d1]/40'
              }`}>
                ● {status}
              </span>
            </div>

            <motion.div
              animate={step === 2 ? { scale: [1, 0.96, 1] } : {}}
              className={`px-6 py-2.5 rounded-full font-semibold text-[12px] uppercase tracking-[0.06em] flex items-center gap-2 transition-all shadow-lg ${
                step >= 3
                  ? 'bg-[#22c55e] text-[#141517]'
                  : step === 2
                  ? 'bg-[#2b59d1] text-white ring-2 ring-white/30'
                  : 'bg-white/10 text-white/60 border border-white/10'
              }`}
            >
              {step >= 3 ? (
                <>
                  <Award className="w-4 h-4" /> Super Dream Dispatched
                </>
              ) : step === 2 ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Auto-Approving...
                </>
              ) : (
                'System Gate Resolving...'
              )}
            </motion.div>
          </div>

        </div>

      </div>
    </div>
  )
}
