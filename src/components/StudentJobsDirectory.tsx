'use client'

import React, { useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  Briefcase,
  Check,
  Download,
  FileText,
  LayoutGrid,
  List,
  Lock,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { JobDetailsData } from '@/components/JobDetailsModal'
import { PaginationControls } from '@/components/PaginationControls'
import { WORKPLACE_MODES, EMPLOYMENT_TYPES } from '@/lib/cities-data'
import { formatDate } from '@/lib/utils'
import { applyForJob } from '@/app/(dashboards)/student/actions'
import { LinearDrawer } from '@/components/ui/linear'

interface PolicyConfig {
  upgrade?: {
    enabled?: boolean
    min_multiplier?: number
    min_increment_pct?: number
    max_allowed?: number
    max_upgrade_attempts?: number
  }
  dream?: {
    enabled?: boolean
    min_ctc?: number
    max_dream_attempts?: number
  }
  super_dream?: {
    enabled?: boolean
    min_ctc?: number
    max_attempts?: number
  }
  offer_limit?: {
    enabled?: boolean
    max_offers_total?: number
  }
  application_limit?: {
    enabled?: boolean
    max_active?: number
    max_total?: number
  }
}

interface StudentJobsDirectoryProps {
  jobs: JobDetailsData[]
  appliedJobIds: string[]
  isBlacklisted: boolean
  isPlaced: boolean
  maxCurrentCtc: number
  activeAppsCount: number
  totalAppsCount: number
  config: PolicyConfig
  counters: Record<string, number>
  accessStatus?: 'active' | 'expired' | 'unpaid'
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  searchQuery: string
  activeWorkplace: string
  activeEmployment: string
  initialJobId?: string
}

function formatCtc(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return 'Standard CTC'
  return `₹${num.toFixed(1)} LPA`
}

function formatCompensationLine(job: JobDetailsData): string {
  if (job.employment_type === 'Internship') {
    return job.internship_stipend
      ? `₹${Number(job.internship_stipend).toLocaleString('en-IN')}/mo`
      : 'Stipend in JD'
  }
  return formatCtc(job.compensation_ctc)
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
  initialJobId,
}: StudentJobsDirectoryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedJob, setSelectedJob] = useState<JobDetailsData | null>(() =>
    initialJobId ? jobs.find((j) => j.id === initialJobId) ?? null : null
  )
  const [isApplying, startApplyTransition] = useTransition()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)
  const [optimisticAppliedIds, setOptimisticAppliedIds] = useState<string[]>([])
  const [now] = useState(() => Date.now())

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery)
    setLocalSearch(searchQuery)
  }

  const appliedSet = useMemo(
    () => new Set([...appliedJobIds, ...optimisticAppliedIds]),
    [appliedJobIds, optimisticAppliedIds]
  )

  const offerLimitConfig = config.offer_limit || { enabled: false, max_offers_total: 1 }
  const upgradeConfig = config.upgrade || { enabled: false, min_multiplier: 1.5, max_allowed: 1 }
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

  const pushFilters = (updates: Record<string, string | null>) => {
    const qs = createQueryString(updates)
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const getJobPolicyEvaluation = (job: JobDetailsData) => {
    if (appliedSet.has(job.id)) {
      return { canApply: false, reason: 'Already applied', badge: 'Applied' as const }
    }
    if (job.status === 'paused') {
      return {
        canApply: false,
        reason: 'Applications for this drive are temporarily paused by the placement cell',
        badge: 'Paused' as const,
      }
    }
    if (job.application_deadline && now > new Date(job.application_deadline).getTime()) {
      return {
        canApply: false,
        reason: `Application deadline passed on ${formatDate(job.application_deadline)}`,
        badge: 'Closed' as const,
      }
    }
    if (isBlacklisted) {
      return {
        canApply: false,
        reason: 'Your placement account is currently on hold',
        badge: 'Blocked' as const,
      }
    }
    if (accessStatus === 'unpaid' || accessStatus === 'expired') {
      return {
        canApply: false,
        reason: 'Placement portal access is inactive or expired',
        badge: 'Inactive' as const,
      }
    }

    const ctc = Number(job.compensation_ctc || 0)
    const isGlobalJob = job.college_id === null

    if (!isGlobalJob && appLimitConfig.enabled) {
      if (
        appLimitConfig.max_active !== undefined &&
        appLimitConfig.max_active !== null &&
        activeAppsCount >= appLimitConfig.max_active
      ) {
        return {
          canApply: false,
          reason: `Active application limit (${appLimitConfig.max_active}) reached — wait for an ongoing drive to conclude`,
          badge: 'Limit reached' as const,
        }
      }
      if (
        appLimitConfig.max_total !== undefined &&
        appLimitConfig.max_total !== null &&
        totalAppsCount >= appLimitConfig.max_total
      ) {
        return {
          canApply: false,
          reason: `Season application cap (${appLimitConfig.max_total}) reached`,
          badge: 'Limit reached' as const,
        }
      }
    }

    if (isPlaced && offerLimitConfig.enabled) {
      if (superDreamConfig.enabled && superDreamConfig.min_ctc && ctc >= superDreamConfig.min_ctc) {
        const maxAttempts = superDreamConfig.max_attempts || 2
        if ((counters.super_dream_attempts || 0) >= maxAttempts) {
          return {
            canApply: false,
            reason: `Super Dream upgrade attempts (${maxAttempts}) used`,
            badge: 'Limit reached' as const,
          }
        }
        return { canApply: true, reason: null, badge: 'Super Dream' as const }
      }

      if (dreamConfig.enabled && dreamConfig.min_ctc && ctc >= dreamConfig.min_ctc) {
        const maxAttempts = dreamConfig.max_dream_attempts || 3
        if ((counters.dream_attempts || 0) >= maxAttempts) {
          return {
            canApply: false,
            reason: `Dream upgrade attempts (${maxAttempts}) used`,
            badge: 'Limit reached' as const,
          }
        }
        return { canApply: true, reason: null, badge: 'Dream' as const }
      }

      if (upgradeConfig.enabled && maxCurrentCtc > 0) {
        const multiplier = upgradeConfig.min_increment_pct
          ? 1 + upgradeConfig.min_increment_pct / 100
          : upgradeConfig.min_multiplier || 1.5
        const requiredCtc = maxCurrentCtc * multiplier
        const maxUpgrades = upgradeConfig.max_upgrade_attempts || upgradeConfig.max_allowed || 1
        if ((counters.upgrades_used || 0) >= maxUpgrades) {
          return {
            canApply: false,
            reason: `Maximum upgrade attempts (${maxUpgrades}) used`,
            badge: 'Limit reached' as const,
          }
        }
        if (ctc <= maxCurrentCtc || (multiplier > 1 && ctc < requiredCtc)) {
          return {
            canApply: false,
            reason: `Requires ≥ ₹${requiredCtc.toFixed(1)} LPA under the ${multiplier.toFixed(1)}× upgrade rule`,
            badge: 'Policy gated' as const,
          }
        }
        return { canApply: true, reason: null, badge: 'Upgrade' as const }
      }

      return {
        canApply: false,
        reason: 'Standard drives are locked under the 1-offer placement policy',
        badge: 'Policy gated' as const,
      }
    }

    return { canApply: true, reason: null, badge: 'Eligible' as const }
  }

  const handleApply = (jobId: string) => {
    startApplyTransition(async () => {
      const res = await applyForJob(jobId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        setOptimisticAppliedIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]))
        toast.success(res?.success || 'Application submitted')
        router.refresh()
      }
    })
  }

  const selectedEvaluation = selectedJob ? getJobPolicyEvaluation(selectedJob) : null
  const selectedCrit = (selectedJob?.eligibility_criteria as Record<string, unknown> | null) || {}
  const selectedStages = (selectedJob?.custom_stages as Record<string, string> | null) || {}
  const selectedSkills = selectedJob?.skills_required
    ? selectedJob.skills_required
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  return (
    <div className="space-y-5">
      {/* ── 1. Filter & View Controls ── */}
      <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              pushFilters({ q: localSearch, page: '1' })
            }}
            className="relative flex-1"
          >
            <Search className="w-4 h-4 stroke-[1.5] text-[#78716C] dark:text-[#8A847A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                const next = e.target.value
                setLocalSearch(next)
                if (next === '' && searchQuery !== '') {
                  pushFilters({ q: null, page: '1' })
                }
              }}
              placeholder="Search company, role, location, or skill"
              className="w-full h-9 pl-9 pr-20 rounded-lg bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch('')
                    pushFilters({ q: null, page: '1' })
                  }}
                  className="p-1 rounded text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6]"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
              )}
              <button
                type="submit"
                className="h-6 px-2.5 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] hover:bg-[#E7E1D8] dark:hover:bg-[#2F2C28] text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] transition-colors duration-150"
              >
                Search
              </button>
            </div>
          </form>

          {/* List / Grid Segmented Toggle */}
          <div className="inline-flex items-center p-1 rounded-lg bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
                  : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
              }`}
            >
              <List className="w-4 h-4 stroke-[1.5]" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
                  : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 stroke-[1.5]" />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Workplace & Employment Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', ...WORKPLACE_MODES].map((mode) => {
              const isSelected = activeWorkplace === mode || (mode === 'all' && !activeWorkplace)
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => pushFilters({ workplace: mode, page: '1' })}
                  className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                  }`}
                >
                  {mode === 'all' ? 'All modes' : mode}
                </button>
              )
            })}
          </div>

          <span className="text-[#1C1917]/15 dark:text-[#EFECE6]/15 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', ...EMPLOYMENT_TYPES].map((emp) => {
              const isSelected = activeEmployment === emp || (emp === 'all' && !activeEmployment)
              return (
                <button
                  key={emp}
                  type="button"
                  onClick={() => pushFilters({ employment: emp, page: '1' })}
                  className={`h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1917] text-white dark:bg-[#EFECE6] dark:text-[#1C1917]'
                      : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                  }`}
                >
                  {emp === 'all' ? 'All types' : emp}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Jobs Canvas (List or Grid) ── */}
      {jobs.length === 0 ? (
        <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] px-6 py-16 text-center space-y-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="w-10 h-10 rounded-[10px] bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#78716C] dark:text-[#8A847A] flex items-center justify-center mx-auto">
            <Briefcase className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
              No matching drives found
            </h2>
            <p className="text-[13px] text-[#78716C] dark:text-[#8A847A]">
              Try adjusting your workplace filters, employment type, or search keywords
            </p>
          </div>
          {(searchQuery || activeWorkplace !== 'all' || activeEmployment !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('')
                router.push(pathname)
              }}
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-lg text-[13px] font-medium bg-[#F3EFE9] dark:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6] hover:bg-[#E7E1D8] dark:hover:bg-[#2F2C28] transition-colors duration-150 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04)] divide-y divide-[#1C1917]/[0.08] dark:divide-[#EFECE6]/[0.08]">
          {jobs.map((job) => {
            const hasApplied = appliedSet.has(job.id)
            const evaluation = getJobPolicyEvaluation(job)
            const ctc = Number(job.compensation_ctc || 0)
            const tierLabel = ctc >= 20 ? 'Super Dream' : ctc >= 10 ? 'Dream' : 'Core'
            const isSelected = selectedJob?.id === job.id

            return (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedJob(job)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedJob(job)
                  }
                }}
                className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                  isSelected
                    ? 'bg-[#ECFDF8]/60 dark:bg-[#0F766E]/15'
                    : 'hover:bg-[#FAF8F5] dark:hover:bg-[#24221F]/60'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                      {job.title}
                    </span>
                    <span className="text-[12px] text-[#78716C] dark:text-[#8A847A]">
                      {tierLabel}
                    </span>
                    {job.employment_type && (
                      <span className="text-[12px] px-2 py-0.5 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A]">
                        {job.employment_type}
                      </span>
                    )}
                  </div>

                  <div className="text-[13px] text-[#57534E] dark:text-[#ACA59A] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[#1C1917] dark:text-[#EFECE6]">
                      {job.company_name || 'Corporate Partner'}
                    </span>
                    <span>·</span>
                    <span>
                      {job.job_location || 'Pan-India'} ({job.workplace_mode || 'On-site'})
                    </span>
                    {job.application_deadline && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[12px] text-[#78716C] dark:text-[#8A847A]">
                          Due {formatDate(job.application_deadline)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="font-mono text-[13px] font-medium tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                    {formatCompensationLine(job)}
                  </span>

                  {hasApplied ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#ECFEFF] dark:bg-[#0F766E]/25 text-[#0F766E] dark:text-[#5EEAD4] border border-[#0F766E]/20 dark:border-[#14B8A6]/30">
                      <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Applied</span>
                    </span>
                  ) : !evaluation.canApply ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#FEF3C7] dark:bg-[#B45309]/25 text-[#B45309] dark:text-[#FCD34D] border border-[#B45309]/20">
                      <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>{evaluation.badge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] border border-[#0F766E]/20 dark:border-[#14B8A6]/30">
                      Eligible
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const hasApplied = appliedSet.has(job.id)
            const evaluation = getJobPolicyEvaluation(job)
            const ctc = Number(job.compensation_ctc || 0)
            const tierLabel = ctc >= 20 ? 'Super Dream' : ctc >= 10 ? 'Dream' : 'Core'

            return (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedJob(job)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedJob(job)
                  }
                }}
                className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:border-[#1C1917]/20 dark:hover:border-[#EFECE6]/20 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors duration-150 flex flex-col justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#115E59] dark:text-[#5EEAD4] truncate">
                      {job.company_name || 'Corporate Partner'}
                    </span>
                    <span className="text-[12px] text-[#78716C] dark:text-[#8A847A] shrink-0">
                      {tierLabel}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6] line-clamp-1">
                    {job.title}
                  </h3>

                  <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 stroke-[1.5] text-[#78716C] dark:text-[#8A847A] shrink-0" />
                    <span className="truncate">
                      {job.job_location || 'Pan-India'} · {job.workplace_mode || 'On-site'}
                    </span>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-between">
                  <span className="font-mono text-[14px] font-medium tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                    {formatCompensationLine(job)}
                  </span>

                  {hasApplied ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0F766E] dark:text-[#5EEAD4]">
                      <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>Applied</span>
                    </span>
                  ) : !evaluation.canApply ? (
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#B45309] dark:text-[#FCD34D]">
                      <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>{evaluation.badge}</span>
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium text-[#115E59] dark:text-[#5EEAD4]">
                      Inspect & apply
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="rounded-[14px] overflow-hidden border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(nextPage) => pushFilters({ page: nextPage.toString() })}
            itemLabel="drives"
          />
        </div>
      )}

      {/* ── 3. Slide-Over Job Inspector Drawer ── */}
      <LinearDrawer
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title || ''}
        subtitle={
          selectedJob
            ? `${selectedJob.company_name || 'Corporate Partner'} · ${
                selectedJob.college_id ? 'Campus drive' : 'Global drive'
              }`
            : undefined
        }
        className="bg-[#FAF8F5] dark:bg-[#191816] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]"
        badge={
          selectedJob && selectedEvaluation ? (
            appliedSet.has(selectedJob.id) ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-md bg-[#ECFEFF] dark:bg-[#0F766E]/25 text-[#0F766E] dark:text-[#5EEAD4] border border-[#0F766E]/20">
                Applied
              </span>
            ) : !selectedEvaluation.canApply ? (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#B45309]/25 text-[#B45309] dark:text-[#FCD34D] border border-[#B45309]/20">
                {selectedEvaluation.badge}
              </span>
            ) : (
              <span className="inline-flex items-center text-[12px] font-medium px-2 py-0.5 rounded-md bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] border border-[#0F766E]/20">
                {selectedEvaluation.badge}
              </span>
            )
          ) : null
        }
        footer={
          selectedJob && selectedEvaluation ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="block text-[12px] text-[#78716C] dark:text-[#8A847A]">
                  {selectedJob.employment_type === 'Internship'
                    ? 'Monthly stipend'
                    : 'Compensation package'}
                </span>
                <span className="font-mono text-[16px] font-medium tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                  {formatCompensationLine(selectedJob)}
                </span>
              </div>

              {appliedSet.has(selectedJob.id) ? (
                <div className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#ECFEFF] dark:bg-[#0F766E]/25 text-[#0F766E] dark:text-[#5EEAD4] border border-[#0F766E]/20 text-[13px] font-medium">
                  <Check className="w-4 h-4 stroke-[1.5]" />
                  <span>Application submitted</span>
                </div>
              ) : !selectedEvaluation.canApply ? (
                <span className="text-[13px] text-[#B45309] dark:text-[#FCD34D] sm:text-right max-w-xs">
                  {selectedEvaluation.reason}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() => handleApply(selectedJob.id)}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[13px] font-medium bg-gradient-to-b from-[#13857C] to-[#0C635C] hover:from-[#10736B] hover:to-[#0A554F] disabled:opacity-60 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_1px_2px_rgba(28,25,23,0.12)] transition-colors duration-150 cursor-pointer"
                >
                  {isApplying ? 'Submitting...' : 'Submit application'}
                </button>
              )}
            </div>
          ) : null
        }
      >
        {selectedJob && selectedEvaluation && (
          <div className="space-y-5">
            {/* Policy Restriction Notice */}
            {!selectedEvaluation.canApply && !appliedSet.has(selectedJob.id) && (
              <div className="rounded-xl border border-[#B45309]/25 bg-[#FEF3C7]/60 dark:bg-[#B45309]/15 p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 stroke-[1.5] text-[#B45309] dark:text-[#FCD34D] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Policy restriction
                  </div>
                  <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                    {selectedEvaluation.reason}
                  </p>
                </div>
              </div>
            )}

            {/* Verified Terms & Compensation Breakdown */}
            <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#12110F] p-4 space-y-3">
              <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                Role terms & compensation
              </div>
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[12px]">
                    Workplace
                  </span>
                  <span className="text-[#1C1917] dark:text-[#EFECE6] font-medium">
                    {selectedJob.workplace_mode || 'On-site'}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[12px]">
                    Employment
                  </span>
                  <span className="text-[#1C1917] dark:text-[#EFECE6] font-medium">
                    {selectedJob.employment_type || 'Full-time'}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[12px]">
                    Location
                  </span>
                  <span className="text-[#1C1917] dark:text-[#EFECE6] font-medium">
                    {selectedJob.job_location || 'Pan-India'}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[12px]">
                    Deadline
                  </span>
                  <span className="font-mono tabular-nums text-[#1C1917] dark:text-[#EFECE6] font-medium">
                    {selectedJob.application_deadline
                      ? formatDate(selectedJob.application_deadline)
                      : 'Rolling'}
                  </span>
                </div>
                {(selectedJob.compensation_fixed || selectedJob.compensation_variable) && (
                  <div className="col-span-2 pt-2 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex flex-wrap gap-4 text-[12px] font-mono tabular-nums text-[#57534E] dark:text-[#ACA59A]">
                    {selectedJob.compensation_fixed ? (
                      <span>Fixed: ₹{selectedJob.compensation_fixed} LPA</span>
                    ) : null}
                    {selectedJob.compensation_variable ? (
                      <span>Variable: ₹{selectedJob.compensation_variable} LPA</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Service Agreement / Bond */}
            <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#12110F] p-4 flex items-start gap-3">
              <ShieldCheck
                className={`w-4 h-4 stroke-[1.5] shrink-0 mt-0.5 ${
                  selectedJob.has_bond
                    ? 'text-[#B45309] dark:text-[#FCD34D]'
                    : 'text-[#0F766E] dark:text-[#5EEAD4]'
                }`}
              />
              <div className="space-y-0.5 text-[13px]">
                <div className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {selectedJob.has_bond
                    ? `Service bond · ${selectedJob.bond_duration || 'Duration in offer letter'}`
                    : 'No service bond'}
                </div>
                <p className="text-[#57534E] dark:text-[#ACA59A]">
                  {selectedJob.has_bond
                    ? selectedJob.bond_penalty_amount
                      ? `Early exit penalty: ₹${Number(selectedJob.bond_penalty_amount).toLocaleString('en-IN')}`
                      : 'Accepted candidates agree to complete the stipulated service period'
                    : 'No mandatory lock-in period or financial break penalty'}
                </p>
              </div>
            </div>

            {/* Selection Rounds */}
            {(selectedStages.stage_1 || selectedStages.stage_2 || selectedStages.stage_3) && (
              <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#12110F] p-4 space-y-2.5">
                <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Selection rounds
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span className="px-2.5 py-1 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6]">
                    1. Applied
                  </span>
                  {selectedStages.stage_1 && (
                    <span className="px-2.5 py-1 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6]">
                      2. {selectedStages.stage_1}
                    </span>
                  )}
                  {selectedStages.stage_2 && (
                    <span className="px-2.5 py-1 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6]">
                      3. {selectedStages.stage_2}
                    </span>
                  )}
                  {selectedStages.stage_3 && (
                    <span className="px-2.5 py-1 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6]">
                      4. {selectedStages.stage_3}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] border border-[#0F766E]/20">
                    Final offer
                  </span>
                </div>
              </div>
            )}

            {/* Academic Eligibility Cutoffs */}
            <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#12110F] p-4 space-y-3">
              <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                Eligibility criteria
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-[13px]">
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#191816] border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                  <span className="text-[12px] text-[#78716C] dark:text-[#8A847A] block">
                    Min CGPA
                  </span>
                  <span className="font-mono font-medium tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                    {selectedCrit.min_cgpa ? String(selectedCrit.min_cgpa) : 'No bar'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#191816] border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                  <span className="text-[12px] text-[#78716C] dark:text-[#8A847A] block">
                    10th / 12th
                  </span>
                  <span className="font-mono font-medium tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                    {selectedCrit.min_10th || selectedCrit.min_12th
                      ? `${Number(selectedCrit.min_10th || 0)}% / ${Number(selectedCrit.min_12th || 0)}%`
                      : 'No bar'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#191816] border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                  <span className="text-[12px] text-[#78716C] dark:text-[#8A847A] block">
                    Backlogs
                  </span>
                  <span className="font-mono font-medium tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                    {selectedCrit.max_active_backlogs !== null &&
                    selectedCrit.max_active_backlogs !== undefined
                      ? `Max ${String(selectedCrit.max_active_backlogs)}`
                      : 'Allowed'}
                  </span>
                </div>
              </div>
              {Array.isArray(selectedCrit.allowed_departments) &&
                selectedCrit.allowed_departments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(selectedCrit.allowed_departments as string[]).map((dept) => (
                      <span
                        key={dept}
                        className="text-[12px] px-2 py-0.5 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A]"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            {/* Official JD Attachment */}
            {selectedJob.jd_attachment_url && (
              <div className="rounded-xl border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-[#ECFDF8]/50 dark:bg-[#0F766E]/15 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 stroke-[1.5] text-[#115E59] dark:text-[#5EEAD4] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                      {selectedJob.jd_attachment_name || 'Job_Description.pdf'}
                    </div>
                    <div className="text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                      Official recruiter document
                    </div>
                  </div>
                </div>
                <a
                  href={
                    selectedJob.jd_attachment_url.startsWith('data:')
                      ? selectedJob.jd_attachment_url
                      : `${selectedJob.jd_attachment_url}${
                          selectedJob.jd_attachment_url.includes('?') ? '&' : '?'
                        }download=${encodeURIComponent(
                          selectedJob.jd_attachment_name || 'Job_Description.pdf'
                        )}`
                  }
                  download={selectedJob.jd_attachment_name || 'Job_Description.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-white dark:bg-[#24221F] text-[#115E59] dark:text-[#5EEAD4] border border-[#0F766E]/20 hover:bg-[#F3EFE9] transition-colors duration-150 shrink-0"
                >
                  <Download className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>PDF</span>
                </a>
              </div>
            )}

            {/* Target Skills */}
            {selectedSkills.length > 0 && (
              <div className="space-y-2">
                <span className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                  Required skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[12px] text-[#57534E] dark:text-[#ACA59A]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Description */}
            <div className="space-y-2">
              <span className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                Role description
              </span>
              <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#12110F] p-4 text-[13px] text-[#57534E] dark:text-[#ACA59A] whitespace-pre-wrap leading-relaxed">
                {selectedJob.description || 'No detailed description provided'}
              </div>
            </div>
          </div>
        )}
      </LinearDrawer>
    </div>
  )
}
