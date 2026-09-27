'use client'

import { PolicyConfig } from '@/lib/policy-engine'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldAlert, Info, Sparkles, Star, Briefcase, Award, GraduationCap, Lock, Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface StudentMetrics {
  cgpa: number;
  activeBacklogs: number;
  totalApplications: number;
  activeApplications: number;
  globalApplications: number;
  maxGlobalApplications: number;
  dreamAttempts: number;
  superDreamAttempts: number;
  totalOffers: number;
  highestOfferCTC: number;
  policyCounters: {
    non_participation: number;
    no_shows: number;
    withdrawals: number;
    post_shortlist_withdrawals: number;
    disciplinary: number;
    integrity: number;
    offer_rejections: number;
    upgrades_used: number;
  };
}

interface StudentPoliciesViewerProps {
  config: PolicyConfig
  studentMetrics: StudentMetrics
}

function PolicySectionViewer({
  title,
  description,
  tooltip,
  config,
  currentCount,
  maxAllowed,
  disabled = false,
  isPenalty = true,
}: {
  title: string
  description: string
  tooltip: string
  config: any
  currentCount?: number
  maxAllowed?: number | null
  disabled?: boolean
  isPenalty?: boolean
}) {
  const isEnabled = config?.enabled || false;
  
  let percentage = 0;
  if (maxAllowed && maxAllowed > 0 && currentCount !== undefined) {
    percentage = Math.min(100, Math.round((currentCount / maxAllowed) * 100));
  }

  // Visual cues based on quota usage (only if enabled)
  let statusColor = "bg-zinc-200 dark:bg-zinc-800";
  let statusText = "text-zinc-600 dark:text-zinc-400";
  
  if (isEnabled && maxAllowed) {
    if (isPenalty) {
      if (percentage >= 100) {
        statusColor = "bg-red-500";
        statusText = "text-red-600 dark:text-red-400 font-semibold";
      } else if (percentage >= 50) {
        statusColor = "bg-amber-500";
        statusText = "text-amber-600 dark:text-amber-400";
      } else {
        statusColor = "bg-emerald-500";
        statusText = "text-emerald-600 dark:text-emerald-400";
      }
    } else {
      // For quotas, hitting 100% isn't "bad", just maxed out (like dream attempts)
      if (percentage >= 100) {
        statusColor = "bg-blue-500";
        statusText = "text-blue-600 dark:text-blue-400 font-semibold";
      } else if (percentage >= 80) {
        statusColor = "bg-emerald-500";
        statusText = "text-emerald-600 dark:text-emerald-400";
      } else {
        statusColor = "bg-emerald-400";
        statusText = "text-emerald-500 dark:text-emerald-400";
      }
    }
  }

  return (
    <Card className={disabled || !isEnabled ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            {title}
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div>
          {isEnabled ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
          ) : (
            <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200">Disabled</Badge>
          )}
        </div>
      </CardHeader>
      
      {isEnabled && (
        <CardContent>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {isPenalty ? 'Current Strikes' : 'Current Usage'}
              </span>
              <span className={`text-sm ${statusText}`}>
                {currentCount !== undefined ? currentCount : 0} {maxAllowed ? `/ ${maxAllowed}` : '(No Limit Set)'}
              </span>
            </div>
            
            {maxAllowed ? (
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 ease-in-out ${statusColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            ) : null}
            
            {/* If minimum CTC multiplier exists */}
            {config?.min_multiplier && (
              <p className="text-xs text-zinc-500 mt-3">
                <strong>Min Multiplier Required:</strong> {config.min_multiplier}x your current CTC.
              </p>
            )}
            
            {/* If minimum CTC cutoff exists */}
            {config?.min_ctc && (
              <p className="text-xs text-zinc-500 mt-3">
                <strong>CTC Cutoff:</strong> ,{config.min_ctc} LPA
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export function StudentPoliciesViewer({ config, studentMetrics }: StudentPoliciesViewerProps) {
  return (
    <TooltipProvider>
      <div className="space-y-10 pb-12">
        
        {/* Header summary bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Live Policy Evaluation</h3>
              <p className="text-sm text-zinc-500">Your profile is automatically evaluated against these rules when you apply.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Active Applications</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{studentMetrics.activeApplications}</p>
            </div>
            <div className="w-px bg-zinc-200 dark:bg-zinc-700"></div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Current Offers</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{studentMetrics.totalOffers}</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Drive Limits & Opportunity Tiers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              Institutional Governance
            </Badge>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Drive Limits & Opportunity Tiers
            </h3>
          </div>
          <p className="text-sm text-zinc-500">
            Application quotas, placement locking, and college-defined Dream / Super Dream CTC thresholds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <PolicySectionViewer
              title="1-Offer Policy & Placement Lock"
              description="Enforce the 1-student 1-job rule upon verified offer approval."
              tooltip="Once a student receives an approved job offer, the policy locks them from applying to standard campus drives. Upgrades require matching Dream or Super Dream criteria."
              config={config.offer_limit}
              currentCount={studentMetrics.totalOffers}
              maxAllowed={config.offer_limit?.max_offers_total ?? 1}
              isPenalty={false}
            />

            <PolicySectionViewer
              title="Application Limits & Quotas"
              description="Cap concurrent active applications and total applications per season."
              tooltip="Prevents students from spamming all open drives simultaneously and ensures fair interview distribution."
              config={config.application_limit}
              currentCount={studentMetrics.activeApplications}
              maxAllowed={config.application_limit?.max_active}
              isPenalty={false}
            />

            <PolicySectionViewer
              title="Dream Company Policy"
              description="Custom CTC cutoff for high-value drives that placed students can upgrade to."
              tooltip="Colleges hold 100% control over this threshold. Placed students holding standard offers are permitted to apply to drives offering at or above this CTC."
              config={config.dream}
              currentCount={studentMetrics.dreamAttempts}
              maxAllowed={config.dream?.max_dream_attempts}
              isPenalty={false}
            />

            <PolicySectionViewer
              title="Super Dream Company Policy"
              description="Custom CTC cutoff for premium tier placement drives."
              tooltip="Colleges define their own Super Dream cutoff for elite packages. Placed students can participate up to the attempt limit."
              config={config.super_dream}
              currentCount={studentMetrics.superDreamAttempts}
              maxAllowed={config.super_dream?.max_attempts}
              isPenalty={false}
            />
          </div>
        </div>

        {/* SECTION 2: Conduct & Penalty Policies */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b">
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
              Conduct & Compliance
            </Badge>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Student Conduct & Strike Tolerances
            </h3>
          </div>
          <p className="text-sm text-zinc-500">
            Automated penalties, strike limits, and blacklist thresholds for candidate infractions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <PolicySectionViewer
              title="Registration & Eligibility (Non-Participation)"
              description="Penalize students who are eligible for a job but fail to apply."
              tooltip="If a student is eligible but consistently ignores job postings without providing a valid reason, they receive a strike."
              config={config.non_participation}
              currentCount={studentMetrics.policyCounters.non_participation}
              maxAllowed={config.non_participation?.max_allowed}
            />
            
            <PolicySectionViewer
              title="No-Show (Mid-Process)"
              description="Penalize students who ghost interviews or assessments."
              tooltip="Students who confirm their attendance for an interview or test but do not show up will be penalized. Excused absences handled by admin don't count."
              config={config.no_show}
              currentCount={studentMetrics.policyCounters.no_shows}
              maxAllowed={config.no_show?.max_allowed}
            />

            <PolicySectionViewer
              title="Application Withdrawal (Mid-Process)"
              description="Penalize early-stage process dropouts."
              tooltip="If a student withdraws their application after it has been reviewed but before they are shortlisted, this policy logs a penalty."
              config={config.withdrawal}
              currentCount={studentMetrics.policyCounters.withdrawals}
              maxAllowed={config.withdrawal?.max_allowed}
            />

            <PolicySectionViewer
              title="Post-Shortlist Withdrawal (Critical Dropout)"
              description="Heavily penalize withdrawing after taking a valuable shortlist slot."
              tooltip="Withdrawing after being shortlisted means another student missed out on that slot. This usually has a very low tolerance."
              config={config.post_shortlist_withdrawal}
              currentCount={studentMetrics.policyCounters.post_shortlist_withdrawals}
              maxAllowed={config.post_shortlist_withdrawal?.max_allowed}
            />

            <PolicySectionViewer
              title="Disciplinary Strikes (Misconduct)"
              description="Penalize unprofessional behavior during the process."
              tooltip="For cases like unprofessional emails, bad behavior during an interview, or not following company instructions."
              config={config.disciplinary}
              currentCount={studentMetrics.policyCounters.disciplinary}
              maxAllowed={config.disciplinary?.max_allowed}
            />

            <PolicySectionViewer
              title="Integrity Strikes (Data Fraud)"
              description="Instant blacklisting for fake resumes or fraudulent data."
              tooltip="Any case of faking GPA, certifications, or cheating on tests. Usually, setting Max Allowed Limit to 1 means instant blacklisting on the first offense."
              config={config.integrity}
              currentCount={studentMetrics.policyCounters.integrity}
              maxAllowed={config.integrity?.max_allowed}
            />

            <PolicySectionViewer
              title="Offer Rejection (Post-Hire Decline)"
              description="Penalize rejecting a final job offer."
              tooltip="When a student goes through the entire process, receives an offer, and then rejects it, causing damage to the college's relationship with the company."
              config={config.offer_rejection}
              currentCount={studentMetrics.policyCounters.offer_rejections}
              maxAllowed={config.offer_rejection?.max_allowed}
            />

            <PolicySectionViewer
              title="Offer Upgrade Policy (Multi-Offer Multiplier)"
              description="Allow placed students to apply for better opportunities."
              tooltip="Controls if a placed student can apply for another job. You can configure a Minimum CTC Multiplier (e.g. 1.5x) meaning they can only apply to jobs offering at least 50% more than their current offer."
              config={config.upgrade}
              currentCount={studentMetrics.policyCounters.upgrades_used}
              maxAllowed={config.upgrade?.max_allowed}
            />
          </div>
        </div>

      </div>
    </TooltipProvider>
  )
}
