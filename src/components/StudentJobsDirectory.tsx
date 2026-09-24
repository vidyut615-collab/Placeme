'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, MapPin, Briefcase, Filter, X } from 'lucide-react'
import { StudentJobCard } from '@/components/StudentJobCard'
import { getJobDisplayStatus } from '@/lib/job-status-helper'
import { WORKPLACE_MODES, EMPLOYMENT_TYPES } from '@/lib/cities-data'
import { JobDetailsData } from '@/components/JobDetailsModal'

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
}: StudentJobsDirectoryProps) {
  const [search, setSearch] = useState('')
  const [workplaceFilter, setWorkplaceFilter] = useState('all')
  const [employmentFilter, setEmploymentFilter] = useState('all')

  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds])

  const upgradeConfig = config.upgrade || { enabled: false, min_multiplier: 1, max_allowed: 1 }
  const dreamConfig = config.dream || { enabled: false, min_ctc: 10, max_dream_attempts: 3 }
  const superDreamConfig = config.super_dream || { enabled: false, min_ctc: 20, max_attempts: 2 }
  const appLimitConfig = config.application_limit || { enabled: false }

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Text Search (title, company, city, skills, domain)
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesTitle = job.title?.toLowerCase().includes(q)
        const matchesCompany = job.company_name?.toLowerCase().includes(q)
        const matchesCity = job.job_location?.toLowerCase().includes(q)
        const matchesSkills = job.skills_required?.toLowerCase().includes(q)
        const matchesDomain = job.job_domain?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesCompany && !matchesCity && !matchesSkills && !matchesDomain) {
          return false
        }
      }

      // 2. Workplace Mode Filter
      if (workplaceFilter !== 'all') {
        if (job.workplace_mode !== workplaceFilter) return false
      }

      // 3. Employment Type Filter
      if (employmentFilter !== 'all') {
        if (job.employment_type !== employmentFilter) return false
      }

      return true
    })
  }, [jobs, search, workplaceFilter, employmentFilter])

  const clearFilters = () => {
    setSearch('')
    setWorkplaceFilter('all')
    setEmploymentFilter('all')
  }

  const hasActiveFilters = search || workplaceFilter !== 'all' || employmentFilter !== 'all'

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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Workplace Mode Filter */}
          <div className="sm:col-span-3">
            <Select value={workplaceFilter} onValueChange={(val) => setWorkplaceFilter(val || 'all')}>
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
            <Select value={employmentFilter} onValueChange={(val) => setEmploymentFilter(val || 'all')}>
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

        {/* Filter Summary & Quick Reset */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
          <span>
            Showing <strong>{filteredJobs.length}</strong> of {jobs.length} open drives
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
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/30">
          No job drives match your current search and filter criteria.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => {
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
                statusBadge={{
                  label: displayStatus.label,
                  badgeColor: displayStatus.badgeColor,
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
