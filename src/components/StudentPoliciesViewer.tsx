'use client'

import React, { useState } from 'react'
import { PolicyConfig } from '@/lib/policy-engine'
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Star, 
  Briefcase, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Calculator, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface StudentMetrics {
  isBlacklisted?: boolean
  cgpa: number
  activeBacklogs: number
  totalApplications: number
  activeApplications: number
  globalApplications: number
  maxGlobalApplications: number
  applicationsToday?: number
  applicationsThisWeek?: number
  dreamAttempts: number
  superDreamAttempts: number
  totalOffers: number
  highestOfferCTC: number
  policyCounters: {
    non_participation: number
    no_shows: number
    withdrawals: number
    post_shortlist_withdrawals: number
    disciplinary: number
    integrity: number
    offer_rejections: number
    upgrades_used: number
  }
}

interface StudentPoliciesViewerProps {
  config: PolicyConfig
  studentMetrics: StudentMetrics
}

function HighlightedProgressBar({
  current,
  max,
  variant = 'teal',
  className = '',
}: {
  current: number
  max: number | null | undefined
  variant?: 'teal' | 'amber' | 'emerald' | 'blue'
  className?: string
}) {
  if (!max || max <= 0) return null

  const percentage = Math.min(100, Math.round((current / max) * 100))
  const displayWidth = current > 0 ? Math.max(6, percentage) : 0

  const variantStyles = {
    teal: {
      track: 'bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]',
      fill: 'bg-gradient-to-r from-[#0F766E] to-[#10B981]',
    },
    emerald: {
      track: 'bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]',
      fill: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    },
    amber: {
      track: 'bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]',
      fill: 'bg-gradient-to-r from-amber-500 to-orange-500',
    },
    blue: {
      track: 'bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]',
      fill: 'bg-gradient-to-r from-sky-500 to-blue-600',
    },
  }

  const selected = variantStyles[variant] || variantStyles.teal

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full h-2 rounded-full p-0.5 overflow-hidden', selected.track)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', selected.fill)}
          style={{ width: `${displayWidth}%` }}
        />
      </div>
    </div>
  )
}

