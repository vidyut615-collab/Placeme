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

  const handleAddJobField = () => {
    if (jobs.length >= 5) return
    setJobs((prev) => [
      ...prev,
      { title: `Job Posting #${prev.length + 1}`, company: '', description: '' },
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
    } else {
      setErrorMsg(res.error || 'Failed to analyze placement readiness.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Configuration Console */}
      <Card className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-zinc-900 dark:to-purple-950/20 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" /> Placement Readiness &amp; Skill Intelligence
              </CardTitle>
              <CardDescription className="mt-1">
                Evaluate student cohort preparedness against upcoming campus job postings and uncover curriculum skill gaps.
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
                    Target Job Posting #{idx + 1}
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
                    placeholder="Job Title (e.g. Associate Tech Analyst)"
                    value={job.title}
                    onChange={(e) => handleJobChange(idx, 'title', e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="Company Name (e.g. Morgan Stanley / Razorpay)"
                    value={job.company || ''}
                    onChange={(e) => handleJobChange(idx, 'company', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <textarea
                  placeholder="Paste the full job description, required skills, and qualification details here..."
                  value={job.description}
                  onChange={(e) => handleJobChange(idx, 'description', e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed"
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

        <CardFooter className="bg-zinc-50/60 dark:bg-zinc-900/60 border-t flex justify-end py-3">
          <Button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Cross-Analyzing Cohort...
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" /> Run Batch Readiness Analysis
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Intelligence Dashboard View */}
      {currentReport && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Readiness Intelligence Report
              </h2>
              <p className="text-xs text-zinc-500">
                Batch of {currentReport.target_batch_year} • {currentReport.target_branches?.join(', ')} • Mode: {currentReport.report_mode === 'pool' ? 'Multi-Job Pool' : 'Single Job'}
              </p>
            </div>
            <span className="text-xs text-zinc-400">
              Generated {new Date(currentReport.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  Ready to Apply (&ge;65% Match)
                </CardDescription>
                <CardTitle className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {currentReport.ready_count}
                  <span className="text-sm font-normal text-zinc-500 ml-2">
                    ({Math.round((currentReport.ready_count / currentReport.batch_size) * 100)}%)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> High-probability candidate pool
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
                  <TrendingUp className="w-3.5 h-3.5" /> Batch baseline across skills
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Skill Deficit Heatmap */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Skill Deficit &amp; Coverage Heatmap
              </CardTitle>
              <CardDescription>
                Shows percentage of students in your cohort who possess each demanded skill.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-zinc-500 text-left">
                      <th className="py-2.5 font-semibold">Demanded Skill</th>
                      <th className="py-2.5 font-semibold">Have It</th>
                      <th className="py-2.5 font-semibold">Deficit (Missing)</th>
                      <th className="py-2.5 font-semibold w-1/3">Batch Coverage</th>
                      <th className="py-2.5 font-semibold text-right">TPO Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {currentReport.skill_coverage_heatmap?.map((item: any) => (
                      <tr key={item.skill} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-2.5 font-medium">{item.skill}</td>
                        <td className="py-2.5 text-emerald-600 font-semibold">{item.haveCount}</td>
                        <td className="py-2.5 text-zinc-500">{item.missingCount}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.coveragePct >= 60
                                    ? 'bg-emerald-500'
                                    : item.coveragePct >= 30
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

          {/* High-ROI Workshop Recommendations */}
          {currentReport.recommended_workshops && currentReport.recommended_workshops.length > 0 && (
            <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/20 dark:bg-purple-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
                  <BookOpen className="w-5 h-5 text-purple-600" /> Recommended High-Impact Training Bootcamps
                </CardTitle>
                <CardDescription>
                  Organizing these short-duration workshops will uplift the maximum number of students across target companies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentReport.recommended_workshops.map((w: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border bg-white dark:bg-zinc-900 space-y-1 shadow-2xs"
                    >
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                        <span>{w.topic}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {w.duration}
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                        Potential Cohort Uplift: {w.potential_uplift_pct}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
