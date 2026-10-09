'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, LayoutGrid, List } from 'lucide-react'
import { StudentJobCard } from '@/components/StudentJobCard'
import { getJobDisplayStatus } from '@/lib/job-status-helper'
import { WORKPLACE_MODES, EMPLOYMENT_TYPES } from '@/lib/cities-data'
import { JobDetailsData } from '@/components/JobDetailsModal'
import { PaginationControls } from '@/components/PaginationControls'
import { useState, useMemo } from 'react'

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
  activeEmployment
}: StudentJobsDirectoryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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

  const handleSearch = (value: string) => {
    router.push(pathname + '?' + createQueryString({ q: value, page: '1' }))
  }

  const handleWorkplaceChange = (val: string | null) => {
    router.push(pathname + '?' + createQueryString({ workplace: val || '', page: '1' }))
  }

  const handleEmploymentChange = (val: string | null) => {
    router.push(pathname + '?' + createQueryString({ employment: val || '', page: '1' }))
  }

  const handlePageChange = (page: number) => {
    router.push(pathname + '?' + createQueryString({ page: page.toString() }))
  }

  const clearFilters = () => {
    router.push(pathname + '?' + createQueryString({ q: null, workplace: null, employment: null, page: '1' }))
  }

  const hasActiveFilters = searchQuery || activeWorkplace !== 'all' || activeEmployment !== 'all'

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900/60 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by job title, company, skills, or city..."
              defaultValue={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                setTimeout(() => handleSearch(val), 300)
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Workplace Mode Filter */}
          <div className="sm:col-span-3">
            <Select value={activeWorkplace} onValueChange={handleWorkplaceChange}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Workplace Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes (On-Site, Remote, Hybrid)</SelectItem>
                {WORKPLACE_MODES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Type Filter */}
          <div className="sm:col-span-3">
            <Select value={activeEmployment} onValueChange={handleEmploymentChange}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Employment Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types (Full-time, Internship, etc.)</SelectItem>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Summary & View Toggle */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong>{jobs.length}</strong> of {totalItems} open drives
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <X className="h-3 w-3" /> Clear Filters
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border dark:border-zinc-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Container */}
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/30">
          No job drives match your current search and filter criteria.
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "flex flex-col gap-4"}>
          {jobs.map((job) => {
            const hasApplied = appliedSet.has(job.id)
            const displayStatus = getJobDisplayStatus({ ...job, status: job.status || 'active' })
            let disabledReason = ''
            const jobCtc = job.compensation_ctc || 0

            if (displayStatus.key === 'paused') {
              disabledReason = 'Applications Paused by College'
            } else if (displayStatus.key === 'ongoing') {
              disabledReason = 'Application Deadline Passed'
            } else if (isBlacklisted) {
              disabledReason = 'Debarred from campus drives'
            } else if (isPlaced && !hasApplied) {
              const isSuperDreamEligible = superDreamConfig.enabled && jobCtc >= superDreamConfig.min_ctc
              const isDreamEligible = dreamConfig.enabled && jobCtc >= dreamConfig.min_ctc
              const isUpgradeEligible = upgradeConfig.enabled && jobCtc >= (maxCurrentCtc * upgradeConfig.min_multiplier)

              if (!isSuperDreamEligible && !isDreamEligible && !isUpgradeEligible) {
                disabledReason = `1-Offer Policy Active: Placed at ₹${maxCurrentCtc} LPA`
              } else if (isSuperDreamEligible) {
                const used = counters.super_dream_attempts || 0
                if (used >= (superDreamConfig.max_attempts || 2)) {
                  disabledReason = `Super Dream attempt limit reached (${used}/${superDreamConfig.max_attempts || 2})`
                }
              } else if (isDreamEligible) {
                const used = counters.dream_attempts || 0
                if (used >= (dreamConfig.max_dream_attempts || 3)) {
                  disabledReason = `Dream attempt limit reached (${used}/${dreamConfig.max_dream_attempts || 3})`
                }
              } else if (isUpgradeEligible) {
                const used = counters.upgrades_used || 0
                if (used >= (upgradeConfig.max_allowed || 1)) {
                  disabledReason = `Upgrade attempts exhausted (${used}/${upgradeConfig.max_allowed || 1})`
                }
              }
            } else if (!hasApplied && appLimitConfig.enabled) {
              if (appLimitConfig.max_active && activeAppsCount >= appLimitConfig.max_active) {
                disabledReason = `Active limit reached (${activeAppsCount}/${appLimitConfig.max_active})`
              } else if (appLimitConfig.max_total && totalAppsCount >= appLimitConfig.max_total) {
                disabledReason = `Total application quota exhausted (${totalAppsCount}/${appLimitConfig.max_total})`
              }
            }

            const isUpgrade = isPlaced && !disabledReason

            return (
              <StudentJobCard
                key={job.id}
                job={job}
                hasApplied={hasApplied}
                disabledReason={disabledReason}
                isUpgrade={isUpgrade}
                accessStatus={accessStatus}
                viewMode={viewMode}
                statusBadge={{
                  label: displayStatus.label,
                  badgeColor: displayStatus.badgeColor,
                }}
              />
            )
          })}
        </div>
      )}

      {totalItems > pageSize && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          itemLabel="jobs"
        />
      )}
    </div>
  )
}
