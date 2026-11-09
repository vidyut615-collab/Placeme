'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Target,
  Users,
  Award,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Loader2,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  Briefcase,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Layers,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import { runBatchReadinessAnalysisAction, JobInput } from './actions'

interface PlacementReadinessClientProps {
  departments: string[]
  pastReports: any[]
}

export function PlacementReadinessClient({
  departments,
  pastReports: initialReports,
}: PlacementReadinessClientProps) {
  const [mode, setMode] = useState<'single_job' | 'pool'>('single_job')
  const [jobs, setJobs] = useState<JobInput[]>([
    {
      title: 'Software Development Engineer - Fresher',
      company: 'Visiting Recruiter / Tech Partner',
      description: '',
    },
  ])
  const [batchYear, setBatchYear] = useState<number>(new Date().getFullYear() + 1)
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [currentReport, setCurrentReport] = useState<any | null>(initialReports[0] || null)
  const [reportsList, setReportsList] = useState<any[]>(initialReports)

  // Layer filter for the heatmap
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'hard' | 'tooling' | 'process' | 'soft'>('all')

  // Expanded tier view for student roster
  const [expandedTier, setExpandedTier] = useState<string | null>(null)

  const handleAddJobField = () => {
    if (jobs.length >= 5) return
    setJobs((prev) => [
      ...prev,
      { title: `Target Role #${prev.length + 1}`, company: '', description: '' },
    ])
  }

  const handleRemoveJobField = (index: number) => {
    if (jobs.length <= 1) return
    setJobs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleJobChange = (index: number, field: keyof JobInput, val: string) => {
    setJobs((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: val }
      return copy
    })
  }

  const handleRunAnalysis = async () => {
    setErrorMsg('')
    if (!jobs[0].description.trim()) {
      setErrorMsg('Please paste at least one job description to analyze.')
      return
    }

    setIsAnalyzing(true)
    const res = await runBatchReadinessAnalysisAction({
      mode,
      jobs,
      batchYear,
      department: selectedDept,
    })
    setIsAnalyzing(false)

    if (res.success && res.report) {
      setCurrentReport(res.report)
      setReportsList((prev) => [res.report, ...prev])
      setExpandedTier(null)
    } else {
      setErrorMsg(res.error || 'Failed to analyze placement readiness.')
    }
  }

  // Filtered heatmap items based on layer
  const heatmap = currentReport?.skill_coverage_heatmap || []
  const filteredHeatmap =
    selectedLayer === 'all'
      ? heatmap
      : heatmap.filter((item: any) => item.layer === selectedLayer)

  const cohortTiers = currentReport?.cohort_tiers || []
  const roadmap = currentReport?.learning_roadmap?.steps || []
  const talkingPoints = currentReport?.learning_roadmap?.recruiter_talking_points || []
  const totalHours = currentReport?.learning_roadmap?.total_hours || 40

  return (
    <div className="space-y-8">
      {/* 1. Configuration Console */}
      <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-zinc-900 dark:to-purple-950/20 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" /> Placement Readiness &amp; Curriculum Intelligence
              </CardTitle>
              <CardDescription className="mt-1">
                Deep cross-cohort gap evaluation, 4-layer taxonomy breakdown, and dependency-aware bootcamp syllabus for any college stream.
              </CardDescription>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border">
              <button
                type="button"
                onClick={() => {
                  setMode('single_job')
                  if (jobs.length > 1) setJobs([jobs[0]])
                }}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  mode === 'single_job'
                    ? 'bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-300 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Single Job Analysis
              </button>
              <button
                type="button"
                onClick={() => setMode('pool')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  mode === 'pool'
                    ? 'bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-300 font-bold'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                Multi-Job Pool (2-5 JDs)
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Batch & Department Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-zinc-900 p-3 rounded-lg border">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Target Graduation Batch
              </label>
              <Input
                type="number"
                value={batchYear}
                onChange={(e) => setBatchYear(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Filter by Branch / Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none"
              >
                <option value="all">All Departments / Whole Cohort</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Postings Input */}
          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Target Role #{idx + 1}
                  </span>
                  {jobs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveJobField(idx)}
                      className="text-red-500 hover:text-red-700 h-7 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Role Title (e.g. SDE Fresher / Financial Analyst / Inside Sales)"
                    value={job.title}
                    onChange={(e) => handleJobChange(idx, 'title', e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Company Name (e.g. Razorpay / EY / Morgan Stanley / Zomato)"
                    value={job.company || ''}
                    onChange={(e) => handleJobChange(idx, 'company', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <textarea
                  placeholder="Paste the full job description, required skills, tools, and qualification criteria here... (Works for any domain: Tech, Finance, Accounting, Sales, Marketing, Core Engineering)"
                  value={job.description}
                  onChange={(e) => handleJobChange(idx, 'description', e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed font-mono"
                />
              </div>
            ))}

            {mode === 'pool' && jobs.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddJobField}
                className="w-full border-dashed gap-1 text-xs"
              >
                <Plus className="w-4 h-4" /> Add Another Job Posting ({jobs.length}/5)
              </Button>
            )}
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200">
              {errorMsg}
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-zinc-50/60 dark:bg-zinc-900/60 border-t flex justify-between items-center py-3 px-6">
          <span className="text-xs text-zinc-500">
            Powered by Groq 4-Layer Taxonomy Engine (Domain Agnostic)
          </span>
          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Cross-Analyzing Cohort &amp; Generating Roadmap...
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" /> Run Deep Batch Readiness Analysis
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* 2. Intelligence Dashboard View */}
      {currentReport && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Cohort Readiness Intelligence Report
              </h2>
              <p className="text-xs text-zinc-500">
                Batch of {currentReport.target_batch_year} • {currentReport.target_branches?.join(', ')} • Mode:{' '}
                {currentReport.report_mode === 'pool' ? 'Multi-Job Pool' : 'Single Job'}
              </p>
            </div>
            <span className="text-xs text-zinc-400">
              Generated {new Date(currentReport.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold">Cohort Analyzed</CardDescription>
                <CardTitle className="text-3xl font-black">{currentReport.batch_size}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Enrolled students in scope
                </span>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Ready to Apply (&ge;70%)
                </CardDescription>
                <CardTitle className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {currentReport.ready_count}
                  <span className="text-sm font-normal text-zinc-500 ml-2">
                    ({Math.round((currentReport.ready_count / (currentReport.batch_size || 1)) * 100)}%)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Tier 1 immediate shortlist pool
                </span>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Quick-Win Upskill (45-69%)
                </CardDescription>
                <CardTitle className="text-3xl font-black text-amber-700 dark:text-amber-400">
                  {cohortTiers.find((t: any) => t.tier === 'tier_2')?.count || 0}
                  <span className="text-sm font-normal text-zinc-500 ml-2">
                    ({cohortTiers.find((t: any) => t.tier === 'tier_2')?.percentage || 0}%)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Move to Ready with 2-week bootcamp
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold">Average Match Score</CardDescription>
                <CardTitle className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {currentReport.avg_match_score}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Batch baseline across all skills
                </span>
              </CardContent>
            </Card>
          </div>

          {/* 3. Actionable Student Cohort Tiers (Who Goes Where) */}
          {cohortTiers && cohortTiers.length > 0 && (
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" /> Student Cohort Tiers &amp; Intervention Tracks
                </CardTitle>
                <CardDescription>
                  Segmented into 3 actionable tiers so the TPO knows exactly which students to fast-track versus which to enroll in targeted training.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cohortTiers.map((tier: any) => {
                    const isExpanded = expandedTier === tier.tier
                    const isTier1 = tier.tier === 'tier_1'
                    const isTier2 = tier.tier === 'tier_2'

                    return (
                      <div
                        key={tier.tier}
                        className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                          isTier1
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : isTier2
                            ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge
                              className={`text-xs font-bold ${
                                isTier1
                                  ? 'bg-emerald-600 text-white'
                                  : isTier2
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {tier.label}
                            </Badge>
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                              {tier.count} Students ({tier.percentage}%)
                            </span>
                          </div>

                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {tier.description}
                          </p>

                          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border text-[11px] space-y-1">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                              TPO Action Plan:
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-400">{tier.action_plan}</p>
                          </div>
                        </div>

                        {tier.students && tier.students.length > 0 && (
                          <div className="pt-3 mt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedTier(isExpanded ? null : tier.tier)}
                              className="w-full h-8 text-xs font-semibold justify-between text-zinc-700 dark:text-zinc-300"
                            >
                              <span>
                                {isExpanded ? 'Hide' : 'View'} Roster ({tier.students.length})
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </Button>

                            {isExpanded && (
                              <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                                {tier.students.map((st: any) => (
                                  <div
                                    key={st.id}
                                    className="p-2 rounded bg-white dark:bg-zinc-900 border text-xs flex flex-col gap-1 shadow-2xs"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {st.name}
                                      </span>
                                      <Badge variant="outline" className="text-[10px] font-bold">
                                        {st.score}% Match
                                      </Badge>
                                    </div>
                                    <span className="text-[10px] text-zinc-400">{st.department}</span>
                                    {st.missing_skills && st.missing_skills.length > 0 && (
                                      <div className="text-[10px] text-zinc-500 truncate">
                                        <strong>Missing:</strong> {st.missing_skills.slice(0, 3).join(', ')}
                                        {st.missing_skills.length > 3 && ` +${st.missing_skills.length - 3}`}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Categorized 4-Layer Skill Heatmap */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" /> 4-Layer Skill Deficit &amp; Coverage Heatmap
                  </CardTitle>
                  <CardDescription>
                    Shows percentage of cohort possessing each demanded skill, categorized into functional, tooling, process, and communication layers.
                  </CardDescription>
                </div>

                {/* Layer Filter Pills */}
                <div className="flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('all')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      selectedLayer === 'all'
                        ? 'bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-300 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    All ({heatmap.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('hard')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      selectedLayer === 'hard'
                        ? 'bg-white dark:bg-zinc-700 shadow-xs text-purple-600 dark:text-purple-300 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Hard Functional
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('tooling')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      selectedLayer === 'tooling'
                        ? 'bg-white dark:bg-zinc-700 shadow-xs text-blue-600 dark:text-blue-300 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Tooling &amp; Software
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('process')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      selectedLayer === 'process'
                        ? 'bg-white dark:bg-zinc-700 shadow-xs text-amber-600 dark:text-amber-300 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Process / Standards
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLayer('soft')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      selectedLayer === 'soft'
                        ? 'bg-white dark:bg-zinc-700 shadow-xs text-emerald-600 dark:text-emerald-300 font-bold'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Soft / Communication
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-zinc-500 text-left">
                      <th className="py-2.5 font-semibold">Demanded Skill</th>
                      <th className="py-2.5 font-semibold">Layer</th>
                      <th className="py-2.5 font-semibold">Have It</th>
                      <th className="py-2.5 font-semibold">Deficit</th>
                      <th className="py-2.5 font-semibold w-1/3">Batch Coverage</th>
                      <th className="py-2.5 font-semibold text-right">TPO Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredHeatmap.map((item: any) => (
                      <tr key={item.skill} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.skill}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.layer === 'hard'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : item.layer === 'tooling'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : item.layer === 'process'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {item.layer}
                          </span>
                        </td>
                        <td className="py-2.5 text-emerald-600 font-semibold">{item.haveCount}</td>
                        <td className="py-2.5 text-zinc-500">{item.missingCount}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.coveragePct >= 65
                                    ? 'bg-emerald-500'
                                    : item.coveragePct >= 35
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${item.coveragePct}%` }}
                              />
                            </div>
                            <span className="font-bold w-9 text-right">{item.coveragePct}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <Badge
                            className={`text-[10px] font-bold ${
                              item.priority === 'CRITICAL'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200'
                                : item.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                            }`}
                          >
                            {item.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 5. Sequenced Training Roadmap (The College Syllabus View) */}
          {roadmap && roadmap.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/20 via-white to-purple-50/20 dark:from-blue-950/10 dark:via-zinc-900 dark:to-purple-950/10">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-blue-950 dark:text-blue-100">
                      <BookOpen className="w-5 h-5 text-blue-600" /> Sequenced Upskilling Roadmap (College Syllabus)
                    </CardTitle>
                    <CardDescription>
                      Dependency-aware training steps arranged sequentially so students clear prerequisites before advanced workflows.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold gap-1 bg-white dark:bg-zinc-900">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Total Curriculum: ~{totalHours} Hours
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative border-l-2 border-blue-200 dark:border-blue-900 ml-4 pl-6 space-y-6">
                  {roadmap.map((step: any, idx: number) => (
                    <div key={idx} className="relative group">
                      {/* Step Circle Indicator */}
                      <div className="absolute -left-[35px] top-0 w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {step.step || idx + 1}
                      </div>

                      <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-2 shadow-2xs hover:border-blue-400 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {step.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] font-semibold capitalize">
                              {step.layer}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0 text-[10px] font-bold">
                              ~{step.duration_hours || 15} Hours
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 text-zinc-600 dark:text-zinc-400">
                          <div>
                            <strong className="text-zinc-800 dark:text-zinc-200">Prerequisites:</strong>{' '}
                            <span>{step.prerequisites || 'None (Foundational)'}</span>
                          </div>
                          <div>
                            <strong className="text-zinc-800 dark:text-zinc-200">Expected Cohort Uplift:</strong>{' '}
                            <span className="text-emerald-600 font-bold">{step.expected_uplift}</span>
                          </div>
                        </div>

                        <div className="text-xs space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <p className="text-zinc-600 dark:text-zinc-300">
                            <strong>Key Topics:</strong> {step.key_topics}
                          </p>
                          <p className="text-zinc-500 text-[11px]">
                            <strong>Curated Resources:</strong> {step.curated_resources}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. Recruiter Briefing & Workshop Interventions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recruiter Talking Points */}
            <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/20 dark:bg-purple-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-900 dark:text-purple-200">
                  <Briefcase className="w-4 h-4 text-purple-600" /> Recruiter Briefing Notes (Pitch to HR)
                </CardTitle>
                <CardDescription className="text-xs">
                  Soundbites for the TPO to use when presenting this batch to visiting recruiters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {talkingPoints && talkingPoints.length > 0 ? (
                  talkingPoints.map((pt: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white dark:bg-zinc-900 border text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">Run analysis to generate recruiter pitch points.</p>
                )}
              </CardContent>
            </Card>

            {/* High-ROI Bootcamps */}
            <Card className="border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Recommended High-Impact Bootcamps
                </CardTitle>
                <CardDescription className="text-xs">
                  Targeted short workshops to uplift Tier 2 and Tier 3 cohorts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentReport.recommended_workshops?.map((w: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-900 border text-xs flex justify-between items-center shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{w.topic}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Target: {w.target_tier || 'Tier 2 Cohort'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {w.duration}
                      </Badge>
                      <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                        {w.potential_uplift_pct} Uplift
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
