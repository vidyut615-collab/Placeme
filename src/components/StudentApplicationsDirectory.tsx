'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Calendar,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Ban,
  FileCheck2,
  ExternalLink,
  Info,
  ChevronRight,
  Briefcase
} from 'lucide-react'
import { LinearStatusDot } from '@/components/ui/linear/LinearStatusDot'
import { LinearDrawer } from '@/components/ui/linear/LinearDrawer'
import { TactileButton } from '@/components/ui/tactile/TactileButton'
import { WithdrawButton } from '@/components/WithdrawButton'
import { formatDate } from '@/lib/utils'

interface ApplicationItem {
  id: string
  job_id: string
  status: string
  dropped_reason: string | null
  created_at: string
  jobs?: {
    title: string
    company_name: string
    compensation_ctc: number | string | null
    college_id: string | null
    status: string
    custom_stages?: Record<string, string> | null
    cancellation_reason?: string | null
    cancelled_at?: string | null
  } | null
}

interface StudentApplicationsDirectoryProps {
  initialApplications: ApplicationItem[]
}

const formatStudentDropReason = (reason: string | null) => {
  if (!reason) return 'Application dropped / process concluded'
  const map: Record<string, string> = {
    non_participation: 'Non-Participation Penalty (Eligible candidate did not submit application)',
    excused_absence: 'Excused Non-Applicant (Approved by Placement Cell — No Strike)',
    student_withdrew: 'Withdrew Mid-Process (Candidate Opted Out)',
    student_withdrew_post_shortlist: 'Withdrew Post-Shortlist (Placement Strike Warning)',
    did_not_qualify: 'Did Not Qualify Assessment Round',
    no_show: 'No-Show at Scheduled Drive / Interview',
    unprofessional_conduct: 'Unprofessional Conduct Report',
    data_fraud: 'Discrepancy / Data Verification Failure',
    revoked_by_company: 'Role Cancelled / Revoked by Corporate Partner'
  }
  return map[reason] || reason
}

const STAGES_PIPELINE = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'stage1', label: 'Round 1' },
  { key: 'stage2', label: 'Round 2' },
  { key: 'stage3', label: 'Round 3' },
  { key: 'interviewing', label: 'Interview' },
  { key: 'offered', label: 'Offer' },
  { key: 'hired', label: 'Placed' }
]

