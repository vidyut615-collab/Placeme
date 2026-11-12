'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  Sparkles,
  MapPin,
  Building2,
  ExternalLink,
  FileText,
  Mail,
  Loader2,
  CheckCircle2,
  Copy,
  TrendingUp,
  Archive,
  ArchiveRestore,
  SlidersHorizontal,
  Coins,
  ChevronDown,
  AlertCircle,
  Send,
} from 'lucide-react'
import {
  searchJobsForResumeAction,
  analyzeJobMatchAction,
  generateCoverLetterAction,
  toggleArchiveSearchSessionAction,
} from './actions'
import { LinearDrawer } from '@/components/ui/linear/LinearDrawer'
import { TactileButton } from '@/components/ui/tactile/TactileButton'
import { cn } from '@/lib/utils'

export interface ScoredJob {
  id: string
  title: string
  company_name: string
  location?: string
  workplace_mode?: string
  employment_type?: string
  salary_info?: string
  skills_required?: string[]
  sources?: Array<{
    portal?: string
    url?: string
    discovered_at?: string
  }>
  description?: string
  matchScore?: number
  recommendation_reason?: string
  matchedSkillsCount?: number
  totalSkillsCount?: number
  ageMs?: number
  [key: string]: unknown
}

export interface JobMatchAnalysis {
  id?: string
  student_id?: string
  resume_id?: string
  job_lake_id?: string
  match_score?: number
  matching_skills?: string[]
  missing_skills?: string[]
  tailoring_suggestions?: Array<{
    section: string
    advice: string
  }>
  upskill_roadmap?: Array<{
    skill: string
    duration: string
    resource: string
    key_topics: string
  }>
  cover_letter?: string
  [key: string]: unknown
}

export interface StudentResumeSummary {
  id: string
  title?: string
  target_role?: string
  target_employer?: string
  created_at?: string
  [key: string]: unknown
}

interface SearchSession {
  id: string
  student_id: string
  resume_id?: string
  search_query: string
  location: string
  results_count: number
  job_limit?: number
  credits_spent: number
  is_archived?: boolean
  created_at: string
  scored_results?: ScoredJob[]
  ai_resumes?: {
    title?: string
    target_role?: string
  }
}

interface JobSearchClientProps {
  resumes: StudentResumeSummary[]
  creditBalance: number
  isActive: boolean
  initialSessions: SearchSession[]
  initialAnalyses?: JobMatchAnalysis[]
}

const POPULAR_LOCATIONS = [
  'Mumbai, Maharashtra',
  'Bengaluru, Karnataka',
  'Pune, Maharashtra',
  'Delhi NCR / Gurgaon',
  'Hyderabad, Telangana',
  'Remote India',
]

