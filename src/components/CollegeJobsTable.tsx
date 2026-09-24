'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PaginationControls } from '@/components/PaginationControls'
import { getJobDisplayStatus, JobDisplayStatus } from '@/lib/job-status-helper'
import { formatDate } from '@/lib/utils'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Check,
  X,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'

export interface CollegeJobRow {
  id: string
  title: string
  company_name?: string | null
  job_domain?: string | null
  job_location?: string | null
  workplace_mode?: string | null
  employment_type?: string | null
  internship_stipend?: number | null
  compensation_ctc?: number | null
  application_deadline?: string | null
  status: string
  college_id: string | null
  created_at: string
  application_count?: number
}

interface CollegeJobsTableProps {
  jobs: CollegeJobRow[]
}

type SortField = 'pay' | 'date' | 'applicants' | null
type SortOrder = 'asc' | 'desc'

// Multi-select dropdown component for compact filters
interface MultiSelectFilterProps {
  label: string
  options: { key: string; label: string; dotColor?: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleOption = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key))
    } else {
      onChange([...selected, key])
    }
  }

  const handleSelectAll = () => {
    onChange(options.map((o) => o.key))
  }

  const handleClear = () => {
    onChange([])
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 text-xs flex items-center gap-1.5 border transition-colors ${
          selected.length > 0
            ? 'border-blue-500 bg-blue-50/60 text-blue-700 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] h-4 min-w-[16px] px-1 font-semibold">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 w-56 origin-top-left rounded-lg border bg-white dark:bg-zinc-900 p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10 outline-none animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b text-[11px] font-medium text-zinc-500 px-1">
            <span>Filter by {label}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {options.map((opt) => {
              const isChecked = selected.includes(opt.key)
              return (
                <div
                  key={opt.key}
                  onClick={() => toggleOption(opt.key)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.dotColor && (
                      <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColor}`} />
                    )}
                    <span className="text-zinc-800 dark:text-zinc-200 truncate">
                      {opt.label}
                    </span>
                  </div>
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-600 bg-transparent'
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[2.5]" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const SCOPE_OPTIONS = [
  { key: 'local', label: 'Local (College)', dotColor: 'bg-blue-500' },
  { key: 'global', label: 'Global (Platform)', dotColor: 'bg-purple-500' },
]

const STATUS_OPTIONS = [
  { key: 'active_applications', label: 'Active Applications', dotColor: 'bg-emerald-500' },
  { key: 'ongoing', label: 'Ongoing (In-Progress)', dotColor: 'bg-blue-500' },
  { key: 'paused', label: 'Applications Paused', dotColor: 'bg-amber-500' },
  { key: 'completed', label: 'Completed', dotColor: 'bg-zinc-400' },
  { key: 'cancelled', label: 'Drive Cancelled', dotColor: 'bg-red-500' },
]

export function CollegeJobsTable({ jobs }: CollegeJobsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Header sorting state
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Helper to calculate effective numerical pay for sorting
  const getJobPayValue = (job: CollegeJobRow): number => {
    if (job.compensation_ctc && job.compensation_ctc > 0) {
      return Number(job.compensation_ctc)
    }
    if (job.internship_stipend && job.internship_stipend > 0) {
      // Convert monthly stipend to approximate annual equivalent in LPA for normalized sorting
      return (Number(job.internship_stipend) * 12) / 100000
    }
    return 0
  }

  // Handle column header sort clicks (minimal space, direct on header)
  const handleSort = (field: 'pay' | 'date' | 'applicants') => {
    if (sortField === field) {
      if (sortOrder === 'desc') {
        setSortOrder('asc')
      } else {
        // Reset to default (date desc)
        setSortField('date')
        setSortOrder('desc')
      }
    } else {
      setSortField(field)
      // For pay, applicants, and date, descending is the intuitive primary sort
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  // Filter & Sort Logic
  const filteredAndSortedJobs = useMemo(() => {
    // 1. Filter
    const filtered = jobs.filter((job) => {
      // Search
      const query = searchQuery.trim().toLowerCase()
      if (query) {
        const matchesTitle = job.title.toLowerCase().includes(query)
        const matchesCompany = (job.company_name || '').toLowerCase().includes(query)
        const matchesLocation = (job.job_location || '').toLowerCase().includes(query)
        const matchesDomain = (job.job_domain || '').toLowerCase().includes(query)
        const matchesMode = (job.workplace_mode || '').toLowerCase().includes(query)
        const matchesType = (job.employment_type || '').toLowerCase().includes(query)

        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesDomain && !matchesMode && !matchesType) {
          return false
        }
      }

      // Scope Filter (Local / Global)
      if (selectedScopes.length > 0) {
        const isLocal = Boolean(job.college_id)
        const isGlobal = !job.college_id

        const matchesLocal = selectedScopes.includes('local') && isLocal
        const matchesGlobal = selectedScopes.includes('global') && isGlobal

        if (!matchesLocal && !matchesGlobal) {
          return false
        }
      }

      // Status Filter
      if (selectedStatuses.length > 0) {
        const displayStatus = getJobDisplayStatus(job)
        if (!selectedStatuses.includes(displayStatus.key)) {
          return false
        }
      }

      return true
    })

    // 2. Sort
    if (sortField) {
      filtered.sort((a, b) => {
        let valA = 0
        let valB = 0

        if (sortField === 'pay') {
          valA = getJobPayValue(a)
          valB = getJobPayValue(b)
        } else if (sortField === 'date') {
          valA = new Date(a.created_at).getTime()
          valB = new Date(b.created_at).getTime()
        } else if (sortField === 'applicants') {
          valA = a.application_count || 0
          valB = b.application_count || 0
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [jobs, searchQuery, selectedScopes, selectedStatuses, sortField, sortOrder])

  // Pagination slice
  const totalPages = Math.ceil(filteredAndSortedJobs.length / pageSize) || 1
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedJobs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize
    return filteredAndSortedJobs.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedJobs, safeCurrentPage, pageSize])

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedScopes.length > 0 || selectedStatuses.length > 0

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedScopes([])
    setSelectedStatuses([])
    setSortField('date')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Multi-Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white dark:bg-zinc-900 p-3.5 rounded-lg border shadow-xs">
        <div className="relative w-full sm:w-80 md:w-96 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by role, employer, domain, location..."
            className="pl-9 pr-8 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Multi-Filter for Scope (Local / Global) */}
          <MultiSelectFilter
            label="Scope"
            options={SCOPE_OPTIONS}
            selected={selectedScopes}
            onChange={(selected) => {
              setSelectedScopes(selected)
              setCurrentPage(1)
            }}
          />

          {/* Multi-Filter for Status */}
          <MultiSelectFilter
            label="Status"
            options={STATUS_OPTIONS}
            selected={selectedStatuses}
            onChange={(selected) => {
              setSelectedStatuses(selected)
              setCurrentPage(1)
            }}
          />

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Pill Bar (if any selected) */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-zinc-500 px-1">
          <span className="font-medium text-[11px] text-zinc-400">Active Filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 font-normal">
              Search: &quot;{searchQuery}&quot;
              <X className="h-3 w-3 cursor-pointer hover:text-zinc-800" onClick={() => setSearchQuery('')} />
            </Badge>
          )}
          {selectedScopes.map((scopeKey) => {
            const opt = SCOPE_OPTIONS.find((o) => o.key === scopeKey)
            return (
              <Badge key={scopeKey} variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 font-normal">
                {opt?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-zinc-800"
                  onClick={() => setSelectedScopes(selectedScopes.filter((s) => s !== scopeKey))}
                />
              </Badge>
            )
          })}
          {selectedStatuses.map((statusKey) => {
            const opt = STATUS_OPTIONS.find((o) => o.key === statusKey)
            return (
              <Badge key={statusKey} variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 font-normal">
                {opt?.label}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-zinc-800"
                  onClick={() => setSelectedStatuses(selectedStatuses.filter((s) => s !== statusKey))}
                />
              </Badge>
            )
          })}
          <span className="text-[11px] text-zinc-400 ml-1">
            ({filteredAndSortedJobs.length} match{filteredAndSortedJobs.length === 1 ? '' : 'es'})
          </span>
        </div>
      )}

      {/* Jobs Data Table */}
      <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm w-full overflow-x-auto">
        <Table className="min-w-[850px]">
          <TableHeader>
            <TableRow>
              {/* Role & Employer */}
              <TableHead className="w-[280px]">Role &amp; Employer</TableHead>

              {/* Location & Mode */}
              <TableHead>Location &amp; Mode</TableHead>

              {/* Engagement & Pay — Interactive Sort in Header */}
              <TableHead
                className="cursor-pointer select-none group"
                onClick={() => handleSort('pay')}
                title="Click to sort by compensation"
              >
                <div className="flex items-center gap-1.5 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                  <span>Engagement &amp; Pay</span>
                  {sortField === 'pay' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </div>
              </TableHead>

              {/* Status */}
              <TableHead>Status</TableHead>

              {/* Applicants — Interactive Sort in Header */}
              <TableHead
                className="cursor-pointer select-none group"
                onClick={() => handleSort('applicants')}
                title="Click to sort by applicant count"
              >
                <div className="flex items-center gap-1.5 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                  <span>Applicants</span>
                  {sortField === 'applicants' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </div>
              </TableHead>

              {/* Posted On — Interactive Sort in Header */}
              <TableHead
                className="cursor-pointer select-none group"
                onClick={() => handleSort('date')}
                title="Click to sort by posting date"
              >
                <div className="flex items-center gap-1.5 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                  <span>Posted On</span>
                  {sortField === 'date' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </div>
              </TableHead>

              {/* Actions */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedJobs.length > 0 ? (
              paginatedJobs.map((job) => {
                const displayStatus: JobDisplayStatus = getJobDisplayStatus(job)
                const isLocal = Boolean(job.college_id)

                return (
                  <TableRow key={job.id}>
                    {/* Role & Employer with prominent Local / Global legend */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            {job.title}
                          </span>
                          {/* Scope Legend Badge */}
                          {isLocal ? (
                            <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20">
                              Local
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-600/20">
                              Global
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <span>{job.company_name || 'Employer Confidential'}</span>
                          {job.job_domain && (
                            <>
                              <span>&bull;</span>
                              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                                {job.job_domain}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Location & Mode */}
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {job.job_location || 'Pan-India'}
                        </span>
                        <span className="text-zinc-500 text-[11px]">
                          {job.workplace_mode || 'On-Site'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Engagement & Pay */}
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {job.employment_type || 'Full-time'}
                        </span>
                        <span className="text-green-700 dark:text-green-400 font-semibold text-[11px]">
                          {job.employment_type === 'Internship' ? (
                            job.internship_stipend ? (
                              `₹${Number(job.internship_stipend).toLocaleString('en-IN')}/mo`
                            ) : (
                              'Stipend in JD'
                            )
                          ) : job.employment_type === 'Intern+PPO' ? (
                            `₹${job.internship_stipend ? Number(job.internship_stipend).toLocaleString('en-IN') : 0}/mo → ₹${job.compensation_ctc || 0} LPA`
                          ) : job.compensation_ctc ? (
                            `₹${job.compensation_ctc} LPA`
                          ) : (
                            'As per Norms'
                          )}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Pill */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${displayStatus.ringColor}`}
                      >
                        {displayStatus.label}
                      </span>
                    </TableCell>

                    {/* Applicant Count */}
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {job.application_count || 0}
                      </span>
                    </TableCell>

                    {/* Posted On */}
                    <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                      {formatDate(job.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link
                        href={`/college/jobs/${job.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Manage Pipeline &rarr;
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                      {hasActiveFilters ? 'No jobs match your search or filters' : 'No jobs posted yet'}
                    </p>
                    <p className="text-xs text-zinc-500 max-w-sm">
                      {hasActiveFilters
                        ? 'Try clearing some filters or searching with different keywords.'
                        : 'New recruitment drives posted by your team or platform agency will appear here.'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedJobs.length > 0 && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={filteredAndSortedJobs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="jobs"
        />
      )}
    </div>
  )
}
