'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Target,
  Users,
  Award,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  BookOpen,
  Calendar,
  Briefcase,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Layers,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  Search,
  Download,
  HelpCircle,
  Code2,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { CohortTier, HeatmapItem, RoadmapStep, InterviewQuestion, CapstoneProjectSpec, StudentTierItem } from '../actions'

interface ReportDetailClientProps {
  report: any
}

// Client-side CSV generator for instant Excel download
function exportToCsv(filename: string, rows: (string | number)[][]) {
  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((item) => {
            const str = String(item ?? '')
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
              return `"${str.replace(/"/g, '""')}"`
            }
            return str
          })
          .join(',')
      )
      .join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ReportDetailClient({ report }: ReportDetailClientProps) {
  // 1. Roster Modal & Search State
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false)
  const [selectedRosterTier, setSelectedRosterTier] = useState<string>('all')
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedMissingSkillFilter, setSelectedMissingSkillFilter] = useState('all')
  const [rosterPage, setRosterPage] = useState(1)
  const pageSize = 15

  // 2. Heatmap Table Filter & Sort State
  const [heatmapLayer, setHeatmapLayer] = useState<'all' | 'hard' | 'tooling' | 'process' | 'soft'>('all')
  const [heatmapSortField, setHeatmapSortField] = useState<'coveragePct' | 'haveCount' | 'missingCount'>('coveragePct')
  const [heatmapSortOrder, setHeatmapSortOrder] = useState<'asc' | 'desc'>('asc')

  // Extract core report data
  const jobs = report.analyzed_jobs || []
  const primaryJob = jobs[0] || {}
  const jobTitle = primaryJob.title || 'Cohort Placement Intelligence'
  const companyName = primaryJob.company || 'Visiting Recruiter'
  const batchSize = report.batch_size || 0
  const readyCount = report.ready_count || 0
  const avgMatchScore = report.avg_match_score || 0
  const cohortTiers: CohortTier[] = report.cohort_tiers || []
  const heatmap: HeatmapItem[] = report.skill_coverage_heatmap || []
  const learningRoadmap = report.learning_roadmap || {}
  const roadmapSteps: RoadmapStep[] = learningRoadmap.steps || []
  const recruiterTalkingPoints: string[] = learningRoadmap.recruiter_talking_points || []
  const interviewQuestions: InterviewQuestion[] = learningRoadmap.interview_question_bank || []
  const topMissingSkills: string[] =
    learningRoadmap.top_missing_skills || learningRoadmap.top_missing_ats_keywords || []
  const workshops = report.recommended_workshops || []

  // Flatten all students across tiers for unified searching & filtering
  const allStudents = useMemo(() => {
    const list: (StudentTierItem & { tierLabel: string; tierKey: string })[] = []
    cohortTiers.forEach((tier) => {
      (tier.students || []).forEach((s) => {
        list.push({
          ...s,
          tierLabel: tier.label,
          tierKey: tier.tier,
        })
      })
    })
    return list
  }, [cohortTiers])

  // Extract all unique missing skills across all students for the dropdown
  const allUniqueMissingSkills = useMemo(() => {
    const set = new Set<string>()
    allStudents.forEach((s) => {
      (s.missing_skills || []).forEach((m) => set.add(m))
    })
    return Array.from(set).sort()
  }, [allStudents])

  // Filtered students in the modal
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      // Tier filter
      if (selectedRosterTier !== 'all' && s.tierKey !== selectedRosterTier) {
        return false
      }
      // Search filter
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase()
        const matchesName = (s.name || '').toLowerCase().includes(q)
        const matchesDept = (s.department || '').toLowerCase().includes(q)
        if (!matchesName && !matchesDept) return false
      }
      // Missing skill filter
      if (selectedMissingSkillFilter !== 'all') {
        const hasMissing = (s.missing_skills || []).some(
          (m) => m.toLowerCase() === selectedMissingSkillFilter.toLowerCase()
        )
        if (!hasMissing) return false
      }
      return true
    })
  }, [allStudents, selectedRosterTier, studentSearch, selectedMissingSkillFilter])

  // Paginated students
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1
  const paginatedStudents = useMemo(() => {
    const start = (rosterPage - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, rosterPage])

  // Heatmap filtering and sorting
  const filteredAndSortedHeatmap = useMemo(() => {
    let result = heatmap.filter((h) => {
      if (heatmapLayer === 'all') return true
      return h.layer === heatmapLayer
    })

    result.sort((a, b) => {
      const valA = a[heatmapSortField]
      const valB = b[heatmapSortField]
      if (heatmapSortOrder === 'asc') {
        return valA - valB
      } else {
        return valB - valA
      }
    })

    return result
  }, [heatmap, heatmapLayer, heatmapSortField, heatmapSortOrder])

  const toggleHeatmapSort = (field: 'coveragePct' | 'haveCount' | 'missingCount') => {
    if (heatmapSortField === field) {
      setHeatmapSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setHeatmapSortField(field)
      setHeatmapSortOrder('asc')
    }
  }

  // Handle Exporting Student Roster to CSV
  const handleExportRosterCsv = (tierKey?: string) => {
    const studentsToExport = tierKey && tierKey !== 'all'
      ? allStudents.filter((s) => s.tierKey === tierKey)
      : filteredStudents

    if (studentsToExport.length === 0) {
      toast.error('No students found to export')
      return
    }

    const headers = [
      'Student Name',
      'Department / Branch',
      'Assigned Cohort Tier',
      'Match Score (%)',
      'Matched Competencies Count',
      'Missing Deficits Count',
      'Specific Missing Skills',
      'Target Job Title',
      'Visiting Company',
    ]

    const rows = studentsToExport.map((s) => [
      s.name,
      s.department || 'General',
      s.tierLabel,
      `${s.score}%`,
      s.matchedCount,
      s.missingCount,
      (s.missing_skills || []).join('; '),
      jobTitle,
      companyName,
    ])

    const safeFilename = `${companyName}_${jobTitle}_Cohort_Roster.csv`.replace(/[^a-zA-Z0-9_-]/g, '_')
    exportToCsv(safeFilename, [headers, ...rows])
    toast.success(`Exported ${studentsToExport.length} students to Excel / CSV`, {
      description: `Saved as ${safeFilename}`,
    })
  }

  // Open modal focused on specific tier
  const handleOpenRosterForTier = (tierKey: string) => {
    setSelectedRosterTier(tierKey)
    setStudentSearch('')
    setSelectedMissingSkillFilter('all')
    setRosterPage(1)
    setIsRosterModalOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Top Breadcrumb & Executive Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
        <div className="space-y-1.5">
          <Link
            href="/college/placement-readiness"
            className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline gap-1.5 mb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Placement Readiness Console
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Target className="w-7 h-7 text-blue-600" />
              {jobTitle}
            </h1>
            <Badge className="bg-blue-600 text-white font-bold text-xs uppercase px-2.5 py-0.5">
              {companyName}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              Batch Year: <strong className="text-zinc-800 dark:text-zinc-200">{report.target_batch_year}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-zinc-400" />
              Scope: <strong className="text-zinc-800 dark:text-zinc-200">{(report.target_branches || []).join(', ')}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              Evaluated: <strong className="text-zinc-800 dark:text-zinc-200">{batchSize} Candidates</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Analyzed: {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportRosterCsv('all')}
            className="text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" /> Export Full Cohort (.csv)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-blue-100 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 shadow-2xs">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Evaluated Candidates
            </CardDescription>
            <CardTitle className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {batchSize}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-[11px] text-zinc-500">
            Across {(report.target_branches || []).length} targeted departments
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-2xs">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Day-1 / Shortlist Ready
            </CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              {readyCount}
              <span className="text-xs font-normal text-zinc-500">
                ({batchSize > 0 ? Math.round((readyCount / batchSize) * 100) : 0}%)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-[11px] text-zinc-500">
            Qualify today for technical screening
          </CardContent>
        </Card>

        <Card className="border-purple-100 dark:border-purple-900/60 bg-purple-50/20 dark:bg-purple-950/10 shadow-2xs">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              Cohort Average Match
            </CardDescription>
            <CardTitle className="text-2xl font-black text-purple-600 dark:text-purple-400 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              {avgMatchScore}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-[11px] text-zinc-500">
            Multi-factor weighted match score
          </CardContent>
        </Card>

        <Card className="border-amber-100 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-2xs">
          <CardHeader className="pb-1 pt-4">
            <CardDescription className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Top Batch Deficit
            </CardDescription>
            <CardTitle className="text-base font-bold text-amber-600 dark:text-amber-400 truncate flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              {heatmap[0]?.skill || 'Specialized Tooling'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 text-[11px] text-zinc-500">
            {heatmap[0] ? `${heatmap[0].coveragePct}% current batch coverage` : 'Needs bootcamp polish'}
          </CardContent>
        </Card>
      </div>

      {/* 1. Four-Tier Student Cohort Segmentation Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Student Cohort Tiers &amp; Intervention Tracks
            </h3>
            <p className="text-xs text-zinc-500">
              4-Tier segmentation so the TPO knows exactly which candidates to short-list for Day-1 recruiters versus which to enroll in targeted training.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenRosterForTier('all')}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-2xs"
          >
            <Users className="w-3.5 h-3.5" /> Inspect Full Cohort Roster ({allStudents.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cohortTiers.map((tier) => {
            const isEmerald = tier.tier === 'tier_1'
            const isBlue = tier.tier === 'tier_2'
            const isAmber = tier.tier === 'tier_3'
            const isRose = tier.tier === 'tier_4'

            return (
              <Card
                key={tier.tier}
                className={`flex flex-col justify-between transition-all shadow-xs border ${
                  isEmerald
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : isBlue
                    ? 'border-blue-200 dark:border-blue-800 bg-blue-50/20 dark:bg-blue-950/20'
                    : isAmber
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20'
                    : 'border-rose-200 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center gap-1 mb-1">
                    <Badge
                      className={`text-[10px] font-black uppercase px-2 py-0.5 border-0 ${
                        isEmerald
                          ? 'bg-emerald-600 text-white'
                          : isBlue
                          ? 'bg-blue-600 text-white'
                          : isAmber
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {tier.label.split(':')[0]}
                    </Badge>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      {tier.count} Students ({tier.percentage}%)
                    </span>
                  </div>

                  <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {tier.label.split(':')[1]?.trim() || tier.label}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 min-h-[36px]">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-3">
                  {/* Progress bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isEmerald ? 'bg-emerald-500' : isBlue ? 'bg-blue-500' : isAmber ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, tier.percentage))}%` }}
                    />
                  </div>

                  {/* TPO Action Plan */}
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border text-[11px] space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <Target className="w-3 h-3 text-blue-600" /> TPO Action Plan:
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-snug">
                      {tier.action_plan}
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenRosterForTier(tier.tier)}
                    className="w-full text-xs font-bold justify-between text-zinc-700 dark:text-zinc-300 hover:text-blue-600"
                  >
                    <span>Inspect Roster ({tier.count})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 2. Four-Layer Skill Deficit & Coverage Heatmap */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" /> 4-Layer Skill Deficit &amp; Coverage Heatmap
            </CardTitle>
            <CardDescription className="text-xs">
              Shows percentage of cohort possessing each demanded skill, categorized into functional, tooling, process, and communication layers.
            </CardDescription>
          </div>

          {/* User Requested: Filter tabs positioned BELOW headline & subtext */}
          <div className="pt-3 border-t flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${heatmap.length})` },
              { id: 'hard', label: `Hard Functional (${heatmap.filter((h) => h.layer === 'hard').length})` },
              { id: 'tooling', label: `Tooling & Software (${heatmap.filter((h) => h.layer === 'tooling').length})` },
              { id: 'process', label: `Process / Standards (${heatmap.filter((h) => h.layer === 'process').length})` },
              { id: 'soft', label: `Soft / Communication (${heatmap.filter((h) => h.layer === 'soft').length})` },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={heatmapLayer === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHeatmapLayer(tab.id as any)}
                className={`text-xs h-7 px-3 font-semibold ${
                  heatmapLayer === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:border-blue-400'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 uppercase tracking-wider font-semibold border-y text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Demanded Skill</th>
                  <th className="py-2.5 px-3 font-semibold">Layer</th>

                  {/* User Requested: Sort arrows on Have It, Deficit, and Batch Coverage */}
                  <th
                    onClick={() => toggleHeatmapSort('haveCount')}
                    className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 select-none group font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      <span>Have It</span>
                      {heatmapSortField === 'haveCount' ? (
                        heatmapSortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => toggleHeatmapSort('missingCount')}
                    className="py-2.5 px-3 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 select-none group font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      <span>Deficit</span>
                      {heatmapSortField === 'missingCount' ? (
                        heatmapSortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => toggleHeatmapSort('coveragePct')}
                    className="py-2.5 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 select-none group w-48 sm:w-60 font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      <span>Batch Coverage</span>
                      {heatmapSortField === 'coveragePct' ? (
                        heatmapSortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500" />
                      )}
                    </div>
                  </th>

                  <th className="py-2.5 px-4 text-right font-semibold">TPO Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredAndSortedHeatmap.map((item, idx) => {
                  const isCrit = item.priority === 'CRITICAL'
                  const isHigh = item.priority === 'HIGH'

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.skill}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium uppercase border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                        >
                          {item.layer}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.haveCount}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-400">
                        {item.missingCount}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCrit ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${item.coveragePct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 w-10 text-right">
                            {item.coveragePct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Badge
                          className={`text-[10px] font-semibold border ${
                            isCrit
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                              : isHigh
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                          }`}
                        >
                          {item.priority}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. Deep Sequenced Upskilling Roadmap & Syllabus */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-4 border-b">
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Sequenced Upskilling Roadmap &amp; Institutional Syllabus
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Chronological, modular curriculum designed to bridge cohort competency gaps before recruiter assessment day.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-bold text-xs bg-zinc-50 dark:bg-zinc-800">
              {learningRoadmap.total_hours || 40} Total Training Hours
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-6">
            {roadmapSteps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Step Circle Indicator */}
                <div className="absolute -left-[37px] top-0 w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {step.step || idx + 1}
                </div>

                <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-3 shadow-2xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {step.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                        {step.layer}
                      </Badge>
                      <Badge className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-0 text-[10px] font-bold">
                        ~{step.duration_hours || 15} Hours
                      </Badge>
                    </div>
                  </div>

                  {/* Schedule Breakdown */}
                  {step.week_or_day_breakdown && (
                    <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-800/60 border text-[11px] text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span><strong>Schedule:</strong> {step.week_or_day_breakdown}</span>
                    </div>
                  )}

                  <div className="text-xs space-y-2 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <p>
                      <strong className="text-zinc-800 dark:text-zinc-200">Key Topics:</strong> {step.key_topics}
                    </p>
                    {step.hands_on_lab && (
                      <p className="text-zinc-700 dark:text-zinc-200">
                        <strong>Hands-On Lab:</strong> {step.hands_on_lab}
                      </p>
                    )}
                    {step.capstone_deliverable && (
                      <p className="text-emerald-700 dark:text-emerald-400">
                        <strong>Deliverable:</strong> {step.capstone_deliverable}
                      </p>
                    )}
                    {step.faculty_guidance && (
                      <p className="text-zinc-500 text-[11px]">
                        <strong>Faculty Guidance:</strong> {step.faculty_guidance}
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t flex justify-between items-center text-[11px] flex-wrap gap-2">
                    <span className="text-zinc-500 truncate max-w-md" title={step.curated_resources}>
                      Resources: {step.curated_resources}
                    </span>
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] border-0 shrink-0">
                      {step.expected_uplift}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Top Skills Missing from Students Required by Employers */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Top Skills Missing from Students Required by Employers
          </CardTitle>
          <CardDescription className="text-xs">
            High-priority technical competencies and domain proficiencies demanded across recruiter job specifications where student batch coverage is critically low.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topMissingSkills.length > 0 ? (
              topMissingSkills.map((kw, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 py-1.5 px-3"
                >
                  {kw}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-zinc-500">All core technical competencies are well covered across the batch.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Top 10 Recruiter Mock Interview Questions */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Top 10 Recruiter Mock Interview Questions
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Technical depth and behavioral questions tailored to visiting recruiter requirements, structured around the STAR response model.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs font-bold">
              {interviewQuestions.length} Curated Questions
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {interviewQuestions.length > 0 ? (
            interviewQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-2.5 text-xs shadow-2xs hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex justify-between items-start gap-3">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                    #{idx + 1}. {q.question}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {q.job_title && (
                      <Badge variant="secondary" className="text-[10px] font-medium hidden sm:inline-flex">
                        {q.job_title}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {q.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border space-y-1 text-xs">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Answer Guidance (STAR Framework):
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {q.ideal_answer_framework}
                  </p>
                </div>

                <div className="text-[11px] text-zinc-500">
                  <strong className="text-zinc-700 dark:text-zinc-300">Evaluator Focus:</strong> {q.evaluator_focus}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-500 p-4">No mock questions available for this report.</p>
          )}
        </CardContent>
      </Card>

      {/* 6. Recruiter Pitch Soundbites & High-ROI Bootcamps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recruiter Pitch Notes */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Briefcase className="w-4 h-4 text-blue-600" /> Recruiter Briefing Notes (Pitch to HR)
            </CardTitle>
            <CardDescription className="text-xs">
              Executive soundbites for the TPO to use when presenting this candidate batch to corporate HR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recruiterTalkingPoints && recruiterTalkingPoints.length > 0 ? (
              recruiterTalkingPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-900 border text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">Run analysis to generate recruiter pitch points.</p>
            )}
          </CardContent>
        </Card>

        {/* High-ROI Bootcamps */}
        <Card className="border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Sparkles className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> Recommended High-Impact Bootcamps
            </CardTitle>
            <CardDescription className="text-xs">
              Targeted short workshops to uplift Tier 3 and Tier 4 cohorts prior to Day-1 interviews.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {workshops.map((w: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-900 border text-xs flex justify-between items-center shadow-2xs"
              >
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{w.topic}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Target: {w.target_tier || 'Tier 3 & Tier 4'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] font-medium">
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

      {/* Interactive Student Roster Modal / Drawer */}
      <Dialog open={isRosterModalOpen} onOpenChange={setIsRosterModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-3 border-b">
            <div className="flex justify-between items-center pr-6">
              <div>
                <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Cohort Candidate Roster &amp; Shortlist
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Inspect student-level readiness scores, matched competencies, and specific missing skills for {companyName}.
                </DialogDescription>
              </div>

              <Button
                size="sm"
                onClick={() => handleExportRosterCsv(selectedRosterTier)}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export to Excel (.csv)
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
              {/* Tier Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase shrink-0">Tier:</span>
                <select
                  value={selectedRosterTier}
                  onChange={(e) => {
                    setSelectedRosterTier(e.target.value)
                    setRosterPage(1)
                  }}
                  className="w-full text-xs p-1.5 rounded-md border bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="all">All Tiers ({allStudents.length})</option>
                  {cohortTiers.map((t) => (
                    <option key={t.tier} value={t.tier}>
                      {t.label} ({t.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Missing Skill Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase shrink-0">Missing:</span>
                <select
                  value={selectedMissingSkillFilter}
                  onChange={(e) => {
                    setSelectedMissingSkillFilter(e.target.value)
                    setRosterPage(1)
                  }}
                  className="w-full text-xs p-1.5 rounded-md border bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                >
                  <option value="all">All Skills</option>
                  {allUniqueMissingSkills.map((sk) => (
                    <option key={sk} value={sk}>
                      Missing: {sk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
                <Input
                  placeholder="Search by student name or dept..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value)
                    setRosterPage(1)
                  }}
                  className="h-8 text-xs pl-8"
                />
              </div>
            </div>
          </DialogHeader>

          {/* Roster Table */}
          <div className="flex-1 overflow-y-auto">
            {paginatedStudents.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No students match your filter criteria.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 uppercase tracking-wider font-bold border-b sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Candidate</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3">Match Score</th>
                    <th className="py-2.5 px-4">Specific Missing Skills (Deficits)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paginatedStudents.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                        {s.department || 'General'}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            s.tierKey === 'tier_1'
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                              : s.tierKey === 'tier_2'
                              ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40'
                              : s.tierKey === 'tier_3'
                              ? 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                              : 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                          }`}
                        >
                          {s.tierLabel.split(':')[0]}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-black text-xs text-zinc-900 dark:text-zinc-100">
                          {s.score}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {(s.missing_skills || []).slice(0, 3).map((ms, i) => (
                            <span
                              key={i}
                              className="inline-block px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-600 text-[10px] font-medium"
                            >
                              {ms}
                            </span>
                          ))}
                          {(s.missing_skills || []).length > 3 && (
                            <span className="text-[10px] text-zinc-400 font-medium">
                              +{(s.missing_skills || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Modal Footer with Pagination */}
          <div className="pt-3 border-t flex justify-between items-center text-xs text-zinc-500">
            <span>
              Showing {filteredStudents.length > 0 ? (rosterPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(rosterPage * pageSize, filteredStudents.length)} of {filteredStudents.length} candidates
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={rosterPage <= 1}
                onClick={() => setRosterPage((p) => p - 1)}
                className="h-7 text-xs px-2.5"
              >
                Previous
              </Button>
              <span className="font-bold px-1">
                {rosterPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={rosterPage >= totalPages}
                onClick={() => setRosterPage((p) => p + 1)}
                className="h-7 text-xs px-2.5"
              >
                Next
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