export function JobSearchClient({
  resumes,
  creditBalance: initialCredits,
  isActive,
  initialSessions,
  initialAnalyses,
}: JobSearchClientProps) {
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || '')
  const [location, setLocation] = useState('Mumbai, Maharashtra, India')
  const [jobLimit, setJobLimit] = useState<5 | 10>(5)
  const [creditBalance, setCreditBalance] = useState(initialCredits)

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [jobType, setJobType] = useState<string>('any')
  const [workplaceMode, setWorkplaceMode] = useState<string>('any')
  const [datePosted, setDatePosted] = useState<string>('any')

  // Search Sessions State
  const [sessions, setSessions] = useState<SearchSession[]>(initialSessions)
  const [showArchived, setShowArchived] = useState<boolean>(false)

  // Filter sessions by archive status
  const activeSessions = sessions.filter((s) => !s.is_archived)
  const archivedSessions = sessions.filter((s) => s.is_archived)
  const displayedSessions = showArchived ? archivedSessions : activeSessions

  const [activeSessionId, setActiveSessionId] = useState<string>(
    initialSessions.find((s) => !s.is_archived)?.id || initialSessions[0]?.id || ''
  )

  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Pre-load past analyses so they never vanish on reload
  const initialAnalysisMap: Record<string, JobMatchAnalysis> = {}
  const initialCoverMap: Record<string, string> = {}
  ;(initialAnalyses || []).forEach((a) => {
    if (a.job_lake_id) {
      initialAnalysisMap[a.job_lake_id] = a
      if (a.cover_letter) {
        initialCoverMap[a.job_lake_id] = a.cover_letter
      }
    }
  })

  // Slide-over Inspector Drawer State
  const [activeJob, setActiveJob] = useState<ScoredJob | null>(null)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'analysis' | 'email'>('overview')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analysisMap, setAnalysisMap] = useState<Record<string, JobMatchAnalysis>>(initialAnalysisMap)
  const [coverLetterMap, setCoverLetterMap] = useState<Record<string, string>>(initialCoverMap)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [copiedCover, setCopiedCover] = useState(false)

  const selectedResume = resumes.find((r) => r.id === selectedResumeId)
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ||
    displayedSessions[0] ||
    sessions[0] ||
    null
  const currentJobs: ScoredJob[] = activeSession?.scored_results || []

  const creditCost = jobLimit === 10 ? 180 : 100

  const handleSearch = async () => {
    if (!selectedResumeId) {
      setSearchError('Please select a target AI Resume first.')
      return
    }
    if (creditBalance < creditCost) {
      setSearchError(
        `Insufficient credits. Scanning ${jobLimit} jobs requires ${creditCost} credits. (Current balance: ${creditBalance})`
      )
      return
    }

    setSearchError('')
    setIsSearching(true)

    const res = await searchJobsForResumeAction({
      resumeId: selectedResumeId,
      location,
      jobLimit,
      jobType,
      workplaceMode,
      datePosted,
    })

    setIsSearching(false)

    if (res.success && res.session) {
      const newSession: SearchSession = {
        ...res.session,
        is_archived: false,
        scored_results: (res.jobs || []) as ScoredJob[],
        ai_resumes: {
          title: selectedResume?.title,
          target_role: selectedResume?.target_role,
        },
      }

      setSessions((prev) => [newSession, ...prev])
      setShowArchived(false)
      setActiveSessionId(newSession.id)

      if (res.remainingCredits !== undefined) {
        setCreditBalance(res.remainingCredits)
      }
    } else {
      setSearchError(res.error || 'Failed to search jobs')
    }
  }

  const handleToggleArchive = async (e: React.MouseEvent, sess: SearchSession) => {
    e.stopPropagation()
    const nextArchived = !sess.is_archived

    // Optimistically update
    setSessions((prev) =>
      prev.map((s) => (s.id === sess.id ? { ...s, is_archived: nextArchived } : s))
    )

    await toggleArchiveSearchSessionAction(sess.id, nextArchived)

    if (!showArchived && nextArchived && sess.id === activeSessionId) {
      const nextActive = activeSessions.find((s) => s.id !== sess.id)
      if (nextActive) {
        setActiveSessionId(nextActive.id)
      }
    }
  }

  const handleOpenDrawer = async (job: ScoredJob, tab: 'overview' | 'analysis' | 'email' = 'overview') => {
    setActiveJob(job)
    setActiveDrawerTab(tab)

    // Trigger analysis if opening analysis tab and not already cached
    if (tab === 'analysis' && !analysisMap[job.id]) {
      setAnalyzingId(job.id)
      const res = await analyzeJobMatchAction(
        selectedResumeId || activeSession?.resume_id || '',
        job.id
      )
      setAnalyzingId(null)
      if (res.success && res.data) {
        setAnalysisMap((prev) => ({ ...prev, [job.id]: res.data as JobMatchAnalysis }))
      }
    }

    // Trigger email generation if email tab opened and not already generated
    if (tab === 'email' && !coverLetterMap[job.id]) {
      setIsGeneratingCover(true)
      const res = await generateCoverLetterAction(
        selectedResumeId || activeSession?.resume_id || '',
        job.id
      )
      setIsGeneratingCover(false)
      if (res.success && res.coverLetter) {
        setCoverLetterMap((prev) => ({ ...prev, [job.id]: res.coverLetter as string }))
      }
    }
  }

  const handleSwitchDrawerTab = async (tab: 'overview' | 'analysis' | 'email') => {
    setActiveDrawerTab(tab)
    if (!activeJob) return

    if (tab === 'analysis' && !analysisMap[activeJob.id]) {
      setAnalyzingId(activeJob.id)
      const res = await analyzeJobMatchAction(
        selectedResumeId || activeSession?.resume_id || '',
        activeJob.id
      )
      setAnalyzingId(null)
      if (res.success && res.data) {
        setAnalysisMap((prev) => ({ ...prev, [activeJob.id]: res.data as JobMatchAnalysis }))
      }
    }

    if (tab === 'email' && !coverLetterMap[activeJob.id]) {
      setIsGeneratingCover(true)
      const res = await generateCoverLetterAction(
        selectedResumeId || activeSession?.resume_id || '',
        activeJob.id
      )
      setIsGeneratingCover(false)
      if (res.success && res.coverLetter) {
        setCoverLetterMap((prev) => ({ ...prev, [activeJob.id]: res.coverLetter as string }))
      }
    }
  }

  const handleGenerateCover = async (jobId: string) => {
    setIsGeneratingCover(true)
    const res = await generateCoverLetterAction(
      selectedResumeId || activeSession?.resume_id || '',
      jobId
    )
    setIsGeneratingCover(false)

    if (res.success && res.coverLetter) {
      setCoverLetterMap((prev) => ({ ...prev, [jobId]: res.coverLetter as string }))
    }
  }

  const handleCopyCover = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCover(true)
    setTimeout(() => setCopiedCover(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Page Header & Breadcrumb ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
              AI Job Search
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 font-medium">
              Off-campus intelligence
            </span>
          </div>
          <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-1">
            Real-time crawler matching verified openings across LinkedIn, Internshala, and Indian tech portals against your AI Resume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/billing"
            className="flex items-center gap-2 bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] px-3 py-1.5 rounded-lg text-xs font-mono shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-colors group"
          >
            <Coins className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            <span className="text-[#78716C] dark:text-[#8A847A]">Balance:</span>
            <span className="text-[#0F766E] dark:text-[#14B8A6] font-medium font-mono">
              {creditBalance.toLocaleString()} cr
            </span>
            <span className="text-[11px] text-[#0F766E] dark:text-[#14B8A6] group-hover:underline">
              + Top up
            </span>
          </Link>
        </div>
      </div>

      {/* ── 2. Unified AI Command Console (Option 2 Warm Paper Archetype) ── */}
      <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-4 sm:p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-end">
          {/* Resume Selector */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-[11px] font-medium text-[#57534E] dark:text-[#ACA59A] font-mono block">
              1. Target AI Resume
            </label>
            {resumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || 'Untitled'} ({r.target_role || 'General'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-amber-700 dark:text-amber-400 p-2 border border-amber-500/20 rounded-lg bg-amber-500/[0.08] font-mono flex items-center justify-between">
                <span>No AI resumes found.</span>
                <Link href="/student/ai-resume" className="underline font-semibold ml-2">
                  Create one →
                </Link>
              </div>
            )}
          </div>

          {/* Location Input with Quick City Pills */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-[#57534E] dark:text-[#ACA59A] font-mono">
                2. Target Hub / Region
              </label>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {POPULAR_LOCATIONS.slice(0, 3).map((loc) => {
                  const label = loc.split(',')[0]
                  const isMatch = location.includes(label)
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.5 rounded border transition cursor-pointer',
                        isMatch
                          ? 'bg-[#0F766E] text-white border-[#0F766E] font-medium dark:bg-[#14B8A6] dark:text-[#12110F] dark:border-[#14B8A6]'
                          : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:border-[#0F766E]/40'
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-[#78716C] dark:text-[#8A847A] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, Bengaluru, Hyderabad, Remote"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-xs text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition"
              />
            </div>
          </div>

          {/* Job Volume Toggle (5 / 10 Jobs) */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] font-medium text-[#57534E] dark:text-[#ACA59A] font-mono block">
              3. Scan Volume
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setJobLimit(5)}
                className={cn(
                  'h-9 px-2 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer',
                  jobLimit === 5
                    ? 'bg-[#1C1917] text-white dark:bg-[#EFECE6] dark:text-[#12110F] border-[#1C1917] dark:border-[#EFECE6] shadow-2xs font-semibold'
                    : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:border-[#0F766E]/40'
                )}
              >
                <span>5 Jobs</span>
                <span className={cn('text-[10px]', jobLimit === 5 ? 'opacity-80' : 'text-[#78716C]')}>
                  (100 cr)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJobLimit(10)}
                className={cn(
                  'h-9 px-2 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer',
                  jobLimit === 10
                    ? 'bg-[#1C1917] text-white dark:bg-[#EFECE6] dark:text-[#12110F] border-[#1C1917] dark:border-[#EFECE6] shadow-2xs font-semibold'
                    : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:border-[#0F766E]/40'
                )}
              >
                <span>10 Jobs</span>
                <span className={cn('text-[10px]', jobLimit === 10 ? 'opacity-80' : 'text-[#78716C]')}>
                  (180 cr)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        <div className="pt-2 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] font-mono text-[11px] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Faceted Filters</span>
            {(jobType !== 'any' || workplaceMode !== 'any' || datePosted !== 'any') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] dark:bg-[#14B8A6]" />
            )}
            <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', showFilters && 'rotate-180')} />
          </button>

          <div className="flex items-center gap-2">
            {searchError && (
              <span className="text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 stroke-[1.5] shrink-0" />
                <span>{searchError}</span>
              </span>
            )}

            <TactileButton
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={isSearching || !isActive || resumes.length === 0}
              className="text-xs bg-gradient-to-r from-[#0F766E] to-[#10B981] text-white hover:brightness-105 font-medium shadow-[0_1px_2px_rgba(15,118,110,0.25)]"
              icon={isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5 stroke-[1.5]" />}
            >
              {isSearching ? 'Scanning Portals...' : `Launch Discovery (${creditCost} cr)`}
            </TactileButton>
          </div>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">Employment Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E]"
              >
                <option value="any">Any Employment Type</option>
                <option value="internship">Internship / PPO</option>
                <option value="fresher">Fresher (0-1 Years)</option>
                <option value="full-time">Full-Time Permanent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">Workplace Mode</label>
              <select
                value={workplaceMode}
                onChange={(e) => setWorkplaceMode(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E]"
              >
                <option value="any">Any Workplace Mode</option>
                <option value="remote">Remote (Work From Home)</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-Site</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">Posting Recency</label>
              <select
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E]"
              >
                <option value="any">Any Posting Time</option>
                <option value="past_24h">Past 24 Hours</option>
                <option value="past_week">Past 7 Days</option>
                <option value="past_month">Past 30 Days</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Horizontal Stream Rail (Past Search Sessions) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] font-mono">
              Discovery Streams ({displayedSessions.length})
            </span>
            <span className="text-[#78716C] dark:text-[#8A847A] text-xs">•</span>
            <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
              {showArchived ? 'Viewing archived search streams' : 'Select any stream to inspect live AI job matches'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[11px] font-mono text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] transition cursor-pointer bg-white dark:bg-[#191816]"
          >
            {showArchived ? (
              <>
                <ArchiveRestore className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Active Streams</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Archived ({archivedSessions.length})</span>
              </>
            )}
          </button>
        </div>

        {/* Horizontal Chips Rail */}
        {displayedSessions.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] text-xs text-[#78716C] dark:text-[#8A847A]">
            {showArchived ? 'No archived discovery streams stored.' : 'No discovery searches conducted yet. Launch your first scan above.'}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {displayedSessions.map((sess) => {
              const isSelected = sess.id === activeSessionId
              const roleTitle = sess.search_query.split('in')[0].trim()
              const city = (sess.location || '').split(',')[0]

              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={cn(
                    'group shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer select-none',
                    isSelected
                      ? 'bg-[#1C1917] text-white dark:bg-[#EFECE6] dark:text-[#12110F] border-[#1C1917] dark:border-[#EFECE6] shadow-2xs font-medium'
                      : 'bg-white dark:bg-[#191816] text-[#57534E] dark:text-[#ACA59A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] hover:border-[#0F766E]/40'
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate max-w-[140px] font-medium">{roleTitle}</span>
                    <span className="opacity-40">·</span>
                    <span className="opacity-75 text-[11px] truncate max-w-[80px]">{city}</span>
                  </div>

                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-black/10 dark:text-[#12110F]'
                        : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#0F766E] dark:text-[#14B8A6]'
                    )}
                  >
                    {sess.results_count || sess.job_limit || 5}
                  </span>

                  <button
                    type="button"
                    title={sess.is_archived ? 'Restore search' : 'Archive search'}
                    onClick={(e) => handleToggleArchive(e, sess)}
                    className="opacity-40 hover:opacity-100 transition p-0.5"
                  >
                    {sess.is_archived ? (
                      <ArchiveRestore className="w-3.5 h-3.5 stroke-[1.5]" />
                    ) : (
                      <Archive className="w-3.5 h-3.5 stroke-[1.5]" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 4. Verified Openings Stream (Linear-Grade Feed) ── */}
      {activeSession && (
        <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.03)] divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06]">
          {/* Feed Header */}
          <div className="p-4 bg-[#FAF8F5]/80 dark:bg-[#12110F]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  AI Job Search for &ldquo;{activeSession.search_query}&rdquo;
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-[#191816] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                  {activeSession.location.split(',')[0]}
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-0.5 font-mono">
                Matched against: <strong className="text-[#1C1917] dark:text-[#EFECE6] font-medium">{activeSession.ai_resumes?.title || 'Selected AI Resume'}</strong>
              </p>
            </div>

            <span className="text-[11px] font-mono text-[#0F766E] dark:text-[#14B8A6] font-medium bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 px-2.5 py-1 rounded-full border border-[#0F766E]/20 dark:border-[#14B8A6]/25">
              {currentJobs.length} Opportunities Logged
            </span>
          </div>

          {/* Jobs List */}
          {currentJobs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#78716C] dark:text-[#8A847A] font-mono space-y-1">
              <p>No job listings saved in this session.</p>
              <p className="opacity-70">Launch a new search above to fetch fresh opportunities.</p>
            </div>
          ) : (
            currentJobs.map((job) => {
              const portal = job.sources?.[0]?.portal || 'LinkedIn'
              const applyUrl = job.sources?.[0]?.url || 'https://www.linkedin.com/jobs'
              const match = job.matchScore || 78

              return (
                <div
                  key={job.id}
                  className="p-4 sm:p-5 hover:bg-[#FAF8F5]/60 dark:hover:bg-[#12110F]/40 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 select-none"
                >
                  {/* Left: Job Core Info */}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    {/* Line 1: Title, Match Badge, Recommendation Reason */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        onClick={() => handleOpenDrawer(job, 'overview')}
                        className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6] hover:text-[#0F766E] dark:hover:text-[#14B8A6] cursor-pointer transition truncate"
                      >
                        {job.title}
                      </h4>

                      {/* Match Score Badge */}
                      <span
                        className={cn(
                          'text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border',
                          match >= 80
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : match >= 65
                            ? 'bg-[#0F766E]/10 text-[#0F766E] dark:bg-[#14B8A6]/15 dark:text-[#14B8A6] border-[#0F766E]/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        )}
                      >
                        {match}% Match
                      </span>

                      {/* Portal tag */}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                        via {portal}
                      </span>
                    </div>

                    {/* Line 2: Company, Location, Workplace Mode, Job Type, Salary */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-[#57534E] dark:text-[#ACA59A] font-mono">
                      <span className="flex items-center gap-1 font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        <Building2 className="w-3.5 h-3.5 text-[#78716C] dark:text-[#8A847A] stroke-[1.5]" />
                        {job.company_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#78716C] dark:text-[#8A847A] stroke-[1.5]" />
                        {job.location || 'Mumbai'}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{job.workplace_mode || 'Hybrid'}</span>
                      <span>•</span>
                      <span className="capitalize">{job.employment_type || 'Full-time'}</span>
                      <span>•</span>
                      <span className="font-medium text-[#0F766E] dark:text-[#14B8A6]">
                        {job.salary_info || 'Competitive'}
                      </span>
                    </div>

                    {/* Line 3: Skills Chips */}
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {job.skills_required.slice(0, 5).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                    <TactileButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDrawer(job, 'overview')}
                      className="text-xs font-mono"
                      icon={<FileText className="w-3.5 h-3.5 stroke-[1.5]" />}
                    >
                      Job Details
                    </TactileButton>

                    <TactileButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDrawer(job, 'analysis')}
                      className="text-xs font-mono"
                      icon={<TrendingUp className="w-3.5 h-3.5 stroke-[1.5]" />}
                    >
                      Gaps &amp; Strategy
                    </TactileButton>

                    <TactileButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDrawer(job, 'email')}
                      className="text-xs font-mono"
                      icon={<Mail className="w-3.5 h-3.5 stroke-[1.5]" />}
                    >
                      Cold Email
                    </TactileButton>

                    <a
                      href={applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:brightness-105 text-white text-xs font-medium shadow-[0_1px_2px_rgba(15,118,110,0.2)] transition-all cursor-pointer"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3 h-3 stroke-[2]" />
                    </a>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── 5. Slide-Over LinearDrawer Inspector (Zero-Context Loss) ── */}
      <LinearDrawer
        isOpen={!!activeJob}
        onClose={() => setActiveJob(null)}
        title={activeJob?.title || 'Job Overview'}
        subtitle={`${activeJob?.company_name || 'Organization'} · ${activeJob?.location || 'Pan-India'}`}
        width="lg"
      >
        {activeJob && (
          <div className="space-y-6">
            {/* Header Metadata Capsule */}
            <div className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                    {activeJob.company_name}
                  </span>
                  <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                    Discovered via {activeJob.sources?.[0]?.portal || 'Recruitment Portal'}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 px-2.5 py-1 rounded-full">
                  {activeJob.matchScore || 78}% Match
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-xs font-mono">
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[11px]">Salary / Stipend</span>
                  <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    {activeJob.salary_info || 'Competitive'}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block text-[11px]">Workplace</span>
                  <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] capitalize">
                    {activeJob.workplace_mode || 'Hybrid'} ({activeJob.employment_type || 'Full-time'})
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Inspector Tabs (3-Tab System) */}
            <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-xs">
              <button
                type="button"
                onClick={() => handleSwitchDrawerTab('overview')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 text-[12px]',
                  activeDrawerTab === 'overview'
                    ? 'bg-white dark:bg-[#191816] text-[#0F766E] dark:text-[#14B8A6] shadow-[0_1px_2px_rgba(28,25,23,0.06)] font-medium'
                    : 'text-[#78716C] dark:text-[#8A847A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                )}
              >
                <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Job Overview</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDrawerTab('analysis')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 text-[12px]',
                  activeDrawerTab === 'analysis'
                    ? 'bg-white dark:bg-[#191816] text-[#0F766E] dark:text-[#14B8A6] shadow-[0_1px_2px_rgba(28,25,23,0.06)] font-medium'
                    : 'text-[#78716C] dark:text-[#8A847A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                )}
              >
                <TrendingUp className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Gaps &amp; Strategy</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDrawerTab('email')}
                className={cn(
                  'flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 text-[12px]',
                  activeDrawerTab === 'email'
                    ? 'bg-white dark:bg-[#191816] text-[#0F766E] dark:text-[#14B8A6] shadow-[0_1px_2px_rgba(28,25,23,0.06)] font-medium'
                    : 'text-[#78716C] dark:text-[#8A847A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                )}
              >
                <Mail className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Cold Outreach</span>
              </button>
            </div>

            {/* Tab 1: Complete Job Overview & Description */}
            {activeDrawerTab === 'overview' && (
              <div className="space-y-5">
                {/* 4-Card Key Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] space-y-1">
                    <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A] uppercase tracking-wider block">Compensation</span>
                    <span className="text-xs font-medium text-[#0F766E] dark:text-[#14B8A6] font-mono block truncate">
                      {activeJob.salary_info || 'Competitive'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] space-y-1">
                    <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A] uppercase tracking-wider block">Workplace</span>
                    <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] font-mono capitalize block truncate">
                      {activeJob.workplace_mode || 'Hybrid'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] space-y-1">
                    <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A] uppercase tracking-wider block">Employment</span>
                    <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] font-mono capitalize block truncate">
                      {activeJob.employment_type || 'Full-time'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] space-y-1">
                    <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A] uppercase tracking-wider block">Location</span>
                    <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] font-mono block truncate" title={activeJob.location || 'Pan-India'}>
                      {activeJob.location || 'Pan-India'}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Reason Callout */}
                {activeJob.recommendation_reason && (
                  <div className="p-3.5 rounded-xl border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-[#0F766E]/[0.05] dark:bg-[#14B8A6]/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#0F766E] dark:text-[#14B8A6]">
                      <Sparkles className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
                      <span>Recommendation Rationale</span>
                    </div>
                    <p className="text-xs text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                      {activeJob.recommendation_reason}
                    </p>
                  </div>
                )}

                {/* Required Skills & Tech Stack Matrix */}
                {activeJob.skills_required && activeJob.skills_required.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Required Tech Stack &amp; Skills
                      </span>
                      <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A]">
                        {activeJob.skills_required.length} competencies
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeJob.skills_required.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-xs px-2.5 py-1 rounded-md font-mono font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Job Description & Scope */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      Full Job Description &amp; Scope
                    </span>
                    <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A]">
                      Listing Feed
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-xs leading-relaxed text-[#57534E] dark:text-[#ACA59A] whitespace-pre-line font-sans max-h-[380px] overflow-y-auto scrollbar-thin">
                    {activeJob.description || 'No detailed job description provided by the source listing.'}
                  </div>
                </div>

                {/* Tactical Transition Bar */}
                <div className="p-3.5 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                      Evaluate Candidate Fit
                    </span>
                    <span className="text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono">
                      Check your missing skills or draft a personalized cold email
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TactileButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchDrawerTab('analysis')}
                      className="text-xs font-mono"
                      icon={<TrendingUp className="w-3.5 h-3.5 stroke-[1.5]" />}
                    >
                      Check Gaps
                    </TactileButton>

                    <TactileButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchDrawerTab('email')}
                      className="text-xs font-mono"
                      icon={<Mail className="w-3.5 h-3.5 stroke-[1.5]" />}
                    >
                      Cold Email
                    </TactileButton>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Skill Gaps & Resume Tailoring */}
            {activeDrawerTab === 'analysis' && (
              <div className="space-y-5">
                {analyzingId === activeJob.id ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0F766E] dark:text-[#14B8A6] mx-auto" />
                    <p className="text-xs text-[#78716C] dark:text-[#8A847A] font-mono">
                      Analyzing resume against {activeJob.company_name}&apos;s tech stack...
                    </p>
                  </div>
                ) : analysisMap[activeJob.id] ? (
                  <div className="space-y-5">
                    {/* Strengths vs Missing Gaps Bento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Matching Skills */}
                      <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                          <span>Matching Strengths</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(analysisMap[activeJob.id].matching_skills || []).map((s: string, i: number) => (
                            <span
                              key={i}
                              className="bg-white dark:bg-[#191816] text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-500/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Gaps */}
                      <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <TrendingUp className="w-4 h-4 stroke-[1.5]" />
                          <span>Identified Gaps</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(analysisMap[activeJob.id].missing_skills || []).map((s: string, i: number) => (
                            <span
                              key={i}
                              className="bg-white dark:bg-[#191816] text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono border border-amber-500/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Resume Tailoring Advice */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] dark:text-[#8A847A] font-medium block">
                        Recommended Resume Adjustments
                      </span>
                      <div className="space-y-2">
                        {(analysisMap[activeJob.id].tailoring_suggestions || []).map((item, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-xs space-y-1"
                          >
                            <span className="font-medium text-[#0F766E] dark:text-[#14B8A6] font-mono block">
                              {item.section}
                            </span>
                            <p className="text-[#57534E] dark:text-[#ACA59A] text-[11px] leading-relaxed">
                              {item.advice}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fast-Track Learning Roadmap */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] dark:text-[#8A847A] font-medium block">
                        Interview Prep &amp; Fast-Track Roadmap
                      </span>
                      <div className="space-y-2">
                        {(analysisMap[activeJob.id].upskill_roadmap || []).map((road, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-medium">
                              <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">{road.skill}</span>
                              <span className="font-mono text-[10px] text-[#78716C] dark:text-[#8A847A] bg-[#FAF8F5] dark:bg-[#12110F] px-2 py-0.5 rounded border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                                {road.duration}
                              </span>
                            </div>
                            <p className="text-[#57534E] dark:text-[#ACA59A] text-[11px]">
                              <strong>Core focus:</strong> {road.key_topics}
                            </p>
                            <p className="text-[#78716C] dark:text-[#8A847A] text-[10px] font-mono">
                              Guide: {road.resource}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Direct Bridge to AI Resume Studio */}
                    <div className="p-4 rounded-xl border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-[#0F766E]/[0.05] dark:bg-[#14B8A6]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-[#0F766E] dark:text-[#14B8A6] block">
                          Tailor AI Resume for this Opening
                        </span>
                        <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A]">
                          Launch LaTeX compiler with this role&apos;s requirements prefilled.
                        </p>
                      </div>
                      <Link
                        href="/student/ai-resume"
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-medium shrink-0 transition shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Open Resume Studio</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[#78716C] dark:text-[#8A847A] font-mono">
                    Telemetry not yet loaded. Click Gaps &amp; Strategy above to analyze.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Recruiter Cold Outreach */}
            {activeDrawerTab === 'email' && (
              <div className="space-y-4">
                {isGeneratingCover ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0F766E] dark:text-[#14B8A6] mx-auto" />
                    <p className="text-xs text-[#78716C] dark:text-[#8A847A] font-mono">
                      Drafting customized cold pitch based on your projects and {activeJob.company_name}&apos;s stack...
                    </p>
                  </div>
                ) : coverLetterMap[activeJob.id] ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] font-mono">
                        Personalized Pitch (Under 160 Words)
                      </span>
                      <div className="flex items-center gap-2">
                        <TactileButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCover(coverLetterMap[activeJob.id])}
                          className="h-7 text-xs font-mono"
                          icon={copiedCover ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
                        >
                          {copiedCover ? 'Copied' : 'Copy Pitch'}
                        </TactileButton>

                        <a
                          href={`mailto:?subject=${encodeURIComponent(
                            `Application: ${activeJob.title} - Candidate Pitch`
                          )}&body=${encodeURIComponent(coverLetterMap[activeJob.id])}`}
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] text-xs font-mono text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] transition"
                        >
                          <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Open Mail</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] font-mono text-xs whitespace-pre-wrap leading-relaxed text-[#1C1917] dark:text-[#EFECE6] select-all shadow-2xs">
                      {coverLetterMap[activeJob.id]}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3 border border-dashed border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-xl p-6 bg-white dark:bg-[#191816]">
                    <Mail className="w-8 h-8 text-[#78716C] dark:text-[#8A847A] mx-auto stroke-[1.5]" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Generate High-Response Cold Pitch
                      </p>
                      <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                        Synthesize a 160-word recruiter email highlighting your actual verified portfolio.
                      </p>
                    </div>
                    <TactileButton
                      size="sm"
                      variant="primary"
                      onClick={() => handleGenerateCover(activeJob.id)}
                      className="text-xs bg-[#0F766E] hover:bg-[#115E59] text-white font-medium mx-auto shadow-2xs"
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Draft Cold Pitch (Free)
                    </TactileButton>
                  </div>
                )}
              </div>
            )}

            {/* Sticky Drawer Footer Actions */}
            <div className="pt-4 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-between gap-3">
              <TactileButton
                variant="outline"
                size="sm"
                onClick={() => setActiveJob(null)}
                className="w-full text-xs font-mono"
              >
                Close Inspector
              </TactileButton>

              <a
                href={activeJob.sources?.[0]?.url || 'https://www.linkedin.com/jobs'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-4 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:brightness-105 text-white text-xs font-medium shadow-[0_1px_2px_rgba(15,118,110,0.25)] transition cursor-pointer"
              >
                <span>Apply on {activeJob.sources?.[0]?.portal || 'Portal'}</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2]" />
              </a>
            </div>
          </div>
        )}
      </LinearDrawer>
    </div>
  )
}
