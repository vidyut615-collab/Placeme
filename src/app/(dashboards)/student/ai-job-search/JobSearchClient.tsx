'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'
import {
  searchJobsForResumeAction,
  analyzeJobMatchAction,
  generateCoverLetterAction,
  toggleArchiveSearchSessionAction,
} from './actions'

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
  'Mumbai, Maharashtra, India',
  'Mumbai (BKC / Andheri / Powai)',
  'Navi Mumbai / Thane',
  'Pune, Maharashtra',
  'Bengaluru, Karnataka',
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

  // Detailed Gap / Cold Email Modal State
  const [activeJob, setActiveJob] = useState<any | null>(null)
  const [activeModalTab, setActiveModalTab] = useState<'analysis' | 'email'>('analysis')
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

  const creditCost = jobLimit === 10 ? 20 : 10

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

    // Call server action to persist in database
    await toggleArchiveSearchSessionAction(sess.id, nextArchived)

    // If archiving the currently active session in active view, switch to next available
    if (!showArchived && nextArchived && sess.id === activeSessionId) {
      const nextActive = activeSessions.find((s) => s.id !== sess.id)
      if (nextActive) {
        setActiveSessionId(nextActive.id)
      }
    }
  }

  const handleOpenJobModal = async (job: any, tab: 'analysis' | 'email' = 'analysis') => {
    setActiveJob(job)
    setActiveModalTab(tab)

    // Trigger analysis if not already cached (Free - 0 Credits)
    if (!analysisMap[job.id]) {
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

    // Trigger email generation if email tab opened and not already generated (Free - 0 Credits)
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
    <div className="space-y-8">
      {/* 1. Page Header with Credit Counter in Top-Right */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <Compass className="w-8 h-8 text-purple-600" /> AI Job Search
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Discover active, verified off-campus jobs tailored directly to your AI Resume.
          </p>
        </div>

        {/* Top-Right Credit Counter Badge */}
        <div className="flex items-center gap-2.5 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 px-4 py-2 rounded-full shadow-xs">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {creditBalance} Available Credits
          </span>
        </div>
      </div>

      {/* 2. Search Configuration Console Card */}
      <Card className="border-purple-100 dark:border-purple-950/60 shadow-sm bg-white dark:bg-zinc-900/90 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50/40 via-white to-blue-50/30 dark:from-purple-950/20 dark:via-zinc-900 dark:to-blue-950/10 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Briefcase className="w-5 h-5 text-purple-600" /> Configure Job Search
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Scans LinkedIn, Internshala, and Indian portals for live opportunities matching your specific skills.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-5">
          {/* Primary Row: Resume, City, Number of Jobs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Field 1: Match Against Which Resume */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                1. Select AI Resume
              </label>
              {resumes.length > 0 ? (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title || 'Untitled'} ({r.target_role || 'General'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-amber-600 p-2.5 border border-amber-200 rounded-md bg-amber-50 dark:bg-amber-950/20">
                  No AI Resumes created yet. Please create one in the AI Resume tab.
                </div>
              )}
              {selectedResume && (
                <div className="text-xs text-zinc-500 pt-0.5">
                  Target Role:{' '}
                  <strong className="text-purple-600 dark:text-purple-400">
                    {selectedResume.target_role || 'Software Engineer'}
                  </strong>
                </div>
              )}
            </div>

            {/* Field 2: Target City / Region */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                2. Target City / Region
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Maharashtra, India"
                  className="pl-9 h-10 text-sm"
                />
              </div>

              {/* Quick Select Location Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-zinc-400">Quick:</span>
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      location === loc
                        ? 'bg-purple-600 text-white border-purple-600 font-medium'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-purple-300'
                    }`}
                  >
                    {loc.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Number of Jobs to Find (5 or 10) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                3. Number of Jobs
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJobLimit(5)}
                  className={`h-10 px-3 rounded-md border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    jobLimit === 5
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-purple-300'
                  }`}
                >
                  <span>5 Jobs</span>
                  <span
                    className={`text-[10px] ${
                      jobLimit === 5 ? 'text-purple-100' : 'text-zinc-400'
                    }`}
                  >
                    10 Credits
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setJobLimit(10)}
                  className={`h-10 px-3 rounded-md border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    jobLimit === 10
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-purple-300'
                  }`}
                >
                  <span>10 Jobs</span>
                  <span
                    className={`text-[10px] ${
                      jobLimit === 10 ? 'text-purple-100' : 'text-zinc-400'
                    }`}
                  >
                    20 Credits
                  </span>
                </button>
              </div>
              <div className="text-[11px] text-zinc-400 text-center">
                Detailed gap analysis &amp; cover letters are free.
              </div>
            </div>
          </div>

          {/* Secondary Filter Row: Job Type, Workplace Mode, Date Posted */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Filter 1: Job Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" /> Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="any">Any Job Type</option>
                <option value="internship">Internship / PPO</option>
                <option value="fresher">Fresher (0–1 Years)</option>
                <option value="full-time">Full-Time Permanent</option>
              </select>
            </div>

            {/* Filter 2: Workplace Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" /> Workplace Mode
              </label>
              <select
                value={workplaceMode}
                onChange={(e) => setWorkplaceMode(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="any">Any Work Mode</option>
                <option value="remote">Remote (Work From Home)</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-Site</option>
              </select>
            </div>

            {/* Filter 3: Date Posted */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" /> Date Posted
              </label>
              <select
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="any">Anytime</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
              </select>
            </div>
          </div>

          {searchError && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200">
              {searchError}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-zinc-50/70 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 py-3 px-6">
          <div className="text-xs text-zinc-500">
            Scanning for: <strong>{selectedResume?.target_role || 'Software Engineer'}</strong> in{' '}
            <strong>{location.split(',')[0]}</strong>
            {workplaceMode !== 'any' && (
              <span className="capitalize"> • {workplaceMode}</span>
            )}
            {jobType !== 'any' && <span className="capitalize"> • {jobType}</span>}
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching || !isActive || resumes.length === 0}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white gap-2 font-semibold px-6 shadow-xs"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Finding Jobs with AI...
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" /> Find {jobLimit} Relevant Jobs ({creditCost}{' '}
                Credits)
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* 3. Structured Searches & Results Section */}
      <div className="space-y-5">
        {/* Searches Bar Header with Archive Toggle Button on the Right */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              {showArchived ? 'Archived Searches' : 'Your AI Job Searches'} (
              {displayedSessions.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {showArchived
                ? 'These are your archived searches. Click the restore icon to move any back to active.'
                : 'Click any past search session below to view its verified job recommendations.'}
            </p>
          </div>

          {/* Show Archive Button where user marked in red */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className={`h-8 text-xs gap-1.5 font-medium ${
                showArchived
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-purple-300'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              {showArchived
                ? 'View Active Searches'
                : `Show Archived (${archivedSessions.length})`}
            </Button>
          </div>
        </div>

        {displayedSessions.length === 0 ? (
          <div className="p-12 border-2 border-dashed rounded-xl text-center space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30">
            {showArchived ? (
              <>
                <Archive className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                  No Archived Searches
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  When you archive previous searches using the archive icon on each card, they will appear here.
                </p>
              </>
            ) : (
              <>
                <Compass className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
                <h3 className="font-semibold text-base text-zinc-800 dark:text-zinc-200">
                  No Active AI Job Searches
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Select your AI Resume and target city above, then click Find Relevant Jobs to launch your first off-campus search.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Session Selector Pills / Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedSessions.map((sess) => {
                const isSelected = sess.id === activeSessionId
                const dateStr = new Date(sess.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 relative ${
                      isSelected
                        ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 dark:border-purple-500 shadow-xs ring-2 ring-purple-500/30'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-200 hover:bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {sess.search_query}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0 text-zinc-400" />
                          <span className="truncate">{sess.location.split(',')[0]}</span>
                        </div>
                      </div>

                      {/* Jobs Count Badge + Archive Toggle Icon */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] shrink-0 font-bold ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {sess.results_count || sess.job_limit || 5} Jobs
                        </Badge>

                        {/* Archive / Unarchive Button */}
                        <span
                          role="button"
                          tabIndex={0}
                          title={sess.is_archived ? 'Restore search' : 'Archive search'}
                          onClick={(e) => handleToggleArchive(e, sess)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleToggleArchive(e as any, sess)
                            }
                          }}
                          className="p-1 rounded-md text-zinc-400 hover:text-purple-600 hover:bg-purple-100/50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {sess.is_archived ? (
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 w-full pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="truncate">
                        Resume: {sess.ai_resumes?.title || 'Selected Resume'}
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 shrink-0">
                          Viewing Openings ↓
                        </span>
                      ) : (
                        <span className="shrink-0">{dateStr}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Active Search Results Details: Unified Seamless Workspace Panel */}
            {activeSession && (
              <div className="mt-3 bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/80 rounded-2xl shadow-xs overflow-hidden">
                {/* Seamless Header */}
                <div className="bg-gradient-to-r from-purple-50/90 via-purple-50/40 to-white dark:from-purple-950/40 dark:via-zinc-900 dark:to-zinc-900 border-b border-purple-100 dark:border-purple-900/50 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-50">
                          Verified Openings for &ldquo;{activeSession.search_query}&rdquo;
                        </h3>
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border-0"
                        >
                          {activeSession.location.split(',')[0]}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Matched against resume:{' '}
                        <strong className="text-zinc-700 dark:text-zinc-200">
                          {activeSession.ai_resumes?.title || 'Active Resume'}
                        </strong>
                        <span className="mx-1.5">•</span>
                        <span>{activeSession.credits_spent} Credits unlocked</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1">
                      {currentJobs.length} Verified Openings
                    </Badge>
                  </div>
                </div>

                {/* Job Rows List */}
                {currentJobs.length === 0 ? (
                  <div className="p-10 text-center text-zinc-500 text-sm">
                    No individual job records stored for this session. Run a new search above to fetch fresh opportunities!
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {currentJobs.map((job) => {
                      const portal = job.sources?.[0]?.portal || 'LinkedIn'
                      const applyUrl = job.sources?.[0]?.url || 'https://www.linkedin.com/jobs'
                      const match = job.matchScore || 75

                      return (
                        <div
                          key={job.id}
                          className="p-4 sm:p-5 hover:bg-purple-50/20 dark:hover:bg-purple-950/10 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                        >
                          {/* Left: Job Core Info */}
                          <div className="flex-1 min-w-0 space-y-1.5 w-full">
                            {/* Line 1: Title, Match Badge, Source Portal */}
                            <div className="flex flex-wrap items-center gap-2">
                              <h4
                                onClick={() => handleOpenJobModal(job, 'analysis')}
                                className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 hover:text-purple-600 cursor-pointer transition-colors"
                              >
                                {job.title}
                              </h4>

                              {/* Match Score Badge */}
                              <Badge
                                className={`text-[11px] font-bold px-2 py-0.5 shrink-0 ${
                                  match >= 80
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                                    : match >= 65
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                                }`}
                              >
                                {match}% Match
                              </Badge>

                              <Badge
                                variant="outline"
                                className="text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                              >
                                via {portal}
                              </Badge>
                            </div>

                            {/* Line 2: Company, Location, Workplace Mode, Job Type, Salary */}
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                              <span className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-semibold">
                                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                {job.company_name}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-400" />
                                {job.location || 'Mumbai'}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="capitalize">{job.workplace_mode || 'hybrid'}</span>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="capitalize">{job.employment_type || 'full-time'}</span>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                                {job.salary_info || 'Competitive'}
                              </span>
                            </div>

                            {/* Line 3: Skills Chips + Short Snippet */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {job.skills_required && job.skills_required.length > 0 && (
                                <>
                                  {job.skills_required.slice(0, 4).map((s: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded text-[11px] font-medium"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </>
                              )}
                              {job.description && (
                                <span className="text-xs text-zinc-400 line-clamp-1 max-w-xl hidden xl:inline-block ml-1">
                                  — {job.description.replace(/\s+/g, ' ').slice(0, 110)}...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions row */}
                          <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800">
                            {/* Free Gap & Tailoring Modal Trigger */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenJobModal(job, 'analysis')}
                              className="h-8 text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 font-medium whitespace-nowrap"
                            >
                              <TrendingUp className="w-3.5 h-3.5" /> Gaps &amp; Tailor
                            </Button>

                            {/* Free Cold Email Modal Trigger */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenJobModal(job, 'email')}
                              className="h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 font-medium whitespace-nowrap"
                            >
                              <Mail className="w-3.5 h-3.5" /> Cold Email
                            </Button>

                            {/* Direct Apply Button */}
                            <a
                              href={applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                            >
                              Apply <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Modal: Detailed Gap Analysis & Cold Email Generator (Free - 0 Credits) */}
      {activeJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start bg-gradient-to-r from-purple-50/50 via-white to-zinc-50 dark:from-purple-950/20 dark:via-zinc-900 dark:to-zinc-900">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  {activeJob.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {activeJob.company_name} • {activeJob.location} •{' '}
                  <span className="text-emerald-600 font-semibold">Included Free</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveJob(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveModalTab('analysis')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
                  activeModalTab === 'analysis'
                    ? 'border-purple-600 text-purple-600 font-bold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Skill Gaps &amp; Resume Tailoring
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModalTab('email')
                  if (!coverLetterMap[activeJob.id]) {
                    handleGenerateCover(activeJob.id)
                  }
                }}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
                  activeModalTab === 'email'
                    ? 'border-purple-600 text-purple-600 font-bold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Recruiter Cold Email
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
              {activeModalTab === 'analysis' ? (
                <>
                  {analyzingId === activeJob.id ? (
                    <div className="py-12 text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                      <p className="text-xs text-zinc-500">
                        Analyzing your resume against {activeJob.company_name}&apos;s tech stack...
                      </p>
                    </div>
                  ) : analysisMap[activeJob.id] ? (
                    <div className="space-y-5">
                      {/* Match Score & Status */}
                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                        <div>
                          <div className="text-xs font-semibold text-purple-900 dark:text-purple-300">
                            Resume Compatibility Score
                          </div>
                          <div className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-0.5">
                            {analysisMap[activeJob.id].match_score || 78}%
                          </div>
                        </div>
                        <Badge className="bg-purple-600 text-white text-xs">AI Analyzed</Badge>
                      </div>

                      {/* Matching vs Missing Skills */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Your Matching Strengths
                          </h4>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {(analysisMap[activeJob.id].matching_skills || []).map(
                              (s: string, i: number) => (
                                <span
                                  key={i}
                                  className="bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded text-xs border border-emerald-200"
                                >
                                  {s}
                                </span>
                              )
                            )}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" /> Missing Skill Gaps
                          </h4>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {(analysisMap[activeJob.id].missing_skills || []).map(
                              (s: string, i: number) => (
                                <span
                                  key={i}
                                  className="bg-white dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded text-xs border border-amber-200"
                                >
                                  {s}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tailoring Suggestions */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Recommended Resume Revisions
                        </h4>
                        <div className="space-y-2">
                          {(analysisMap[activeJob.id].tailoring_suggestions || []).map(
                            (item: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-xs space-y-1"
                              >
                                <div className="font-semibold text-purple-700 dark:text-purple-400">
                                  {item.section}
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                  {item.advice}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* 2-Day Upskill Roadmap */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Fast-Track Upskill Roadmap
                        </h4>
                        <div className="space-y-2">
                          {(analysisMap[activeJob.id].upskill_roadmap || []).map(
                            (road: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20 text-xs flex justify-between items-start gap-4"
                              >
                                <div className="space-y-1">
                                  <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    <span>{road.skill}</span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {road.duration}
                                    </Badge>
                                  </div>
                                  <p className="text-zinc-600 dark:text-zinc-400">
                                    <strong>Key topics:</strong> {road.key_topics}
                                  </p>
                                  <p className="text-zinc-500 text-[11px]">
                                    <strong>Recommended guide:</strong> {road.resource}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-500">
                      Failed to load analysis. Please close and reopen.
                    </div>
                  )}
                </>
              ) : (
                /* Tab 2: Cold Email Generator */
                <div className="space-y-4">
                  {isGeneratingCover ? (
                    <div className="py-12 text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                      <p className="text-xs text-zinc-500">
                        Drafting personalized cold email based on your projects and{' '}
                        {activeJob.company_name}&apos;s role...
                      </p>
                    </div>
                  ) : coverLetterMap[activeJob.id] ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          Recruiter-Ready Cold Email (Under 160 Words)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCover(coverLetterMap[activeJob.id])}
                          className="h-7 text-xs gap-1.5"
                        >
                          {copiedCover ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Email
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 font-mono text-xs whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200 select-all">
                        {coverLetterMap[activeJob.id]}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-3">
                      <Mail className="w-8 h-8 text-zinc-400 mx-auto" />
                      <p className="text-xs text-zinc-500">
                        Generate a customized cold application email highlighting your real projects.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleGenerateCover(activeJob.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Draft Email Now (Free)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Direct external link to employer portal:</span>
              <a
                href={activeJob.sources?.[0]?.url || 'https://www.linkedin.com/jobs'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-purple-600 hover:text-purple-700 hover:underline"
              >
                Apply on {activeJob.sources?.[0]?.portal || 'Portal'}{' '}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
