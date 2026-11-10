'use client'

import React, { useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Search,
  X,
  LayoutGrid,
  List,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { JobDetailsData } from '@/components/JobDetailsModal'
import { PaginationControls } from '@/components/PaginationControls'
import { WORKPLACE_MODES, EMPLOYMENT_TYPES } from '@/lib/cities-data'
import { formatDate } from '@/lib/utils'
import { applyForJob } from '@/app/(dashboards)/student/actions'
import {
  LinearStatusDot,
  PriorityBadge,
  LinearDrawer,
  LinearRow,
  CommandKBar,
} from '@/components/ui/linear'
import { TactileButton, TactileCard } from '@/components/ui/tactile'

interface StudentJobsDirectoryProps {
  jobs: JobDetailsData[]
  appliedJobIds: string[]
  isBlacklisted: boolean
  isPlaced: boolean
  maxCurrentCtc: number
  activeAppsCount: number
  totalAppsCount: number
  config: any
  counters: any
  accessStatus?: 'active' | 'expired' | 'unpaid'
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  searchQuery: string
  activeWorkplace: string
  activeEmployment: string
}

export function StudentJobsDirectory({
  jobs,
  appliedJobIds,
  isBlacklisted,
  isPlaced,
  maxCurrentCtc,
  activeAppsCount,
  totalAppsCount,
  config,
  counters,
  accessStatus = 'active',
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  searchQuery,
  activeWorkplace,
  activeEmployment,
}: StudentJobsDirectoryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedJob, setSelectedJob] = useState<JobDetailsData | null>(null)
  const [isApplying, startApplyTransition] = useTransition()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds])

  const upgradeConfig = config.upgrade || { enabled: false, min_multiplier: 1, max_allowed: 1 }
  const dreamConfig = config.dream || { enabled: false, min_ctc: 10, max_dream_attempts: 3 }
  const superDreamConfig = config.super_dream || { enabled: false, min_ctc: 20, max_attempts: 2 }
  const appLimitConfig = config.application_limit || { enabled: false }

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([name, value]) => {
        if (value === null || value === '' || value === 'all') {
          params.delete(name)
        } else {
          params.set(name, value)
        }
      })
      return params.toString()
    },
    [searchParams]
  )

  const handleSearchSubmit = (value: string) => {
    router.push(pathname + '?' + createQueryString({ q: value, page: '1' }))
  }

  const handleWorkplaceChange = (val: string) => {
    router.push(pathname + '?' + createQueryString({ workplace: val, page: '1' }))
  }

  const handleEmploymentChange = (val: string) => {
    router.push(pathname + '?' + createQueryString({ employment: val, page: '1' }))
  }

  const handlePageChange = (page: number) => {
    router.push(pathname + '?' + createQueryString({ page: page.toString() }))
  }

  // Calculate policy status for a job
  const getJobPolicyEvaluation = (job: JobDetailsData) => {
    const hasApplied = appliedSet.has(job.id)
    if (hasApplied) {
      return { canApply: false, reason: 'Already Applied', badge: 'Applied' }
    }
    if (isBlacklisted) {
      return { canApply: false, reason: 'Student account currently under disciplinary hold.', badge: 'Blocked' }
    }
    if (accessStatus === 'unpaid' || accessStatus === 'expired') {
      return { canApply: false, reason: 'Placement profile access is inactive or unpaid.', badge: 'Inactive' }
    }

    const ctc = Number(job.compensation_ctc || 0)

    if (isPlaced && maxCurrentCtc > 0) {
      if (upgradeConfig.enabled) {
        const requiredCtc = maxCurrentCtc * (upgradeConfig.min_multiplier || 1.5)
        if (ctc < requiredCtc) {
          return {
            canApply: false,
            reason: `Blocked by ${upgradeConfig.min_multiplier || 1.5}× Upgrade Policy. Incoming CTC (₹${ctc} LPA) must be ≥ ₹${requiredCtc.toFixed(1)} LPA.`,
            badge: 'Policy Barrier',
          }
        }
      }
    }

    if (appLimitConfig.enabled && appLimitConfig.max_total && totalAppsCount >= appLimitConfig.max_total) {
      return { canApply: false, reason: `Maximum application limit (${appLimitConfig.max_total}) reached.`, badge: 'Limit Reached' }
    }

    return { canApply: true, reason: null, badge: 'Eligible' }
  }

  const handleApply = (jobId: string) => {
    startApplyTransition(async () => {
      const res = await applyForJob(jobId)
      if (res?.error) {
        alert(res.error)
      } else {
        appliedSet.add(jobId)
        if (selectedJob?.id === jobId) {
          setSelectedJob(null)
        }
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* ── 1. Linear Header & Command Filter Capsule ── */}
      <div className="flex flex-col gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#242424] dark:text-white tracking-tight">
              Verified Placement Drives
            </h1>
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Active visiting campus recruitments and network-wide consortium opportunities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Filter Capsule Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Search Input */}
          <div className="flex-1 min-w-[240px]">
            <CommandKBar
              value={localSearch}
              onChange={(val) => {
                setLocalSearch(val)
                handleSearchSubmit(val)
              }}
              placeholder="Filter by company, role, or skill keywords..."
            />
          </div>

          {/* Workplace Mode Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['all', ...WORKPLACE_MODES].map((mode) => {
              const isSelected = activeWorkplace === mode || (mode === 'all' && !activeWorkplace)
              return (
                <button
                  key={mode}
                  onClick={() => handleWorkplaceChange(mode)}
                  className={`px-3 py-1.5 rounded-full font-mono text-xs transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {mode === 'all' ? 'All Modes' : mode}
                </button>
              )
            })}
          </div>

          {/* Employment Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['all', ...EMPLOYMENT_TYPES].map((emp) => {
              const isSelected = activeEmployment === emp || (emp === 'all' && !activeEmployment)
              return (
                <button
                  key={emp}
                  onClick={() => handleEmploymentChange(emp)}
                  className={`px-3 py-1.5 rounded-full font-mono text-xs transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-2xs'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {emp === 'all' ? 'All Types' : emp}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Jobs Main Canvas (List or Grid) ── */}
      {jobs.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <Briefcase className="w-10 h-10 stroke-[1.5] text-zinc-400 mx-auto mb-3" />
          <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
            No matching drives found
          </h3>
          <p className="font-mono text-xs text-zinc-500 mt-1">
            Try adjusting your workplace filters, employment types, or search keywords.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* Linear High-Density List */
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {jobs.map((job) => {
            const hasApplied = appliedSet.has(job.id)
            const evaluation = getJobPolicyEvaluation(job)
            const ctc = Number(job.compensation_ctc || 0)
            const isSuperDream = ctc >= 20
            const isDream = ctc >= 10 && ctc < 20

            return (
              <LinearRow
                key={job.id}
                onClick={() => setSelectedJob(job)}
                isSelected={selectedJob?.id === job.id}
                title={job.title}
                subtitle={
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {job.company_name || 'Corporate Partner'}
                    </span>
                    <span>·</span>
                    <span className="text-zinc-400">
                      {job.job_location || 'Pan-India'} ({job.workplace_mode || 'On-Site'})
                    </span>
                  </span>
                }
                metadata={
                  <div className="flex items-center gap-3">
                    {job.compensation_ctc && (
                      <span className="font-mono font-bold text-zinc-900 dark:text-white">
                        ₹{job.compensation_ctc} LPA
                      </span>
                    )}
                    {job.application_deadline && (
                      <span className="text-[10px] text-zinc-400">
                        Deadline: {formatDate(job.application_deadline)}
                      </span>
                    )}
                  </div>
                }
                rightSlot={
                  <div className="flex items-center gap-2">
                    {hasApplied ? (
                      <LinearStatusDot status="applied" size="sm" />
                    ) : !evaluation.canApply ? (
                      <PriorityBadge tier="locked" size="sm" labelOverride="Blocked" />
                    ) : isSuperDream ? (
                      <PriorityBadge tier="super_dream" size="sm" />
                    ) : isDream ? (
                      <PriorityBadge tier="dream" size="sm" />
                    ) : (
                      <PriorityBadge tier="eligible" size="sm" />
                    )}
                  </div>
                }
              />
            )
          })}
        </div>
      ) : (
        /* Linear Bento Card Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const hasApplied = appliedSet.has(job.id)
            const evaluation = getJobPolicyEvaluation(job)
            const ctc = Number(job.compensation_ctc || 0)
            const isSuperDream = ctc >= 20
            const isDream = ctc >= 10 && ctc < 20

            return (
              <TactileCard
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="flex flex-col justify-between h-full space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-semibold text-[#2B59D1] dark:text-indigo-400 truncate">
                      {job.company_name || 'Corporate Partner'}
                    </span>
                    {hasApplied ? (
                      <LinearStatusDot status="applied" size="sm" />
                    ) : isSuperDream ? (
                      <PriorityBadge tier="super_dream" size="sm" />
                    ) : isDream ? (
                      <PriorityBadge tier="dream" size="sm" />
                    ) : (
                      <PriorityBadge tier="core" size="sm" />
                    )}
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#242424] dark:text-white line-clamp-1">
                    {job.title}
                  </h3>

                  <p className="font-mono text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 stroke-[1.5]" />
                    <span>{job.job_location || 'Pan-India'} ({job.workplace_mode})</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {job.compensation_ctc ? `₹${job.compensation_ctc} LPA` : 'Competitive'}
                  </span>
                  <span className="font-mono text-[11px] text-[#2B59D1] dark:text-indigo-400 font-semibold">
                    View Details →
                  </span>
                </div>
              </TactileCard>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4 flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* ── 3. Linear Slide-Over Inspector Drawer ── */}
      {selectedJob && (
        <LinearDrawer
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          subtitle={selectedJob.company_name || 'Corporate Partner'}
          badge={
            appliedSet.has(selectedJob.id) ? (
              <LinearStatusDot status="applied" size="sm" />
            ) : Number(selectedJob.compensation_ctc) >= 20 ? (
              <PriorityBadge tier="super_dream" size="sm" />
            ) : (
              <PriorityBadge tier="eligible" size="sm" />
            )
          }
          footer={
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="block font-mono text-[10px] uppercase text-zinc-400">Compensation Package</span>
                <span className="font-mono font-bold text-base text-zinc-900 dark:text-white">
                  {selectedJob.compensation_ctc ? `₹${selectedJob.compensation_ctc} LPA` : 'Standard CTC'}
                </span>
              </div>

              {appliedSet.has(selectedJob.id) ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                  <span>Application Submitted</span>
                </div>
              ) : !getJobPolicyEvaluation(selectedJob).canApply ? (
                <div className="text-right">
                  <span className="text-[11px] font-mono text-red-500 font-medium block">
                    {getJobPolicyEvaluation(selectedJob).reason}
                  </span>
                </div>
              ) : (
                <TactileButton
                  variant="primary"
                  size="md"
                  isLoading={isApplying}
                  onClick={() => handleApply(selectedJob.id)}
                >
                  1-Click Dispatch Application →
                </TactileButton>
              )}
            </div>
          }
        >
          {/* Compensation Breakdown Box */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
              Verified Terms
            </span>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block">Workplace:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedJob.workplace_mode}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Employment:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedJob.employment_type}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Location:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedJob.job_location || 'Pan-India'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Deadline:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedJob.application_deadline ? formatDate(selectedJob.application_deadline) : 'Rolling'}
                </span>
              </div>
            </div>
          </div>

          {/* Policy Evaluation Notice */}
          {!getJobPolicyEvaluation(selectedJob).canApply && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 stroke-[1.5] shrink-0 mt-0.5" />
              <div className="font-mono text-xs text-red-900 dark:text-red-300">
                <span className="font-bold block mb-1">Policy Restriction</span>
                {getJobPolicyEvaluation(selectedJob).reason}
              </div>
            </div>
          )}

          {/* Skills Required */}
          {selectedJob.skills_required && (
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block">
                Target Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedJob.skills_required
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-[11px] text-zinc-800 dark:text-zinc-200"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block">
              Job Description
            </span>
            <div className="prose prose-sm dark:prose-invert max-w-none font-sans text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {selectedJob.description || 'No detailed description provided.'}
            </div>
          </div>
        </LinearDrawer>
      )}

    </div>
  )
}