export function StudentApplicationsDirectory({ initialApplications }: StudentApplicationsDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'interview' | 'offered' | 'closed'>('all')
  const [activeApp, setActiveApp] = useState<ApplicationItem | null>(null)

  const counts = useMemo(() => {
    let active = 0
    let interview = 0
    let offered = 0
    let closed = 0

    initialApplications.forEach(app => {
      const s = app.status?.toLowerCase() || ''
      if (['offered', 'hired', 'selected'].includes(s)) offered++
      else if (['interviewing', 'stage1', 'stage2', 'stage3'].includes(s)) interview++
      else if (['closed', 'dropped', 'cancelled'].includes(s)) closed++
      else active++
    })

    return {
      all: initialApplications.length,
      active: active + interview,
      interview,
      offered,
      closed
    }
  }, [initialApplications])

  const filteredApps = useMemo(() => {
    return initialApplications.filter(app => {
      const company = (app.jobs?.company_name || '').toLowerCase()
      const title = (app.jobs?.title || '').toLowerCase()
      const query = searchQuery.toLowerCase().trim()

      const matchesSearch = query === '' || company.includes(query) || title.includes(query)
      if (!matchesSearch) return false

      const s = app.status?.toLowerCase() || ''
      if (selectedFilter === 'all') return true
      if (selectedFilter === 'active') {
        return ['applied', 'shortlisted'].includes(s)
      }
      if (selectedFilter === 'interview') {
        return ['interviewing', 'stage1', 'stage2', 'stage3'].includes(s)
      }
      if (selectedFilter === 'offered') {
        return ['offered', 'hired', 'selected'].includes(s)
      }
      if (selectedFilter === 'closed') {
        return ['closed', 'dropped', 'cancelled'].includes(s)
      }
      return true
    })
  }, [initialApplications, searchQuery, selectedFilter])

  const getStageIndex = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'applied') return 0
    if (s === 'shortlisted') return 1
    if (s === 'stage1') return 2
    if (s === 'stage2') return 3
    if (s === 'stage3') return 4
    if (s === 'interviewing') return 5
    if (s === 'selected' || s === 'offered') return 6
    if (s === 'hired') return 7
    return -1
  }

  const getCustomLabel = (app: ApplicationItem) => {
    if (app.status === 'stage1') {
      return app.jobs?.custom_stages?.stage_1 || app.jobs?.custom_stages?.stage_1_label || 'Round 1 (Stage 1)'
    }
    if (app.status === 'stage2') {
      return app.jobs?.custom_stages?.stage_2 || app.jobs?.custom_stages?.stage_2_label || 'Round 2 (Stage 2)'
    }
    if (app.status === 'stage3') {
      return app.jobs?.custom_stages?.stage_3 || app.jobs?.custom_stages?.stage_3_label || 'Round 3 (Stage 3)'
    }
    return undefined
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/60 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Filter by company, role title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-700 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'active', label: 'Screening', count: counts.active },
            { id: 'interview', label: 'Rounds', count: counts.interview },
            { id: 'offered', label: 'Offers', count: counts.offered },
            { id: 'closed', label: 'Archived', count: counts.closed }
          ].map(tab => {
            const isActive = selectedFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900' : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Applications List */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/40 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden shadow-xs">
        {filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Briefcase className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">No applications found</p>
              <p className="text-xs text-zinc-500">
                {searchQuery ? 'Try matching another company name or role' : 'You have not submitted applications under this view'}
              </p>
            </div>
          </div>
        ) : (
          filteredApps.map((app) => {
            const customLabel = getCustomLabel(app)

            return (
              <motion.div
                key={app.id}
                onClick={() => setActiveApp(app)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-4 sm:py-3 gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition select-none"
              >
                {/* Left: Company & Role */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-300 font-semibold text-xs group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition flex-shrink-0">
                    {(app.jobs?.company_name?.[0] || 'C').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition">
                        {app.jobs?.company_name || 'Organization'}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-600 text-xs">•</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                        {app.jobs?.title || 'Job Opening'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                      <span className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-400 font-medium">
                        ₹{app.jobs?.compensation_ctc ? `${app.jobs.compensation_ctc} LPA` : 'Disclosed on selection'}
                      </span>
                      <span>•</span>
                      <span>{app.jobs?.college_id ? 'Campus Exclusive' : 'Global Drive'}</span>
                      <span>•</span>
                      <span className="text-zinc-400 dark:text-zinc-500" suppressHydrationWarning>
                        Applied {formatDate(app.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto">
                  <LinearStatusDot status={app.status} labelOverride={customLabel} />

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {app.status === 'cancelled' ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-2 py-0.5 rounded">
                        Quota Safe
                      </span>
                    ) : app.status === 'dropped' ? (
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded">
                        Concluded
                      </span>
                    ) : (
                      <WithdrawButton applicationId={app.id} status={app.status} />
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Slide-over Inspector Drawer */}
      <LinearDrawer
        isOpen={!!activeApp}
        onClose={() => setActiveApp(null)}
        title={activeApp?.jobs?.company_name || 'Application Overview'}
        description={`Application ID: ${activeApp?.id.slice(0, 8)}...`}
        width="w-full sm:max-w-lg"
      >
        {activeApp && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {activeApp.jobs?.title || 'Software Engineer'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{activeApp.jobs?.company_name}</p>
                </div>
                <LinearStatusDot status={activeApp.status} labelOverride={getCustomLabel(activeApp)} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Annual CTC</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{activeApp.jobs?.compensation_ctc ? `${activeApp.jobs.compensation_ctc} LPA` : 'Open'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Applied On</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-mono" suppressHydrationWarning>
                    {formatDate(activeApp.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lifecycle Conveyor Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 uppercase tracking-wider font-mono">
                  Recruitment Pipeline
                </h4>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Stage {Math.max(1, getStageIndex(activeApp.status) + 1)} of {STAGES_PIPELINE.length}
                </span>
              </div>

              {/* Step Conveyor */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-200 dark:before:bg-zinc-800">
                {STAGES_PIPELINE.map((stage, idx) => {
                  const currentIdx = getStageIndex(activeApp.status)
                  const isPassed = currentIdx > idx
                  const isCurrent = currentIdx === idx
                  const isTerminalOut = ['dropped', 'cancelled', 'closed'].includes(activeApp.status.toLowerCase())

                  let displayLabel = stage.label
                  if (stage.key === 'stage1' && (activeApp.jobs?.custom_stages?.stage_1 || activeApp.jobs?.custom_stages?.stage_1_label)) {
                    displayLabel = activeApp.jobs.custom_stages.stage_1 || activeApp.jobs.custom_stages.stage_1_label
                  } else if (stage.key === 'stage2' && (activeApp.jobs?.custom_stages?.stage_2 || activeApp.jobs?.custom_stages?.stage_2_label)) {
                    displayLabel = activeApp.jobs.custom_stages.stage_2 || activeApp.jobs.custom_stages.stage_2_label
                  } else if (stage.key === 'stage3' && (activeApp.jobs?.custom_stages?.stage_3 || activeApp.jobs?.custom_stages?.stage_3_label)) {
                    displayLabel = activeApp.jobs.custom_stages.stage_3 || activeApp.jobs.custom_stages.stage_3_label
                  }

                  return (
                    <div key={stage.key} className="relative flex items-center justify-between group">
                      {/* Step Indicator Dot */}
                      <div
                        className={`absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          isPassed
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-500 dark:text-emerald-400'
                            : isCurrent
                            ? isTerminalOut
                              ? 'bg-rose-50 border-rose-500 text-rose-600 dark:bg-rose-950 dark:border-rose-500 dark:text-rose-400'
                              : 'bg-purple-50 border-purple-500 text-purple-600 dark:bg-indigo-950 dark:border-indigo-500 dark:text-indigo-400 ring-2 ring-purple-500/20'
                            : 'bg-zinc-100 border-zinc-300 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-600'
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                        ) : (
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCurrent ? (isTerminalOut ? 'bg-rose-500' : 'bg-purple-600 dark:bg-indigo-400') : 'bg-transparent'
                            }`}
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <span
                          className={`text-xs font-medium block ${
                            isCurrent
                              ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                              : isPassed
                              ? 'text-zinc-700 dark:text-zinc-300'
                              : 'text-zinc-400 dark:text-zinc-600'
                          }`}
                        >
                          {displayLabel}
                        </span>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          Active Phase
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Special Notification / Warning Boxes */}
            {activeApp.status === 'cancelled' && (
              <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                  <Ban className="w-4 h-4 stroke-[1.5]" />
                  <span>Drive Cancelled by Placement Cell</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Reason: {activeApp.jobs?.cancellation_reason || 'Administrative reschedule by corporate partner'}
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-mono mt-1 font-semibold">
                  ✓ Placement quota preserved. 0 strike penalty accrued.
                </p>
              </div>
            )}

            {activeApp.status === 'dropped' && (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                  <Info className="w-4 h-4 stroke-[1.5]" />
                  <span>Concluded / Drop Attribution</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                  {formatStudentDropReason(activeApp.dropped_reason)}
                </p>
              </div>
            )}

            {/* Action Buttons in Drawer */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <TactileButton
                variant="outline"
                size="sm"
                onClick={() => setActiveApp(null)}
                className="w-full text-xs"
              >
                Close Inspector
              </TactileButton>

              {!['dropped', 'hired', 'forfeited', 'cancelled', 'closed'].includes(activeApp.status.toLowerCase()) && (
                <div className="w-full">
                  <WithdrawButton applicationId={activeApp.id} status={activeApp.status} />
                </div>
              )}
            </div>
          </div>
        )}
      </LinearDrawer>
    </div>
  )
}
