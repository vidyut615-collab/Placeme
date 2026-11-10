'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  Sparkles,
  MapPin,
  Building2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Mail,
  Loader2,
  CheckCircle2,
  Copy,
  ChevronRight,
  TrendingUp,
  History,
  Briefcase,
  Layers,
  ArrowRight,
  Calendar,
  Archive,
  ArchiveRestore,
  SlidersHorizontal,
  Coins,
  ChevronDown,
  BookOpen,
  Send,
  AlertCircle,
  Tag
} from 'lucide-react'
import {
  searchJobsForResumeAction,
  analyzeJobMatchAction,
  generateCoverLetterAction,
  toggleArchiveSearchSessionAction,
} from './actions'
import { LinearDrawer } from '@/components/ui/linear/LinearDrawer'
import { TactileButton } from '@/components/ui/tactile/TactileButton'

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
  scored_results?: any[]
  ai_resumes?: {
    title?: string
    target_role?: string
  }
}

interface JobSearchClientProps {
  resumes: any[]
  creditBalance: number
  isActive: boolean
  initialSessions: SearchSession[]
  initialAnalyses?: any[]
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
  const initialAnalysisMap: Record<string, any> = {}
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
  const [activeJob, setActiveJob] = useState<any | null>(null)
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'analysis' | 'email'>('overview')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analysisMap, setAnalysisMap] = useState<Record<string, any>>(initialAnalysisMap)
  const [coverLetterMap, setCoverLetterMap] = useState<Record<string, string>>(initialCoverMap)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [copiedCover, setCopiedCover] = useState(false)

  const selectedResume = resumes.find((r) => r.id === selectedResumeId)
  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ||
    displayedSessions[0] ||
    sessions[0] ||
    null
  const currentJobs: any[] = activeSession?.scored_results || []

  const creditCost = jobLimit === 10 ? 180 : 100

  const handleSearch = async () => {
    if (!selectedResumeId) {
      setSearchError('Please select an AI Resume first.')
      return
    }
    if (creditBalance < creditCost) {
      setSearchError(
        `Insufficient credits. Finding ${jobLimit} jobs requires ${creditCost} credits. (You have ${creditBalance})`
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
        scored_results: res.jobs || [],
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

  const handleOpenDrawer = async (job: any, tab: 'overview' | 'analysis' | 'email' = 'overview') => {
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
        setAnalysisMap((prev) => ({ ...prev, [job.id]: res.data }))
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
        setCoverLetterMap((prev) => ({ ...prev, [job.id]: res.coverLetter }))
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
        setAnalysisMap((prev) => ({ ...prev, [activeJob.id]: res.data }))
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
        setCoverLetterMap((prev) => ({ ...prev, [activeJob.id]: res.coverLetter }))
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
      setCoverLetterMap((prev) => ({ ...prev, [jobId]: res.coverLetter }))
    }
  }

  const handleCopyCover = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCover(true)
    setTimeout(() => setCopiedCover(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Linear Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              AI Job Discovery & Radar
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 font-semibold">
              Off-Campus Intelligence
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Discover verified jobs across LinkedIn, Internshala, and Indian portals aligned with your AI Resume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/student/billing"
            className="flex items-center gap-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono shadow-2xs transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
            <span className="text-zinc-500">Balance:</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold font-mono">
              {creditBalance} Credits
            </span>
          </Link>
        </div>
      </div>

      {/* ── 2. Unified AI Command Console (Compact Linear Form) ── */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-end">
          {/* Resume Selector */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono block">
              1. Target AI Resume
            </label>
            {resumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title || 'Untitled'} ({r.target_role || 'General'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-amber-700 dark:text-amber-300 p-2 border border-amber-200 dark:border-amber-900/50 rounded-lg bg-amber-50 dark:bg-amber-950/20 font-mono">
                No resumes compiled yet. Build one in AI Resume.
              </div>
            )}
          </div>

          {/* Location Input with Quick Pills */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                2. Target Hub / Region
              </label>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {POPULAR_LOCATIONS.slice(0, 3).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border transition cursor-pointer ${
                      location.includes(loc.split(',')[0])
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                    }`}
                  >
                    {loc.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra, India"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
              />
            </div>
          </div>

          {/* Job Volume Toggle (5 / 10 Jobs) */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono block">
              3. Scan Volume
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setJobLimit(5)}
                className={`h-9 px-2 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  jobLimit === 5
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs font-bold'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                }`}
              >
                <span>5 Jobs</span>
                <span className={`text-[10px] ${jobLimit === 5 ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                  (100 cr)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setJobLimit(10)}
                className={`h-9 px-2 rounded-lg border text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  jobLimit === 10
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-2xs font-bold'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                }`}
              >
                <span>10 Jobs</span>
                <span className={`text-[10px] ${jobLimit === 10 ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                  (180 cr)
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-mono text-[11px] cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Faceted Filters</span>
            {(jobType !== 'any' || workplaceMode !== 'any' || datePosted !== 'any') && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            {searchError && (
              <span className="text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 stroke-[1.5]" />
                {searchError}
              </span>
            )}

            <TactileButton
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={isSearching || !isActive || resumes.length === 0}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
              icon={isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5 stroke-[1.5]" />}
            >
              {isSearching ? 'Scanning Portals...' : `Launch Discovery (${creditCost} cr)`}
            </TactileButton>
          </div>
        </div>

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-500">Employment Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="any">Any Employment Type</option>
                <option value="internship">Internship / PPO</option>
                <option value="fresher">Fresher (0-1 Years)</option>
                <option value="full-time">Full-Time Permanent</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-500">Workplace Mode</label>
              <select
                value={workplaceMode}
                onChange={(e) => setWorkplaceMode(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="any">Any Mode</option>
                <option value="remote">Remote (Work From Home)</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-Site</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-zinc-500">Posting Recency</label>
              <select
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="any">Any Time</option>
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
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 font-mono">
              Discovery Streams ({displayedSessions.length})
            </span>
            <span className="text-zinc-400 dark:text-zinc-600 text-xs">•</span>
            <span className="text-[11px] text-zinc-500">
              {showArchived ? 'Viewing archived search batches' : 'Click any batch to inspect its live radar'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
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
          <div className="p-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs text-zinc-500">
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
                  className={`group shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-2xs font-semibold'
                      : 'bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate max-w-[140px] font-medium">{roleTitle}</span>
                    <span className="opacity-50">·</span>
                    <span className="opacity-75 text-[11px] truncate max-w-[80px]">{city}</span>
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
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
        <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30 overflow-hidden shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {/* Feed Header */}
          <div className="p-4 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Radar Feed for &ldquo;{activeSession.search_query}&rdquo;
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {activeSession.location.split(',')[0]}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                Matched against: <strong className="text-zinc-800 dark:text-zinc-200">{activeSession.ai_resumes?.title || 'Selected AI Resume'}</strong>
              </p>
            </div>

            <span className="text-[11px] font-mono text-zinc-500 font-medium">
              {currentJobs.length} Opportunities Logged
            </span>
          </div>

          {/* Jobs List */}
          {currentJobs.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-500 font-mono space-y-1">
              <p>No job listings saved in this session.</p>
              <p className="text-zinc-400">Launch a new search above to fetch fresh opportunities.</p>
            </div>
          ) : (
            currentJobs.map((job) => {
              const portal = job.sources?.[0]?.portal || 'LinkedIn'
              const applyUrl = job.sources?.[0]?.url || 'https://www.linkedin.com/jobs'
              const match = job.matchScore || 78

              return (
                <div
                  key={job.id}
                  className="p-4 sm:p-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 select-none"
                >
                  {/* Left: Job Core Info */}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    {/* Line 1: Title, Match Badge, Recommendation Reason */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        onClick={() => handleOpenDrawer(job, 'overview')}
                        className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-300 cursor-pointer transition truncate"
                      >
                        {job.title}
                      </h4>

                      {/* Match Score Badge */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          match >= 80
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                            : match >= 65
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                        }`}
                      >
                        {match}% Match
                      </span>

                      {/* Portal tag */}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                        via {portal}
                      </span>
                    </div>

                    {/* Line 2: Company, Location, Workplace Mode, Job Type, Salary */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      <span className="flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400 stroke-[1.5]" />
                        {job.company_name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400 stroke-[1.5]" />
                        {job.location || 'Mumbai'}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{job.workplace_mode || 'Hybrid'}</span>
                      <span>•</span>
                      <span className="capitalize">{job.employment_type || 'Full-time'}</span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {job.salary_info || 'Competitive'}
                      </span>
                    </div>

                    {/* Line 3: Skills Chips */}
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {job.skills_required.slice(0, 5).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-zinc-200/60 dark:border-zinc-700/60"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800">
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
                      Gaps & Tailor
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
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold shadow-2xs transition-all"
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
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                    {activeJob.company_name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Discovered via {activeJob.sources?.[0]?.portal || 'Recruitment Portal'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full">
                  {activeJob.matchScore || 78}% Match
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Salary / Stipend</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {activeJob.salary_info || 'Competitive'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Workplace</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                    {activeJob.workplace_mode || 'Hybrid'} ({activeJob.employment_type || 'Full-time'})
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Inspector Tabs (3-Tab System) */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => handleSwitchDrawerTab('overview')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeDrawerTab === 'overview'
                    ? 'bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Job Overview</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDrawerTab('analysis')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeDrawerTab === 'analysis'
                    ? 'bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Gaps & Strategy</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchDrawerTab('email')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeDrawerTab === 'email'
                    ? 'bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Cold Outreach</span>
              </button>
            </div>

            {/* Tab 1: Complete Job Overview & Raw Description Preview */}
            {activeDrawerTab === 'overview' && (
              <div className="space-y-5">
                {/* 4-Card Key Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Compensation</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono block truncate">
                      {activeJob.salary_info || 'Competitive'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Workplace</span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono capitalize block truncate">
                      {activeJob.workplace_mode || 'Hybrid'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Employment</span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono capitalize block truncate">
                      {activeJob.employment_type || 'Full-time'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Location</span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono block truncate" title={activeJob.location || 'Pan-India'}>
                      {activeJob.location || 'Pan-India'}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Reason Callout */}
                {activeJob.recommendation_reason && (
                  <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 dark:text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
                      <span>Recommendation Rationale</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {activeJob.recommendation_reason}
                    </p>
                  </div>
                )}

                {/* Required Skills & Tech Stack Matrix */}
                {activeJob.skills_required && activeJob.skills_required.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Required Tech Stack & Skills
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {activeJob.skills_required.length} competencies
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeJob.skills_required.map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 text-xs px-2.5 py-1 rounded-md font-mono font-medium"
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
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Full Job Description & Role Overview
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Listing Feed
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line font-sans max-h-[380px] overflow-y-auto scrollbar-thin">
                    {activeJob.description || 'No detailed job description provided by the source listing.'}
                  </div>
                </div>

                {/* Tactical Transition Bar */}
                <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      Evaluate Candidate Fit
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
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
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    <p className="text-xs text-zinc-500 font-mono">
                      Analyzing resume against {activeJob.company_name}&apos;s tech stack...
                    </p>
                  </div>
                ) : analysisMap[activeJob.id] ? (
                  <div className="space-y-5">
                    {/* Strengths vs Missing Gaps Bento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Matching Skills */}
                      <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                          <span>Matching Strengths</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(analysisMap[activeJob.id].matching_skills || []).map((s: string, i: number) => (
                            <span
                              key={i}
                              className="bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-200 dark:border-emerald-800"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Gaps */}
                      <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          <TrendingUp className="w-4 h-4 stroke-[1.5]" />
                          <span>Identified Gaps</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(analysisMap[activeJob.id].missing_skills || []).map((s: string, i: number) => (
                            <span
                              key={i}
                              className="bg-white dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded text-[11px] font-mono border border-amber-200 dark:border-amber-800"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Resume Tailoring Advice */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
                        Recommended Resume Adjustments
                      </span>
                      <div className="space-y-2">
                        {(analysisMap[activeJob.id].tailoring_suggestions || []).map((item: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs space-y-1"
                          >
                            <span className="font-semibold text-purple-700 dark:text-purple-400 font-mono block">
                              {item.section}
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                              {item.advice}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fast-Track Learning Roadmap */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
                        Interview Prep &amp; Fast-Track Roadmap
                      </span>
                      <div className="space-y-2">
                        {(analysisMap[activeJob.id].upskill_roadmap || []).map((road: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-medium">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{road.skill}</span>
                              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                {road.duration}
                              </span>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                              <strong>Core focus:</strong> {road.key_topics}
                            </p>
                            <p className="text-zinc-500 text-[10px] font-mono">
                              Guide: {road.resource}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Direct Bridge to AI Resume Studio */}
                    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-purple-900 dark:text-purple-200 block">
                          Tailor AI Resume for this Opening
                        </span>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          Launch LaTeX compiler with this role requirements prefilled.
                        </p>
                      </div>
                      <Link
                        href="/student/ai-resume"
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shrink-0 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Open Resume Studio</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                    Failed to load telemetry. Click Gaps &amp; Tailor to re-analyze.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Recruiter Cold Outreach */}
            {activeDrawerTab === 'email' && (
              <div className="space-y-4">
                {isGeneratingCover ? (
                  <div className="py-12 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    <p className="text-xs text-zinc-500 font-mono">
                      Drafting customized cold pitch based on your projects and {activeJob.company_name}&apos;s stack...
                    </p>
                  </div>
                ) : coverLetterMap[activeJob.id] ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
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
                          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                          <Send className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Open Mail</span>
                        </a>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200 select-all shadow-2xs">
                      {coverLetterMap[activeJob.id]}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-3 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                    <Mail className="w-8 h-8 text-zinc-400 mx-auto stroke-[1.5]" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Generate High-Response Cold Pitch
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Synthesize a 160-word recruiter email highlighting your actual verified portfolio.
                      </p>
                    </div>
                    <TactileButton
                      size="sm"
                      variant="primary"
                      onClick={() => handleGenerateCover(activeJob.id)}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium mx-auto"
                      icon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Draft Cold Pitch (Free)
                    </TactileButton>
                  </div>
                )}
              </div>
            )}

            {/* Sticky Drawer Footer Actions */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
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
                className="inline-flex items-center justify-center gap-1.5 w-full h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold shadow-2xs transition"
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
