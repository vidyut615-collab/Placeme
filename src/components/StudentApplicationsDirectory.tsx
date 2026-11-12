'use client'

import { useState, useMemo } from 'react'
import {
  Ban,
  Briefcase,
  Check,
  ChevronRight,
  Info,
  Search,
  X,
} from 'lucide-react'
import { LinearDrawer } from '@/components/ui/linear/LinearDrawer'
import { WithdrawButton } from '@/components/WithdrawButton'
import { formatDate } from '@/lib/utils'

export interface ApplicationItem {
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

type FilterKey = 'all' | 'active' | 'interview' | 'offered' | 'closed'

const formatStudentDropReason = (reason: string | null) => {
  if (!reason) return 'Application dropped or process concluded'
  const map: Record<string, string> = {
    non_participation: 'Non-participation penalty (eligible candidate did not apply)',
    excused_absence: 'Excused absence (approved by placement cell — no strike)',
    student_withdrew: 'Withdrew mid-process',
    student_withdrew_post_shortlist: 'Withdrew after shortlist (placement strike warning)',
    did_not_qualify: 'Did not qualify assessment round',
    no_show: 'No-show at scheduled drive or interview',
    unprofessional_conduct: 'Unprofessional conduct report',
    data_fraud: 'Profile verification discrepancy',
    revoked_by_company: 'Role cancelled or revoked by partner',
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
  { key: 'hired', label: 'Placed' },
]

const OFFERED_STATES = new Set(['selected', 'offered', 'offer_accepted', 'hired', 'joined'])
const INTERVIEW_STATES = new Set(['interviewing', 'stage1', 'stage2', 'stage3'])
const CLOSED_STATES = new Set([
  'closed',
  'dropped',
  'cancelled',
  'rejected',
  'withdrawn',
  'forfeited',
  'offer_declined',
  'not_joined',
])

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  stage1: 'Round 1',
  stage2: 'Round 2',
  stage3: 'Round 3',
  interviewing: 'Interviewing',
  selected: 'Selected',
  offered: 'Offered',
  offer_accepted: 'Offer accepted',
  offer_declined: 'Offer declined',
  hired: 'Hired',
  joined: 'Joined',
  not_joined: 'Not joined',
  withdrawn: 'Withdrawn',
  rejected: 'Not selected',
  dropped: 'Dropped',
  forfeited: 'Forfeited',
  cancelled: 'Cancelled',
  closed: 'Closed',
}

function formatCtc(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return 'Disclosed on selection'
  return `₹${num.toFixed(1)} LPA`
}

function getStatusTone(status: string): 'positive' | 'progress' | 'terminal' | 'neutral' {
  const s = status.toLowerCase()
  if (OFFERED_STATES.has(s)) return 'positive'
  if (INTERVIEW_STATES.has(s) || s === 'shortlisted') return 'progress'
  if (CLOSED_STATES.has(s)) return 'terminal'
  return 'neutral'
}

export function StudentApplicationsDirectory({
  initialApplications,
}: StudentApplicationsDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all')
  const [activeApp, setActiveApp] = useState<ApplicationItem | null>(null)

  const counts = useMemo(() => {
    let screening = 0
    let interview = 0
    let offered = 0
    let closed = 0

    initialApplications.forEach((app) => {
      const s = app.status?.toLowerCase() || ''
      if (OFFERED_STATES.has(s)) offered++
      else if (INTERVIEW_STATES.has(s)) interview++
      else if (CLOSED_STATES.has(s)) closed++
      else screening++
    })

    return {
      all: initialApplications.length,
      active: screening,
      interview,
      offered,
      closed,
    }
  }, [initialApplications])

  const filteredApps = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return initialApplications.filter((app) => {
      const company = (app.jobs?.company_name || '').toLowerCase()
      const title = (app.jobs?.title || '').toLowerCase()

      if (query !== '' && !company.includes(query) && !title.includes(query)) {
        return false
      }

      const s = app.status?.toLowerCase() || ''
      if (selectedFilter === 'all') return true
      if (selectedFilter === 'active') return !OFFERED_STATES.has(s) && !INTERVIEW_STATES.has(s) && !CLOSED_STATES.has(s)
      if (selectedFilter === 'interview') return INTERVIEW_STATES.has(s)
      if (selectedFilter === 'offered') return OFFERED_STATES.has(s)
      if (selectedFilter === 'closed') return CLOSED_STATES.has(s)
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
    if (s === 'selected' || s === 'offered' || s === 'offer_accepted') return 6
    if (s === 'hired' || s === 'joined') return 7
    return -1
  }

  const getStatusLabel = (app: ApplicationItem) => {
    if (app.status === 'stage1') {
      return (
        app.jobs?.custom_stages?.stage_1 ||
        app.jobs?.custom_stages?.stage_1_label ||
        'Round 1'
      )
    }
    if (app.status === 'stage2') {
      return (
        app.jobs?.custom_stages?.stage_2 ||
        app.jobs?.custom_stages?.stage_2_label ||
        'Round 2'
      )
    }
    if (app.status === 'stage3') {
      return (
        app.jobs?.custom_stages?.stage_3 ||
        app.jobs?.custom_stages?.stage_3_label ||
        'Round 3'
      )
    }
    return STATUS_LABELS[app.status?.toLowerCase()] || app.status
  }

  const tabs: Array<{ id: FilterKey; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Screening', count: counts.active },
    { id: 'interview', label: 'Rounds', count: counts.interview },
    { id: 'offered', label: 'Offers', count: counts.offered },
    { id: 'closed', label: 'Archived', count: counts.closed },
  ]

  const activeStageIdx = activeApp ? getStageIndex(activeApp.status) : -1
  const activeIsClosed = activeApp ? CLOSED_STATES.has(activeApp.status.toLowerCase()) : false

  return (
    <div className="space-y-5">
      {/* ── 1. Search & Filter Bar ── */}
      <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 stroke-[1.5] text-[#78716C] dark:text-[#8A847A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by company or role"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6] absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Clear filter"
            >
              <X className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {tabs.map((tab) => {
            const isActive = selectedFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[12px] tabular-nums ${
                    isActive ? 'text-white/85' : 'text-[#78716C] dark:text-[#8A847A]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 2. Applications List ── */}
      <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] divide-y divide-[#1C1917]/[0.08] dark:divide-[#EFECE6]/[0.08] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        {filteredApps.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#78716C] dark:text-[#8A847A] flex items-center justify-center mx-auto">
              <Briefcase className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                No applications found
              </p>
              <p className="text-[13px] text-[#78716C] dark:text-[#8A847A]">
                {searchQuery
                  ? 'Try matching another company name or role title'
                  : 'No applications match this filter'}
              </p>
            </div>
          </div>
        ) : (
          filteredApps.map((app) => {
            const label = getStatusLabel(app)
            const tone = getStatusTone(app.status)
            const isSelected = activeApp?.id === app.id

            return (
              <div
                key={app.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveApp(app)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveApp(app)
                  }
                }}
                className={`group px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] ${
                  isSelected
                    ? 'bg-[#ECFDF8]/60 dark:bg-[#0F766E]/15'
                    : 'hover:bg-[#FAF8F5] dark:hover:bg-[#24221F]/60'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-center text-[#1C1917] dark:text-[#EFECE6] font-medium text-[13px] shrink-0">
                    {(app.jobs?.company_name?.[0] || 'C').toUpperCase()}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                      {app.jobs?.company_name || 'Organization'}
                      {app.jobs?.title ? ` · ${app.jobs.title}` : ''}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                      <span className="font-mono tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                        {formatCtc(app.jobs?.compensation_ctc)}
                      </span>
                      <span>·</span>
                      <span>{app.jobs?.college_id ? 'Campus drive' : 'Global drive'}</span>
                      <span>·</span>
                      <span className="text-[#78716C] dark:text-[#8A847A]" suppressHydrationWarning>
                        Applied {formatDate(app.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-0.5 rounded-md border ${
                      tone === 'positive'
                        ? 'bg-[#ECFEFF] dark:bg-[#0F766E]/30 text-[#0F766E] dark:text-[#5EEAD4] border-[#0F766E]/20 dark:border-[#14B8A6]/30'
                        : tone === 'progress'
                          ? 'bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] border-[#0F766E]/20 dark:border-[#14B8A6]/30'
                          : tone === 'terminal'
                            ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 text-[#B91C1C] dark:text-[#FCA5A5] border-[#DC2626]/20'
                            : 'bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        tone === 'positive' || tone === 'progress'
                          ? 'bg-[#0F766E] dark:bg-[#2DD4BF]'
                          : tone === 'terminal'
                            ? 'bg-[#DC2626] dark:bg-[#F87171]'
                            : 'bg-[#78716C] dark:bg-[#8A847A]'
                      }`}
                    />
                    <span>{label}</span>
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {app.status === 'cancelled' ? (
                      <span className="text-[12px] font-medium text-[#0F766E] dark:text-[#5EEAD4] bg-[#ECFDF8] dark:bg-[#0F766E]/20 border border-[#0F766E]/20 px-2 py-0.5 rounded-md">
                        Quota safe
                      </span>
                    ) : CLOSED_STATES.has(app.status.toLowerCase()) ? null : (
                      <WithdrawButton applicationId={app.id} status={app.status} />
                    )}
                    <ChevronRight className="w-4 h-4 stroke-[1.5] text-[#78716C] dark:text-[#8A847A] group-hover:text-[#1C1917] dark:group-hover:text-[#EFECE6] transition-colors duration-150" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── 3. Slide-Over Application Inspector ── */}
      <LinearDrawer
        isOpen={!!activeApp}
        onClose={() => setActiveApp(null)}
        title={activeApp?.jobs?.company_name || 'Application Details'}
        subtitle={activeApp ? `Ref ${activeApp.id.slice(0, 8)}` : undefined}
        width="w-full sm:max-w-lg"
        className="bg-[#FAF8F5] dark:bg-[#191816] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]"
        footer={
          activeApp ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveApp(null)}
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[13px] font-medium bg-white dark:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6] border border-[#1C1917]/[0.10] dark:border-[#EFECE6]/[0.10] hover:bg-[#F3EFE9] dark:hover:bg-[#2D2A26] transition-colors duration-150 cursor-pointer flex-1"
              >
                Close
              </button>

              {!CLOSED_STATES.has(activeApp.status.toLowerCase()) &&
                !['hired', 'joined'].includes(activeApp.status.toLowerCase()) && (
                  <div className="flex-1 flex justify-end">
                    <WithdrawButton
                      applicationId={activeApp.id}
                      status={activeApp.status}
                      onSuccess={() => setActiveApp(null)}
                    />
                  </div>
                )}
            </div>
          ) : null
        }
      >
        {activeApp && (
          <div className="space-y-5">
            {/* Role Summary Card */}
            <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#12110F] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    {activeApp.jobs?.title || 'Placement Drive'}
                  </h3>
                  <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                    {activeApp.jobs?.company_name || 'Organization'}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-0.5 rounded-md border shrink-0 ${
                    getStatusTone(activeApp.status) === 'positive' ||
                    getStatusTone(activeApp.status) === 'progress'
                      ? 'bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] border-[#0F766E]/20'
                      : getStatusTone(activeApp.status) === 'terminal'
                        ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 text-[#B91C1C] dark:text-[#FCA5A5] border-[#DC2626]/20'
                        : 'bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] border-[#1C1917]/[0.08]'
                  }`}
                >
                  {getStatusLabel(activeApp)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] text-[13px]">
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[12px]">
                    Annual CTC
                  </span>
                  <span className="font-mono font-medium tabular-nums text-[#115E59] dark:text-[#5EEAD4]">
                    {formatCtc(activeApp.jobs?.compensation_ctc)}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[12px]">
                    Submitted on
                  </span>
                  <span
                    className="font-mono tabular-nums text-[#1C1917] dark:text-[#EFECE6]"
                    suppressHydrationWarning
                  >
                    {formatDate(activeApp.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recruitment Timeline */}
            <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#12110F] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Recruitment progress
                </h4>
                <span className="font-mono text-[12px] tabular-nums text-[#78716C] dark:text-[#8A847A]">
                  {activeIsClosed || activeStageIdx < 0
                    ? 'Closed'
                    : `Stage ${activeStageIdx + 1} of ${STAGES_PIPELINE.length}`}
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[#1C1917]/[0.10] dark:before:bg-[#EFECE6]/[0.10]">
                {STAGES_PIPELINE.map((stage, idx) => {
                  const isPassed = activeStageIdx > idx
                  const isCurrent = activeStageIdx === idx

                  let displayLabel = stage.label
                  if (
                    stage.key === 'stage1' &&
                    (activeApp.jobs?.custom_stages?.stage_1 ||
                      activeApp.jobs?.custom_stages?.stage_1_label)
                  ) {
                    displayLabel =
                      activeApp.jobs.custom_stages.stage_1 ||
                      activeApp.jobs.custom_stages.stage_1_label
                  } else if (
                    stage.key === 'stage2' &&
                    (activeApp.jobs?.custom_stages?.stage_2 ||
                      activeApp.jobs?.custom_stages?.stage_2_label)
                  ) {
                    displayLabel =
                      activeApp.jobs.custom_stages.stage_2 ||
                      activeApp.jobs.custom_stages.stage_2_label
                  } else if (
                    stage.key === 'stage3' &&
                    (activeApp.jobs?.custom_stages?.stage_3 ||
                      activeApp.jobs?.custom_stages?.stage_3_label)
                  ) {
                    displayLabel =
                      activeApp.jobs.custom_stages.stage_3 ||
                      activeApp.jobs.custom_stages.stage_3_label
                  }

                  return (
                    <div key={stage.key} className="relative flex items-center justify-between">
                      <div
                        className={`absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border flex items-center justify-center ${
                          isPassed
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : isCurrent
                              ? activeIsClosed
                                ? 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]'
                                : 'bg-[#ECFDF8] dark:bg-[#0F766E]/30 border-[#0F766E] dark:border-[#14B8A6] text-[#0F766E] dark:text-[#5EEAD4]'
                              : 'bg-[#FAF8F5] dark:bg-[#191816] border-[#1C1917]/20 dark:border-[#EFECE6]/20'
                        }`}
                      >
                        {isPassed ? (
                          <Check className="w-2.5 h-2.5 stroke-[2.2]" />
                        ) : isCurrent ? (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activeIsClosed ? 'bg-[#DC2626]' : 'bg-[#0F766E] dark:bg-[#2DD4BF]'
                            }`}
                          />
                        ) : null}
                      </div>

                      <span
                        className={`text-[13px] ${
                          isCurrent
                            ? 'text-[#1C1917] dark:text-[#EFECE6] font-medium'
                            : isPassed
                              ? 'text-[#57534E] dark:text-[#ACA59A]'
                              : 'text-[#78716C] dark:text-[#8A847A]'
                        }`}
                      >
                        {displayLabel}
                      </span>

                      {isCurrent && (
                        <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] border border-[#0F766E]/20">
                          Current
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cancellation / Drop Attribution */}
            {activeApp.status === 'cancelled' && (
              <div className="rounded-xl border border-[#DC2626]/20 bg-[#FEF2F2]/70 dark:bg-[#7F1D1D]/20 p-4 space-y-1.5 text-[13px]">
                <div className="flex items-center gap-2 font-medium text-[#B91C1C] dark:text-[#FCA5A5]">
                  <Ban className="w-4 h-4 stroke-[1.5]" />
                  <span>Drive cancelled by placement cell</span>
                </div>
                <p className="text-[#57534E] dark:text-[#ACA59A]">
                  {activeApp.jobs?.cancellation_reason || 'Administrative reschedule by corporate partner'}
                </p>
                <p className="text-[#0F766E] dark:text-[#5EEAD4] text-[12px] font-medium">
                  Application quota preserved · 0 strike penalty
                </p>
              </div>
            )}

            {(activeApp.status === 'dropped' || activeApp.dropped_reason) && (
              <div className="rounded-xl border border-[#B45309]/25 bg-[#FEF3C7]/60 dark:bg-[#B45309]/15 p-4 space-y-1.5 text-[13px]">
                <div className="flex items-center gap-2 font-medium text-[#B45309] dark:text-[#FCD34D]">
                  <Info className="w-4 h-4 stroke-[1.5]" />
                  <span>Closure reason</span>
                </div>
                <p className="text-[#57534E] dark:text-[#ACA59A]">
                  {formatStudentDropReason(activeApp.dropped_reason)}
                </p>
              </div>
            )}
          </div>
        )}
      </LinearDrawer>
    </div>
  )
}