export function StudentPoliciesViewer({ config, studentMetrics }: StudentPoliciesViewerProps) {
  // Extract college-specific policy settings
  const upgradeEnabled = Boolean(config?.upgrade?.enabled)
  const rawMultiplier = (config?.upgrade as Record<string, unknown>)?.min_multiplier
  const upgradeMultiplier =
    typeof rawMultiplier === 'number' && rawMultiplier > 0
      ? rawMultiplier
      : typeof rawMultiplier === 'string' && parseFloat(rawMultiplier) > 0
      ? parseFloat(rawMultiplier)
      : 1.5

  const dreamEnabled = Boolean(config?.dream?.enabled)
  const dreamMinCTC = Number(config?.dream?.min_ctc) || 10
  const maxDreamAttempts = config?.dream?.max_dream_attempts ?? null

  const superDreamEnabled = Boolean(config?.super_dream?.enabled)
  const superDreamMinCTC = Number(config?.super_dream?.min_ctc) || 20
  const maxSuperDreamAttempts = config?.super_dream?.max_attempts ?? null

  const maxActiveApps = config?.application_limit?.max_active ?? null
  const oneOfferPolicyEnabled = Boolean(config?.offer_limit?.enabled)

  // Disciplinary strikes tally
  const totalConductStrikes = 
    (studentMetrics.policyCounters.non_participation || 0) +
    (studentMetrics.policyCounters.no_shows || 0) +
    (studentMetrics.policyCounters.withdrawals || 0) +
    (studentMetrics.policyCounters.post_shortlist_withdrawals || 0) +
    (studentMetrics.policyCounters.disciplinary || 0) +
    (studentMetrics.policyCounters.integrity || 0) +
    (studentMetrics.policyCounters.offer_rejections || 0)

  // Simulator Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const activeBase = studentMetrics.highestOfferCTC > 0 ? studentMetrics.highestOfferCTC : 6.0
  const [simBaseOffer, setSimBaseOffer] = useState<number>(activeBase)
  const [simTargetCTC, setSimTargetCTC] = useState<number>(
    Math.round(activeBase * upgradeMultiplier * 10) / 10
  )

  // Mathematical Evaluation
  const hasBaseOffer = simBaseOffer > 0
  const isStrictlyHigher = simTargetCTC > simBaseOffer
  const requiredGateCTC = Math.round(simBaseOffer * upgradeMultiplier * 100) / 100

  // Pathway 1: Multiplier Rule
  const meetsMultiplier = upgradeEnabled && hasBaseOffer && isStrictlyHigher && simTargetCTC >= requiredGateCTC

  // Pathway 2: Dream Company Tier
  const meetsDream = dreamEnabled && dreamMinCTC > 0 && isStrictlyHigher && simTargetCTC >= dreamMinCTC

  // Pathway 3: Super Dream Elite Tier
  const meetsSuperDream = superDreamEnabled && superDreamMinCTC > 0 && isStrictlyHigher && simTargetCTC >= superDreamMinCTC

  // Overall Verdict State
  let isSimulationUnlocked = false
  let verdictTitle = ''
  let verdictBadge = ''
  let verdictBadgeClass = ''
  let verdictExplanation = ''

  if (!hasBaseOffer) {
    isSimulationUnlocked = true
    verdictTitle = 'Open Application · Unlocked'
    verdictBadge = 'First Offer Gate'
    verdictBadgeClass = 'bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20 dark:bg-[#14B8A6]/15 dark:text-[#14B8A6]'
    verdictExplanation = 'You do not hold an active offer in this simulation. Standard campus drives, Dream, and Super Dream opportunities are fully accessible with zero multiplier barriers.'
  } else if (!isStrictlyHigher) {
    isSimulationUnlocked = false
    verdictTitle = 'Application Blocked · Lateral / Downgrade'
    verdictBadge = 'Blocked (≤ Holding)'
    verdictBadgeClass = 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400'
    verdictExplanation = `Placement governance strictly prohibits lateral moves or downgrades. Target CTC (₹${simTargetCTC} LPA) must be strictly greater than your existing holding (₹${simBaseOffer} LPA).`
  } else if (meetsSuperDream) {
    isSimulationUnlocked = true
    verdictTitle = 'Application Unlocked · Super Dream Tier'
    verdictBadge = 'Super Dream Cleared'
    verdictBadgeClass = 'bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20 dark:bg-[#14B8A6]/15 dark:text-[#14B8A6]'
    verdictExplanation = `Target package (₹${simTargetCTC} LPA) qualifies as an elite Super Dream opportunity (cutoff: ≥ ₹${superDreamMinCTC} LPA). Super Dream drives bypass standard campus placement locks.`
  } else if (meetsDream) {
    isSimulationUnlocked = true
    verdictTitle = 'Application Unlocked · Dream Tier'
    verdictBadge = 'Dream Tier Cleared'
    verdictBadgeClass = 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
    verdictExplanation = `Target package (₹${simTargetCTC} LPA) meets or exceeds your institution's Dream cutoff (cutoff: ≥ ₹${dreamMinCTC} LPA), unlocking placement application eligibility.`
  } else if (meetsMultiplier) {
    isSimulationUnlocked = true
    verdictTitle = `Application Unlocked · ${upgradeMultiplier}× Gate Cleared`
    verdictBadge = `${upgradeMultiplier}× Multiplier Cleared`
    verdictBadgeClass = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400'
    verdictExplanation = `Target package (₹${simTargetCTC} LPA) satisfies your college's ${upgradeMultiplier}× multiplier requirement (Required Floor: ≥ ₹${requiredGateCTC.toFixed(2)} LPA based on ₹${simBaseOffer} LPA holding).`
  } else if (!upgradeEnabled) {
    isSimulationUnlocked = false
    verdictTitle = 'Application Blocked · Multiplier Upgrade Disabled'
    verdictBadge = 'Upgrade Disabled'
    verdictBadgeClass = 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400'
    verdictExplanation = `Your institution has not enabled multiplier-based upgrades. Placed candidates can only apply to drives meeting Dream (≥ ₹${dreamMinCTC} LPA) or Super Dream (≥ ₹${superDreamMinCTC} LPA) thresholds.`
  } else {
    isSimulationUnlocked = false
    verdictTitle = `Application Blocked · Below ${upgradeMultiplier}× Gate`
    verdictBadge = 'Below Gate'
    verdictBadgeClass = 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400'
    const deficit = (requiredGateCTC - simTargetCTC).toFixed(2)
    verdictExplanation = `Target package (₹${simTargetCTC} LPA) does not satisfy the college's ${upgradeMultiplier}× multiplier gate. A minimum of ₹${requiredGateCTC.toFixed(2)} LPA is required (shortfall: ₹${deficit} LPA).`
  }

  return (
    <TooltipProvider>
      <div className="space-y-10 pb-16">
        
        {/* ============================================================
            ZONE 0: STANDING & CAPACITY EXECUTIVE CONSOLE
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Standing Health */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#78716C] dark:text-[#8A847A]">
              <span className="font-medium">Institutional Standing</span>
              {studentMetrics.isBlacklisted ? (
                <ShieldAlert className="w-4 h-4 text-rose-500 stroke-[1.5]" />
              ) : totalConductStrikes > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[1.5]" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500 stroke-[1.5]" />
              )}
            </div>
            <div>
              <div className="text-lg font-medium tracking-tight text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-2">
                {studentMetrics.isBlacklisted ? (
                  <span className="text-rose-600 dark:text-rose-400">Debarred</span>
                ) : totalConductStrikes > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">{totalConductStrikes} Strike(s)</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">Good Standing</span>
                )}
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                {studentMetrics.isBlacklisted
                  ? 'Access restricted by institutional governance.'
                  : totalConductStrikes > 0
                  ? 'Infractions logged. Review strike tolerance below.'
                  : 'Zero policy strikes logged this cycle.'}
              </p>
            </div>
          </div>

          {/* Card 2: Active Application Capacity */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#78716C] dark:text-[#8A847A]">
              <span className="font-medium">Active Applications</span>
              <Briefcase className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-medium font-mono tracking-tight text-[#1C1917] dark:text-[#EFECE6]">
                    {studentMetrics.activeApplications}
                  </span>
                  <span className="text-xs text-[#78716C] dark:text-[#8A847A] font-mono">
                    {maxActiveApps ? `/ ${maxActiveApps} Max` : '/ Unlimited'}
                  </span>
                </div>
                {maxActiveApps && (
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20">
                    {Math.round((studentMetrics.activeApplications / maxActiveApps) * 100)}%
                  </span>
                )}
              </div>
              {maxActiveApps && (
                <HighlightedProgressBar
                  current={studentMetrics.activeApplications}
                  max={maxActiveApps}
                  variant="teal"
                  className="mt-2"
                />
              )}
              <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-1.5">
                {maxActiveApps
                  ? `${Math.max(0, maxActiveApps - studentMetrics.activeApplications)} concurrent slot(s) currently free.`
                  : 'No concurrent limit configured.'}
              </p>
            </div>
          </div>

          {/* Card 3: Placement Offer Status */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#78716C] dark:text-[#8A847A]">
              <span className="font-medium">Placement Status</span>
              <Award className="w-4 h-4 text-[#10B981] stroke-[1.5]" />
            </div>
            <div>
              <div className="text-lg font-medium tracking-tight text-[#1C1917] dark:text-[#EFECE6]">
                {studentMetrics.totalOffers > 0 ? (
                  <span className="text-[#0F766E] dark:text-[#14B8A6]">
                    Placed · ₹{studentMetrics.highestOfferCTC} LPA
                  </span>
                ) : (
                  <span className="text-[#57534E] dark:text-[#ACA59A]">Seeking Placement</span>
                )}
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                {studentMetrics.totalOffers > 0
                  ? `Offer upgrade gate active (requires ≥ ₹${(studentMetrics.highestOfferCTC * upgradeMultiplier).toFixed(2)} LPA).`
                  : '1-offer policy active upon first offer confirmation.'}
              </p>
            </div>
          </div>

          {/* Card 4: High-Tier Attempts */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#78716C] dark:text-[#8A847A]">
              <span className="font-medium">Dream &amp; Super Dream</span>
              <Sparkles className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-between">
                  <span>Dream:</span>
                  <span className="font-mono text-[11px] text-[#78716C] dark:text-[#8A847A]">
                    {studentMetrics.dreamAttempts} {maxDreamAttempts ? `/ ${maxDreamAttempts} used` : 'attempts'}
                  </span>
                </div>
                {maxDreamAttempts && (
                  <HighlightedProgressBar
                    current={studentMetrics.dreamAttempts}
                    max={maxDreamAttempts}
                    variant="amber"
                    className="mt-1"
                  />
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-between">
                  <span>Super Dream:</span>
                  <span className="font-mono text-[11px] text-[#78716C] dark:text-[#8A847A]">
                    {studentMetrics.superDreamAttempts} {maxSuperDreamAttempts ? `/ ${maxSuperDreamAttempts} used` : 'attempts'}
                  </span>
                </div>
                {maxSuperDreamAttempts && (
                  <HighlightedProgressBar
                    current={studentMetrics.superDreamAttempts}
                    max={maxSuperDreamAttempts}
                    variant="teal"
                    className="mt-1"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            ZONE 1: CAREER MOBILITY & OPPORTUNITY TIERS
            ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Career Upgrades &amp; Mobility Ladder
                </h2>
                <Badge variant="outline" className="font-mono text-[10px] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  Opportunity engine
                </Badge>
              </div>
              <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-0.5">
                Review your institution&apos;s rules on offer locks, upgrade multipliers, and Dream tier opportunities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Policy 1: 1-Offer Policy & Placement Lock */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Award className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        1-Student 1-Job Policy
                      </h4>
                      <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">Tier protection &amp; cohort fairness</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono text-[10px]',
                      oneOfferPolicyEnabled
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                    )}
                  >
                    {oneOfferPolicyEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                  To guarantee equal placement access across your entire graduating batch, receiving and accepting an official offer locks your eligibility for standard campus drives. You cannot apply to parallel or lateral job postings of equivalent compensation.
                </p>
              </div>

              <div className="pt-3 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-[#78716C] dark:text-[#8A847A]">Your Current Status:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {studentMetrics.totalOffers > 0 ? (
                    <span className="text-[#0F766E] dark:text-[#14B8A6]">
                      Offer Locked ({studentMetrics.totalOffers} Offer Held)
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Unlocked (0 Offers Held)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Policy 2: Offer Upgrade Multiplier Gate (WITH SIMULATOR BUTTON) */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E] dark:text-[#14B8A6]">
                      <TrendingUp className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Offer Upgrade Multiplier Gate
                      </h4>
                      <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">Autonomous lateral dispute shield</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono text-[10px]',
                      upgradeEnabled
                        ? 'bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20 dark:bg-[#14B8A6]/15 dark:text-[#14B8A6]'
                        : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                    )}
                  >
                    {upgradeEnabled ? `${upgradeMultiplier}× Active` : 'Disabled'}
                  </Badge>
                </div>

                <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                  Placed candidates are permitted to upgrade to subsequent campus drives only if the prospective company package meets at least your institution&apos;s configured multiplier (<strong>{upgradeMultiplier}×</strong>) over your existing offer.
                </p>
              </div>

              {/* Action row with Floor Readout and Pop-up Trigger Button */}
              <div className="pt-3 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs font-mono">
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[10px] uppercase tracking-wider">Upgrade Threshold</span>
                  <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    {studentMetrics.highestOfferCTC > 0
                      ? `≥ ₹${(studentMetrics.highestOfferCTC * upgradeMultiplier).toFixed(2)} LPA Required`
                      : 'No Active Offer Anchor'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Simulate Eligibility</span>
                </button>
              </div>
            </div>

            {/* Policy 3: Dream Company Policy */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Dream Company Policy
                      </h4>
                      <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">College-designated high-value drives</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono text-[10px]',
                      dreamEnabled
                        ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
                        : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                    )}
                  >
                    {dreamEnabled ? `≥ ₹${dreamMinCTC} LPA` : 'Disabled'}
                  </Badge>
                </div>

                <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                  Visiting companies offering compensation at or above <strong>₹{dreamMinCTC} LPA</strong> qualify as Dream Opportunities. Placed candidates can participate in Dream drives without being constrained by normal campus locks, up to the attempt limit.
                </p>
              </div>

              <div className="pt-3 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-[#78716C] dark:text-[#8A847A]">Dream Attempts Used:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {studentMetrics.dreamAttempts} {maxDreamAttempts ? `/ ${maxDreamAttempts} Max` : '(Unlimited)'}
                </span>
              </div>
            </div>

            {/* Policy 4: Super Dream Company Policy */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E] dark:text-[#14B8A6]">
                      <Star className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Super Dream Elite Tier
                      </h4>
                      <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">Pinnacle institutional packages</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono text-[10px]',
                      superDreamEnabled
                        ? 'bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20 dark:bg-[#14B8A6]/15 dark:text-[#14B8A6]'
                        : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                    )}
                  >
                    {superDreamEnabled ? `≥ ₹${superDreamMinCTC} LPA` : 'Disabled'}
                  </Badge>
                </div>

                <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                  Elite packages at or above <strong>₹{superDreamMinCTC} LPA</strong> represent the pinnacle tier of placement drives. Accepting a Super Dream offer marks official conclusion of your placement cycle with institutional honors.
                </p>
              </div>

              <div className="pt-3 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-[#78716C] dark:text-[#8A847A]">Super Dream Attempts Used:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {studentMetrics.superDreamAttempts} {maxSuperDreamAttempts ? `/ ${maxSuperDreamAttempts} Max` : '(Unlimited)'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================
            ZONE 2: APPLICATION QUOTAS & VELOCITY
            ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Application Quotas &amp; Concurrency
                </h2>
                <Badge variant="outline" className="font-mono text-[10px] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  Pacing rules
                </Badge>
              </div>
              <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-0.5">
                Application pacing rules prevent interview schedule conflicts and ensure thoughtful, prepared submissions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Limit 1: Concurrent Active Applications */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Concurrent In-Flight Limit
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  {maxActiveApps ? `${maxActiveApps} Max` : 'No Cap'}
                </Badge>
              </div>
              <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Limits how many drives you can actively have in &apos;Applied&apos;, &apos;Shortlisted&apos;, or &apos;Interviewing&apos; stages simultaneously. This prevents assessment link collisions and interview overlaps.
              </p>
              {maxActiveApps && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#78716C]">
                    <span>Usage Load</span>
                    <span className="text-[#0F766E] dark:text-[#14B8A6] font-medium">
                      {Math.round((studentMetrics.activeApplications / maxActiveApps) * 100)}%
                    </span>
                  </div>
                  <HighlightedProgressBar
                    current={studentMetrics.activeApplications}
                    max={maxActiveApps}
                    variant="teal"
                  />
                </div>
              )}
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] text-xs font-mono flex justify-between items-center">
                <span className="text-[#78716C] dark:text-[#8A847A]">Current Load:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {studentMetrics.activeApplications} {maxActiveApps ? `/ ${maxActiveApps} active` : 'active'}
                </span>
              </div>
            </div>

            {/* Limit 2: Application Pacing */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Submission Velocity
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  Pacing Guard
                </Badge>
              </div>
              <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Submissions are monitored to encourage tailored resumes and role-specific preparation rather than automated carpet-bombing of open drives.
              </p>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] text-xs font-mono flex justify-between items-center">
                <span className="text-[#78716C] dark:text-[#8A847A]">Submitted Today:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {studentMetrics.applicationsToday ?? 0} application(s)
                </span>
              </div>
            </div>

            {/* Limit 3: Placeme Global Network */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Placeme Global Quota
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  Off-Campus
                </Badge>
              </div>
              <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                National off-campus job pool verified by Placeme. Campus-specific quotas do not consume institutional recruiter slots.
              </p>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-[#78716C]">
                  <span>Network Usage</span>
                  <span className="text-[#10B981] font-medium">
                    {Math.round((studentMetrics.globalApplications / (studentMetrics.maxGlobalApplications || 5)) * 100)}%
                  </span>
                </div>
                <HighlightedProgressBar
                  current={studentMetrics.globalApplications}
                  max={studentMetrics.maxGlobalApplications || 5}
                  variant="emerald"
                />
              </div>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] text-xs font-mono flex justify-between items-center">
                <span className="text-[#78716C] dark:text-[#8A847A]">Global Applied:</span>
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {studentMetrics.globalApplications} / {studentMetrics.maxGlobalApplications || 5}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================
            ZONE 3: FAIR PLAY & CONDUCT STRIKE SYSTEM
            ============================================================ */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Fair Play &amp; Code of Conduct
                </h2>
                <Badge variant="outline" className="font-mono text-[10px] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  Disciplinary system
                </Badge>
              </div>
              <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-0.5">
                Transparent rules governing interview attendance, shortlist commitments, and institutional integrity.
              </p>
            </div>
          </div>

          {/* Visual 3-Stage Escalation Stepper */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <span className="text-[11px] font-medium text-[#78716C] dark:text-[#8A847A] uppercase tracking-wider block mb-3 font-mono">
              Institutional Strike Escalation Framework
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0F766E]/10 text-[#0F766E] dark:bg-[#14B8A6]/15 dark:text-[#14B8A6] font-mono text-[11px] font-medium flex items-center justify-center">
                    1
                  </span>
                  <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">1st Infraction: Warning</span>
                </div>
                <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] leading-snug">
                  Formal notice logged in your disciplinary ledger. All open and upcoming drives remain fully accessible.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[11px] font-medium flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">2nd Infraction: 14-Day Freeze</span>
                </div>
                <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] leading-snug">
                  Temporary cooling-off freeze. Your profile cannot submit applications to new drives for 14 calendar days.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-mono text-[11px] font-medium flex items-center justify-center">
                    3
                  </span>
                  <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">3rd Infraction: Debarment</span>
                </div>
                <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] leading-snug">
                  Debarment from campus placement season. Requires formal appeal through the college placement director.
                </p>
              </div>
            </div>
          </div>

          {/* The 6 Clear Infraction Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Rule 1: No-Show */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Interview &amp; Test No-Show
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[10px]',
                    (studentMetrics.policyCounters.no_shows || 0) > 0
                      ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                  )}
                >
                  {studentMetrics.policyCounters.no_shows || 0} / {config?.no_show?.max_allowed ?? 2} strikes
                </Badge>
              </div>
              <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Ghosting an interview slot or online assessment without 24h prior approved medical or academic notice.
              </p>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-[#78716C]">Tolerance Limit:</span>
                <span className="font-mono text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {config?.no_show?.max_allowed ?? 2} Strikes Max
                </span>
              </div>
            </div>

            {/* Rule 2: Post-Shortlist Dropout */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Post-Shortlist Withdrawal
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[10px]',
                    (studentMetrics.policyCounters.post_shortlist_withdrawals || 0) > 0
                      ? 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                  )}
                >
                  {studentMetrics.policyCounters.post_shortlist_withdrawals || 0} / {config?.post_shortlist_withdrawal?.max_allowed ?? 1} strikes
                </Badge>
              </div>
              <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Withdrawing after company shortlisting deprives a waitlisted batchmate of that interview slot.
              </p>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-[#78716C]">Tolerance Limit:</span>
                <span className="font-mono text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {config?.post_shortlist_withdrawal?.max_allowed ?? 1} Strike Max
                </span>
              </div>
            </div>

            {/* Rule 3: Offer Rejection */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Post-Hire Offer Rejection
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[10px]',
                    (studentMetrics.policyCounters.offer_rejections || 0) > 0
                      ? 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                  )}
                >
                  {studentMetrics.policyCounters.offer_rejections || 0} / {config?.offer_rejection?.max_allowed ?? 1} strikes
                </Badge>
              </div>
              <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Declining a final institutional job offer after completing all hiring rounds and clearing the drive.
              </p>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-[#78716C]">Tolerance Limit:</span>
                <span className="font-mono text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {config?.offer_rejection?.max_allowed ?? 1} Strike Max
                </span>
              </div>
            </div>

            {/* Rule 4: Credential & Data Fraud */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Credential &amp; Academic Integrity
                </h4>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400"
                >
                  Zero Tolerance
                </Badge>
              </div>
              <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Falsification of CGPA, concealment of active backlogs, forged certificates, or assessment fraud results in immediate debarment.
              </p>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-[#78716C]">Consequence:</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                  Instant Debarment (1 Strike)
                </span>
              </div>
            </div>

            {/* Rule 5: Non-Participation */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Drive Non-Participation
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[10px]',
                    (studentMetrics.policyCounters.non_participation || 0) > 0
                      ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                  )}
                >
                  {studentMetrics.policyCounters.non_participation || 0} / {config?.non_participation?.max_allowed ?? 3} strikes
                </Badge>
              </div>
              <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Consistently ignoring mandatory campus recruitment drives for which you meet all criteria without exemption.
              </p>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-[#78716C]">Tolerance Limit:</span>
                <span className="font-mono text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {config?.non_participation?.max_allowed ?? 3} Warnings Max
                </span>
              </div>
            </div>

            {/* Rule 6: Early Stage Withdrawal */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shadow-[0_1px_2px_rgba(28,25,23,0.03)] space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Early Stage Withdrawal
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono text-[10px]',
                    (studentMetrics.policyCounters.withdrawals || 0) > 0
                      ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] border-[#1C1917]/[0.08]'
                  )}
                >
                  {studentMetrics.policyCounters.withdrawals || 0} / {config?.withdrawal?.max_allowed ?? 3} strikes
                </Badge>
              </div>
              <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Withdrawing an application after verification but prior to company shortlist publication.
              </p>
              <div className="pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-[#78716C]">Tolerance Limit:</span>
                <span className="font-mono text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {config?.withdrawal?.max_allowed ?? 3} Allowed
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================
            POP-UP MODAL: OFFER MULTIPLIER SIMULATOR DIALOG
            ============================================================ */}
        <Dialog open={isSimulatorOpen} onOpenChange={setIsSimulatorOpen}>
          <DialogContent className="sm:max-w-2xl md:max-w-3xl p-6 bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E] dark:text-[#14B8A6] shrink-0">
                    <Calculator className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      Offer Upgrade Eligibility Simulator
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#78716C] dark:text-[#8A847A] mt-0.5">
                      Test prospective packages against your college&apos;s active multiplier and Dream thresholds.
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                    College Multiplier: {upgradeMultiplier}× {upgradeEnabled ? 'Active' : '(Disabled)'}
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Dual Independent Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Input 1: Current Base Offer */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center justify-between">
                    <span>Current / Holding CTC (₹ LPA)</span>
                    {studentMetrics.totalOffers > 0 && (
                      <span className="text-[10px] text-[#0F766E] dark:text-[#14B8A6] font-mono">
                        Active Offer: ₹{studentMetrics.highestOfferCTC} LPA
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={simBaseOffer}
                      onChange={(e) => setSimBaseOffer(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-10 px-3 py-2 text-sm font-mono rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6] focus:outline-hidden focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-all"
                      placeholder="e.g. 6.0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-[#78716C] font-mono">LPA</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#78716C]">Presets:</span>
                    {[0, 4.5, 6.0, 10.0, 15.0].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSimBaseOffer(val)}
                        className={cn(
                          'text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer',
                          simBaseOffer === val
                            ? 'bg-[#1C1917] text-white dark:bg-[#EFECE6] dark:text-[#12110F] font-bold'
                            : 'bg-[#FAF8F5] hover:bg-[#F3EFE9] dark:bg-[#12110F] dark:hover:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]'
                        )}
                      >
                        {val === 0 ? 'No Offer' : `₹${val}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input 2: Target Prospective Drive CTC */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center justify-between">
                    <span>Prospective Company CTC (₹ LPA)</span>
                    <span className="text-[10px] text-[#78716C] font-mono">Target Drive</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="150"
                      value={simTargetCTC}
                      onChange={(e) => setSimTargetCTC(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full h-10 px-3 py-2 text-sm font-mono rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6] focus:outline-hidden focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-all"
                      placeholder="e.g. 10.0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-[#78716C] font-mono">LPA</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#78716C]">Targets:</span>
                    {[6.0, 8.0, 10.0, 15.0, 22.0].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSimTargetCTC(val)}
                        className={cn(
                          'text-[10px] font-mono px-2 py-0.5 rounded transition-colors cursor-pointer',
                          simTargetCTC === val
                            ? 'bg-[#1C1917] text-white dark:bg-[#EFECE6] dark:text-[#12110F] font-bold'
                            : 'bg-[#FAF8F5] hover:bg-[#F3EFE9] dark:bg-[#12110F] dark:hover:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]'
                        )}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Computation Verdict Card */}
              <div className={cn(
                'p-4 rounded-xl border transition-all',
                isSimulationUnlocked
                  ? 'bg-emerald-500/[0.06] dark:bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-rose-500/[0.06] dark:bg-rose-500/10 border-rose-500/20'
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg mt-0.5 shrink-0',
                      isSimulationUnlocked
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                    )}>
                      {isSimulationUnlocked ? (
                        <Unlock className="w-4 h-4 stroke-[1.5]" />
                      ) : (
                        <Lock className="w-4 h-4 stroke-[1.5]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                          {verdictTitle}
                        </span>
                        <Badge variant="outline" className={cn('text-[10px] font-mono', verdictBadgeClass)}>
                          {verdictBadge}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#57534E] dark:text-[#ACA59A] mt-1 leading-relaxed">
                        {verdictExplanation}
                      </p>
                    </div>
                  </div>

                  {/* Formula Chip */}
                  {hasBaseOffer && (
                    <div className="sm:text-right shrink-0 font-mono text-xs p-2.5 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                      <span className="text-[10px] text-[#78716C] uppercase tracking-wider block">Multiplier Formula</span>
                      <span className="text-xs text-[#1C1917] dark:text-[#EFECE6] font-medium">
                        ₹{simBaseOffer} × {upgradeMultiplier} = ₹{requiredGateCTC.toFixed(2)} LPA
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3-Pathway Institutional Rule Checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] block">
                  Detailed Institutional Gate Evaluation
                </span>

                <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06]">
                  
                  {/* Gate 1: Multiplier Gate */}
                  <div className="p-3 sm:px-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        !hasBaseOffer
                          ? 'bg-[#0F766E]/10 text-[#0F766E]'
                          : meetsMultiplier
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : !upgradeEnabled
                          ? 'bg-[#FAF8F5] text-[#78716C] dark:bg-[#12110F]'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                      )}>
                        {!hasBaseOffer || meetsMultiplier ? (
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                        ) : !upgradeEnabled ? (
                          <HelpCircle className="w-3.5 h-3.5 stroke-[2]" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 stroke-[2]" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                          {upgradeMultiplier}× Upgrade Multiplier Gate
                        </span>
                        <span className="text-[11px] text-[#78716C] font-mono">
                          {!hasBaseOffer
                            ? 'No active offer held · Gate inactive'
                            : upgradeEnabled
                            ? `Required Floor: ≥ ₹${requiredGateCTC.toFixed(2)} LPA (Target: ₹${simTargetCTC} LPA)`
                            : 'Policy disabled by college'}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      'font-mono font-medium text-[11px] px-2 py-0.5 rounded shrink-0',
                      !hasBaseOffer
                        ? 'bg-[#0F766E]/10 text-[#0F766E]'
                        : meetsMultiplier
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : !upgradeEnabled
                        ? 'bg-[#FAF8F5] text-[#78716C] dark:bg-[#12110F]'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    )}>
                      {!hasBaseOffer
                        ? 'Not Applicable'
                        : meetsMultiplier
                        ? 'Passed Gate'
                        : !upgradeEnabled
                        ? 'Disabled'
                        : simTargetCTC <= simBaseOffer
                        ? '≤ Current Offer'
                        : `-₹${(requiredGateCTC - simTargetCTC).toFixed(2)} Short`}
                    </span>
                  </div>

                  {/* Gate 2: Dream Tier */}
                  <div className="p-3 sm:px-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        !hasBaseOffer
                          ? 'bg-[#0F766E]/10 text-[#0F766E]'
                          : meetsDream
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'bg-[#FAF8F5] text-[#78716C] dark:bg-[#12110F]'
                      )}>
                        {!hasBaseOffer || meetsDream ? (
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                        ) : !dreamEnabled ? (
                          <HelpCircle className="w-3.5 h-3.5 stroke-[2]" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 stroke-[2]" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                          Dream Company Tier
                        </span>
                        <span className="text-[11px] text-[#78716C] font-mono">
                          {dreamEnabled
                            ? `Institutional Cutoff: ≥ ₹${dreamMinCTC} LPA (Target: ₹${simTargetCTC} LPA)`
                            : 'Dream policy disabled by college'}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      'font-mono font-medium text-[11px] px-2 py-0.5 rounded shrink-0',
                      !hasBaseOffer
                        ? 'bg-[#0F766E]/10 text-[#0F766E]'
                        : meetsDream
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'bg-[#FAF8F5] text-[#78716C] dark:bg-[#12110F]'
                    )}>
                      {!hasBaseOffer
                        ? 'Eligible'
                        : meetsDream
                        ? 'Bypasses Lock'
                        : !dreamEnabled
                        ? 'Disabled'
                        : simTargetCTC <= simBaseOffer
                        ? '≤ Current Offer'
                        : `-₹${(dreamMinCTC - simTargetCTC).toFixed(2)} Short`}
                    </span>
                  </div>

                  {/* Gate 3: Super Dream Tier */}
                  <div className="p-3 sm:px-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                        !hasBaseOffer
                          ? 'bg-[#0F766E]/10 text-[#0F766E]'
                          : meetsSuperDream
                          ? 'bg-[#0F766E]/15 text-[#0F766E] dark:text-[#14B8A6]'
                          : 'bg-[#FAF8F5] text-[#78716C] dark:bg-[#12110F]'
                      )}>
                        {!hasBaseOffer || meetsSuperDream ? (
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                        ) : !superDreamEnabled ? (
                          <HelpCircle className="w-3.5 h-3.5 stroke-[2]" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 stroke-[2]" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                          Super Dream Elite Tier
                        </span>
                        <span className="text-[11px] text-[#78716C] font-mono">
                          {superDreamEnabled
                            ? `Institutional Cutoff: ≥ ₹${superDreamMinCTC} LPA (Target: ₹${simTargetCTC} LPA)`
                            : 'Super Dream policy disabled by college'}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      'font-mono font-medium text-[11px] px-2 py-0.5 rounded shrink-0',
                      !hasBaseOffer
                        ? 'bg-[#0F766E]/10 text-[#0F766E]'
                        : meetsSuperDream
                        ? 'bg-[#0F766E]/10 text-[#0F766E] dark:bg-[#14B8A6]/15 dark:text-[#14B8A6]'
                        : 'bg-[#FAF8F5] text-[#78716C] dark:bg-[#12110F]'
                    )}>
                      {!hasBaseOffer
                        ? 'Eligible'
                        : meetsSuperDream
                        ? 'Pinnacle Cleared'
                        : !superDreamEnabled
                        ? 'Disabled'
                        : simTargetCTC <= simBaseOffer
                        ? '≤ Current Offer'
                        : `-₹${(superDreamMinCTC - simTargetCTC).toFixed(2)} Short`}
                    </span>
                  </div>

                </div>
              </div>

              {/* Threshold Summary Footnote */}
              <div className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[11px] text-[#78716C] dark:text-[#8A847A] flex items-center justify-between">
                <span>
                  Configured values loaded dynamically from your institution&apos;s active placement policy document.
                </span>
                <span className="font-mono text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  Multiplier: {upgradeMultiplier}×
                </span>
              </div>

              {/* Close Action */}
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#1C1917] hover:bg-[#2E2A27] dark:bg-[#EFECE6] dark:hover:bg-white text-white dark:text-[#12110F] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  )
}
