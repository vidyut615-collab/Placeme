'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  FileSpreadsheet,
  Printer,
  X,
  RotateCcw,
  SlidersHorizontal,
  Coins,
  Building2,
  GraduationCap,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  runBatchReadinessAnalysisAction,
  deleteReadinessReportAction,
  createCollegeCreditTopupOrderAction,
  confirmCollegeCreditTopupAction,
  JobInput,
} from './actions'

export const COLLEGE_CREDIT_PACKAGES = [
  {
    id: 'plan_college_1000',
    name: 'Department Trial Pack',
    credits: 1000,
    mrp: 1000,
    price: 800,
    discountBadge: '20% OFF',
    popular: false,
    description: 'Ideal for branch-level test drives & department evaluations.',
    features: [
      'Up to 33 Class analyses (75 students)',
      'OR 10 Department pool drives',
      'Full skill coverage heatmaps',
      'Downloadable syllabus roadmaps',
    ],
  },
  {
    id: 'plan_college_2000',
    name: 'Campus Drive Pack',
    credits: 2000,
    mrp: 2000,
    price: 1400,
    discountBadge: '30% OFF • POPULAR',
    popular: true,
    description: 'Recommended for multi-department readiness across seasonal campus drives.',
    features: [
      'Up to 20 Department pool drives (3 jobs each)',
      'OR 66 Class-level cohort analyses',
      'Priority AI cohort taxonomy generation',
      'Multi-stream readiness tracking',
    ],
  },
  {
    id: 'plan_college_5000',
    name: 'Institutional Sovereign',
    credits: 5000,
    mrp: 5000,
    price: 2500,
    discountBadge: '50% OFF • MAXIMUM SAVINGS',
    popular: false,
    description: 'Enterprise coverage for entire universities, multiple branches & mega cohorts.',
    features: [
      'Up to 50 Department pool drives',
      'OR 18 Campus-wide mega cohort runs (up to 2,000 students)',
      'Permanent historical audit archives',
      'Full institutional accreditation export',
    ],
  },
]

export function calculateRequiredCredits(batchSize: number, mode: 'single_job' | 'pool'): {
  credits: number
  tierLabel: string
} {
  const isPool = mode === 'pool'
  if (batchSize <= 75) {
    return {
      credits: isPool ? 50 : 30,
      tierLabel: 'Class / Branch (Up to 75 Students)',
    }
  } else if (batchSize <= 250) {
    return {
      credits: isPool ? 100 : 60,
      tierLabel: 'Department / Dual Branch (76 – 250 Students)',
    }
  } else if (batchSize <= 600) {
    return {
      credits: isPool ? 160 : 100,
      tierLabel: 'Multi-Branch / Mid-Campus (251 – 600 Students)',
    }
  } else if (batchSize <= 1000) {
    return {
      credits: isPool ? 220 : 140,
      tierLabel: 'Large College / Multi-Stream (601 – 1,000 Students)',
    }
  } else {
    // 1,001 - 2,000 students (University Max Cap)
    return {
      credits: isPool ? 280 : 180,
      tierLabel: 'Mega University / Institutional Campus [Max Cap]',
    }
  }
}

interface StudentMeta {
  id: string
  year: string
  degree: string
  department: string
}

interface PlacementReadinessClientProps {
  collegeCredits: number
  availableYears: string[]
  availableDegrees: string[]
  availableDepartments: string[]
  studentsMeta: StudentMeta[]
  pastReports: any[]
}

export function PlacementReadinessClient({
  collegeCredits: initialCredits,
  availableYears,
  availableDegrees,
  availableDepartments,
  studentsMeta,
  pastReports: initialReports,
}: PlacementReadinessClientProps) {
  const router = useRouter()
  const [collegeCredits, setCollegeCredits] = useState<number>(initialCredits)
  const [mode, setMode] = useState<'single_job' | 'pool'>('single_job')
  const [jobs, setJobs] = useState<JobInput[]>([
    {
      title: 'Software Development Engineer - Fresher',
      company: 'Zycus',
      description: '',
    },
  ])

  // Multi-select Cohort Filters
  const [selectedYears, setSelectedYears] = useState<string[]>(
    availableYears.length > 0 ? [availableYears[0]] : ['2026']
  )
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(['all'])
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['all'])

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Institutional credit top-up modal state
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleBuyCollegeCredits = async (pkg: (typeof COLLEGE_CREDIT_PACKAGES)[0]) => {
    setBuyingPlanId(pkg.id)

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Razorpay SDK failed to load. Are you online?')
        setBuyingPlanId(null)
        return
      }

      const orderRes = await createCollegeCreditTopupOrderAction({
        planId: pkg.id,
        amountInr: pkg.price,
        credits: pkg.credits,
      })

      if (orderRes.error || !orderRes.orderId) {
        toast.error(orderRes.error || 'Failed to create payment order')
        setBuyingPlanId(null)
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.amount,
        currency: 'INR',
        name: 'Placeme Institutional',
        description: `Institutional Top-up: ${pkg.credits.toLocaleString()} AI Credits`,
        order_id: orderRes.orderId,
        handler: async function (response: any) {
          toast.loading('Activating institutional credits...', { id: 'topup-toast' })
          const confirmRes = await confirmCollegeCreditTopupAction({
            orderId: orderRes.orderId,
            paymentId: response.razorpay_payment_id,
            credits: pkg.credits,
            planId: pkg.id,
          })

          if (confirmRes.success && typeof confirmRes.newBalance === 'number') {
            setCollegeCredits(confirmRes.newBalance)
            toast.success(`Payment Successful! Added ${pkg.credits.toLocaleString()} Credits`, {
              id: 'topup-toast',
              description: `Your new college balance is ${confirmRes.newBalance.toLocaleString()} Credits.`,
            })
            setIsTopupModalOpen(false)
          } else {
            toast.success('Payment received! Updating balance...', { id: 'topup-toast' })
            setTimeout(() => window.location.reload(), 1500)
          }
          setBuyingPlanId(null)
        },
        prefill: {
          name: 'Training & Placement Officer',
          email: '',
          contact: '',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: function () {
            setBuyingPlanId(null)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err: any) {
      console.error('Payment error:', err)
      toast.error(err.message || 'Payment initiation failed')
      setBuyingPlanId(null)
    }
  }

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [currentReport, setCurrentReport] = useState<any | null>(initialReports?.[0] || null)
  const [reportsList, setReportsList] = useState<any[]>(initialReports || [])
  const [isConfigOpen, setIsConfigOpen] = useState(true)

  // Layer filter for the heatmap
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'hard' | 'tooling' | 'process' | 'soft'>('all')

  // Expanded tier view for student roster
  const [expandedTier, setExpandedTier] = useState<string | null>(null)

  // Refs for smooth navigation
  const configRef = useRef<HTMLDivElement>(null)
  const reportsListRef = useRef<HTMLDivElement>(null)
  const reportViewRef = useRef<HTMLDivElement>(null)

  // 1. Calculate Real-Time Matched Students in Scope
  const matchedStudents = useMemo(() => {
    return studentsMeta.filter((s) => {
      // Year filter
      if (!selectedYears.includes('all') && selectedYears.length > 0) {
        if (s.year && !selectedYears.includes(s.year)) return false
      }

      // Degree filter
      if (!selectedDegrees.includes('all') && selectedDegrees.length > 0) {
        const sDegree = (s.degree || '').toLowerCase().trim()
        const match = selectedDegrees.some((d) => sDegree.includes(d.toLowerCase().trim()))
        if (!match) return false
      }

      // Department filter
      if (!selectedDepts.includes('all') && selectedDepts.length > 0) {
        const sDept = (s.department || '').toLowerCase().trim()
        const isMatch = selectedDepts.some((d) => {
          const filterVal = d.toLowerCase().trim()
          return (
            sDept.includes(filterVal) ||
            (filterVal === 'cmpn' && (sDept.includes('computer') || sDept.includes('cmpn') || sDept.includes('cs'))) ||
            (filterVal === 'it' && (sDept.includes('information') || sDept.includes('it'))) ||
            (filterVal === 'mech' && (sDept.includes('mechanical') || sDept.includes('mech'))) ||
            (filterVal === 'civil' && sDept.includes('civil'))
          )
        })
        if (!isMatch) return false
      }

      return true
    })
  }, [studentsMeta, selectedYears, selectedDegrees, selectedDepts])

  const matchedCount = matchedStudents.length > 0 ? matchedStudents.length : studentsMeta.length

  // 2. Compute Exact Credits and Tier Label according to the 10-case formula
  const { credits: requiredCredits, tierLabel } = useMemo(() => {
    return calculateRequiredCredits(matchedCount, mode)
  }, [matchedCount, mode])

  const hasSufficientCredits = collegeCredits >= requiredCredits

  // Multi-select toggle helpers
  const toggleYear = (yr: string) => {
    if (yr === 'all') {
      setSelectedYears(['all'])
      return
    }
    const filtered = selectedYears.filter((y) => y !== 'all')
    if (filtered.includes(yr)) {
      const next = filtered.filter((y) => y !== yr)
      setSelectedYears(next.length > 0 ? next : ['all'])
    } else {
      setSelectedYears([...filtered, yr])
    }
  }

  const toggleDegree = (deg: string) => {
    if (deg === 'all') {
      setSelectedDegrees(['all'])
      return
    }
    const filtered = selectedDegrees.filter((d) => d !== 'all')
    if (filtered.includes(deg)) {
      const next = filtered.filter((d) => d !== deg)
      setSelectedDegrees(next.length > 0 ? next : ['all'])
    } else {
      setSelectedDegrees([...filtered, deg])
    }
  }

  const toggleDept = (dept: string) => {
    if (dept === 'all') {
      setSelectedDepts(['all'])
      return
    }
    const filtered = selectedDepts.filter((d) => d !== 'all')
    if (filtered.includes(dept)) {
      const next = filtered.filter((d) => d !== dept)
      setSelectedDepts(next.length > 0 ? next : ['all'])
    } else {
      setSelectedDepts([...filtered, dept])
    }
  }

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

  // Pre-analysis validation before opening confirmation modal
  const handleOpenConfirm = () => {
    setErrorMsg('')
    if (!jobs[0].title.trim()) {
      setErrorMsg('Please enter a Job Title.')
      return
    }
    if (!jobs[0].description.trim()) {
      setErrorMsg('Please paste at least one Job Description to analyze.')
      return
    }
    setIsConfirmOpen(true)
  }

  // Execute deep readiness analysis and deduct credits
  const handleExecuteConfirmedAnalysis = async () => {
    setIsConfirmOpen(false)
    setIsAnalyzing(true)
    setErrorMsg('')

    try {
      const res = await runBatchReadinessAnalysisAction({
        mode,
        jobs,
        years: selectedYears.includes('all') ? undefined : selectedYears,
        degrees: selectedDegrees.includes('all') ? undefined : selectedDegrees,
        departments: selectedDepts.includes('all') ? undefined : selectedDepts,
      })

      if (res.success && res.report) {
        if (typeof res.updatedBalance === 'number') {
          setCollegeCredits(res.updatedBalance)
        }
        toast.success('Readiness Analysis Complete! Opening dedicated report...')
        router.push(`/college/placement-readiness/${res.report.id}`)
      } else {
        setErrorMsg(res.error || 'Failed to analyze placement readiness.')
      }
    } catch (err: any) {
      console.error('Batch readiness analysis error:', err)
      setErrorMsg(err.message || 'An unexpected error occurred during cohort analysis. Please check server logs.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelectReport = (report: any) => {
    router.push(`/college/placement-readiness/${report.id}`)
  }

  const handleDeleteReport = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to remove this saved readiness report?')) return
    try {
      const res = await deleteReadinessReportAction(reportId)
      if (res.success) {
        setReportsList((prev) => prev.filter((r) => r.id !== reportId))
        if (currentReport?.id === reportId) {
          setCurrentReport(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete report:', err)
    }
  }

  const handleLoadIntoForm = (report: any) => {
    if (report.analyzed_jobs && report.analyzed_jobs.length > 0) {
      setJobs(report.analyzed_jobs)
      setMode(report.report_mode || 'single_job')
      if (report.target_batch_year) setSelectedYears([String(report.target_batch_year)])
      if (report.target_degrees && report.target_degrees.length > 0) {
        setSelectedDegrees(report.target_degrees)
      }
      if (report.target_branches && report.target_branches.length > 0) {
        setSelectedDepts(report.target_branches)
      }
      setIsConfigOpen(true)
      setTimeout(() => {
        configRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  const formatReportDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoStr
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

  const primaryCurrentJob = currentReport?.analyzed_jobs?.[0]
  const currentJobTitle = primaryCurrentJob?.title || 'Cohort Placement Intelligence Report'
  const currentCompanyName = primaryCurrentJob?.company || 'Visiting Recruiter'

  return (
    <div className="space-y-8 w-full">
      {/* Page Header with Top-Right Credit Showcase */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Target className="w-8 h-8 text-blue-600" />
            Placement Readiness &amp; Curriculum Intelligence
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Deep cohort gap evaluation, 4-layer taxonomy breakdown, and dependency-aware bootcamp syllabus for visiting recruiters.
          </p>
        </div>

        {/* Top-Right College Credit Showcase */}
        <div
          onClick={() => setIsTopupModalOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 shadow-xs hover:border-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-950/70 transition-all cursor-pointer group select-none"
          title="Click to view packages and top up institutional credits"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <Coins className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              College Credits Balance
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-300">
              {collegeCredits.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-zinc-500">Credits</span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsTopupModalOpen(true)
            }}
            className="h-7 text-xs px-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs ml-1 gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Top Up
          </Button>
        </div>
      </div>

      {/* 1. Configuration Console */}
      <Card ref={configRef} className="border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/40 via-white to-purple-50/20 dark:from-blue-950/20 dark:via-zinc-900 dark:to-purple-950/20 shadow-sm scroll-mt-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-blue-600" /> Analysis Scope &amp; Target Roles
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Filter students by Passing Year, Degree, and Department, then paste the visiting company&apos;s JD.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigOpen((v) => !v)}
                className="text-xs gap-1 font-semibold"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                {isConfigOpen ? 'Minimize Form' : 'Expand Form'}
                {isConfigOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>

              {isConfigOpen && (
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
                    Single Job
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
                    Multi-Job Pool (2-5)
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {isConfigOpen && (
          <>
            <CardContent className="space-y-5">
              {/* Multiselect Cohort Scope Box: Passing Year, Degree, Department */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-4 shadow-2xs">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" /> Cohort Selection (Passing Year, Degree &amp; Department)
                </div>

                {/* 1. Passing Year Multi-Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Passing Year (Batch)
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Selected: {selectedYears.includes('all') ? 'All Batches' : selectedYears.join(', ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleYear('all')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center gap-1 ${
                        selectedYears.includes('all')
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {selectedYears.includes('all') && <Check className="w-3 h-3" />}
                      All Years
                    </button>
                    {availableYears.map((yr) => {
                      const isSelected = selectedYears.includes(yr) && !selectedYears.includes('all')
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => toggleYear(yr)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          Batch {yr}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Degree Multi-Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" /> Degree / Program
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Selected: {selectedDegrees.includes('all') ? 'All Degrees' : selectedDegrees.join(', ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleDegree('all')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center gap-1 ${
                        selectedDegrees.includes('all')
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {selectedDegrees.includes('all') && <Check className="w-3 h-3" />}
                      All Degrees
                    </button>
                    {availableDegrees.map((deg) => {
                      const isSelected = selectedDegrees.includes(deg) && !selectedDegrees.includes('all')
                      return (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => toggleDegree(deg)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {deg}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Department / Branch Multi-Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400" /> Department / Branch
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      Selected: {selectedDepts.includes('all') ? 'All Departments' : selectedDepts.join(', ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleDept('all')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center gap-1 ${
                        selectedDepts.includes('all')
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                          : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {selectedDepts.includes('all') && <Check className="w-3 h-3" />}
                      All Departments
                    </button>
                    {availableDepartments.map((dept) => {
                      const isSelected = selectedDepts.includes(dept) && !selectedDepts.includes('all')
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => toggleDept(dept)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {dept}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Job Postings Input (Job Title, Employer Name, Job Description) */}
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border bg-white dark:bg-zinc-900 space-y-3 relative shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" /> Target Role #{idx + 1}
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

                    {/* Top Row: Job Title & Employer Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Job Title (e.g. Software Development Engineer - Fresher)"
                        value={job.title}
                        onChange={(e) => handleJobChange(idx, 'title', e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Employer Name (e.g. Zycus / Razorpay / Deloitte)"
                        value={job.company || ''}
                        onChange={(e) => handleJobChange(idx, 'company', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Below: Job Description */}
                    <textarea
                      placeholder="Job Description: Paste the full job description, required technical/functional skills, tooling, workflows, and qualification criteria..."
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
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </CardContent>

            {/* Footer with Real-Time Credit & Scope Preview and 2-Step Trigger */}
            <CardFooter className="bg-zinc-50/70 dark:bg-zinc-900/70 border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3.5 px-6">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> Cohort Scope:
                  </span>
                  <Badge variant="outline" className="font-bold text-xs bg-white dark:bg-zinc-800">
                    {matchedCount} Students Evaluated
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0 text-[10px] font-bold">
                    {tierLabel}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Rate: <strong>{requiredCredits} Credits</strong> for {mode === 'pool' ? 'Multi-Job Pool' : 'Single Job Analysis'}.
                </p>
              </div>

              <Button
                onClick={handleOpenConfirm}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold w-full md:w-auto shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Cross-Analyzing Cohort...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" /> Run Deep Batch Readiness Analysis ({requiredCredits} Credits)
                  </>
                )}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      {/* 2-Step Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500 fill-amber-500" />
              Confirm Placement Readiness Analysis
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review your target cohort scope and institutional credit deduction before initiating deep AI evaluation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Target Scope Summary Card */}
            <div className="p-3.5 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Target Role</span>
                <span className="text-zinc-600 dark:text-zinc-300 font-semibold truncate max-w-[200px]">
                  {jobs[0].title} ({jobs[0].company || 'Visiting Recruiter'})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Analysis Mode</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                  {mode === 'pool' ? `Multi-Job Pool (${jobs.length} Roles)` : 'Single Job'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Cohort in Scope</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {matchedCount} Students Evaluated
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Pricing Slab</span>
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[220px]">
                  {tierLabel}
                </span>
              </div>
            </div>

            {/* Credit Breakdown Box */}
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Required Credits</span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400">
                  -{requiredCredits} Credits
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Current College Balance</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {collegeCredits} Credits
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-amber-200 dark:border-amber-800 font-bold">
                <span className="text-zinc-800 dark:text-zinc-200">Balance After Deduction</span>
                <span className={hasSufficientCredits ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}>
                  {collegeCredits - requiredCredits} Credits
                </span>
              </div>
            </div>

            {!hasSufficientCredits && (
              <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1 space-y-2">
                  <p>
                    Insufficient Credits. You need <strong>{requiredCredits} credits</strong>, but your current balance is <strong>{collegeCredits} credits</strong>. Please top up your institutional credits to proceed.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setIsConfirmOpen(false)
                      setIsTopupModalOpen(true)
                    }}
                    className="h-7 text-xs px-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs gap-1"
                  >
                    <Coins className="w-3.5 h-3.5" /> Top Up Institutional Credits
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            {hasSufficientCredits ? (
              <Button
                disabled={isAnalyzing}
                onClick={handleExecuteConfirmedAnalysis}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deducting &amp; Analyzing...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Confirm &amp; Deduct {requiredCredits} Credits
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsConfirmOpen(false)
                  setIsTopupModalOpen(true)
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold gap-1.5"
              >
                <Coins className="w-3.5 h-3.5" /> Top Up Credits Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Institutional Credit Top-Up Modal */}
      <Dialog open={isTopupModalOpen} onOpenChange={setIsTopupModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
              <Coins className="w-7 h-7 fill-amber-500 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Institutional Credit Packages
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 max-w-lg mx-auto">
              Fuel batch readiness diagnostics, multi-department pool drives, and 4-layer taxonomy gap evaluations. Credits never expire and apply instantly across your college account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {COLLEGE_CREDIT_PACKAGES.map((pkg) => {
              const isBuying = buyingPlanId === pkg.id
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    pkg.popular
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-600/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  {pkg.discountBadge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs ${
                          pkg.popular ? 'bg-blue-600' : 'bg-emerald-600'
                        }`}
                      >
                        {pkg.discountBadge}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 min-h-[32px] leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-center">
                      <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1.5">
                        <Coins className="w-5 h-5 text-amber-500 fill-amber-500" />
                        {pkg.credits.toLocaleString()}
                        <span className="text-xs font-semibold text-zinc-500">Credits</span>
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <span className="text-xs text-zinc-400 line-through">
                          ₹{pkg.mrp.toLocaleString()}
                        </span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          ₹{pkg.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        Coverage &amp; Capabilities
                      </div>
                      <ul className="space-y-1.5">
                        {pkg.features.map((feat, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      onClick={() => handleBuyCollegeCredits(pkg)}
                      disabled={buyingPlanId !== null}
                      className={`w-full font-bold text-xs gap-1.5 shadow-xs ${
                        pkg.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                      }`}
                    >
                      {isBuying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing Order...
                        </>
                      ) : (
                        <>
                          Pay ₹{pkg.price.toLocaleString()}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center pt-2 border-t text-[11px] text-zinc-400">
            Secure 256-bit encrypted checkout via Razorpay • Instant balance update • Usable across all placement readiness cohorts
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Saved Placement Intelligence Reports Log (Row Format) */}
      <div ref={reportsListRef} className="space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Placement Intelligence Reports Log
            </h3>
            <Badge variant="secondary" className="font-bold text-xs bg-zinc-100 dark:bg-zinc-800">
              {reportsList.length} {reportsList.length === 1 ? 'Report' : 'Reports'}
            </Badge>
          </div>
          <span className="text-xs text-zinc-500">
            Click any report row below to inspect the full cohort tiers, skill heatmap, and curriculum roadmap.
          </span>
        </div>

        {reportsList.length === 0 ? (
          <Card className="border-dashed p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/50">
            <CardContent className="space-y-2 p-0">
              <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No reports generated yet
              </p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Configure your target cohort and job requirements above, then click <strong>&ldquo;Run Deep Batch Readiness Analysis&rdquo;</strong> to generate and store your first cohort evaluation.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {reportsList.map((report) => {
              const isSelected = currentReport?.id === report.id
              const primaryJob = report.analyzed_jobs?.[0]
              const roleTitle = primaryJob?.title || 'Placement Evaluation'
              const companyName = primaryJob?.company || 'Visiting Recruiter'
              const poolCount = report.analyzed_jobs?.length || 1
              const branches = report.target_branches?.join(', ') || 'All Branches'
              const readyPct = Math.round(((report.ready_count || 0) / (report.batch_size || 1)) * 100)

              return (
                <div
                  key={report.id || report.created_at}
                  onClick={() => handleSelectReport(report)}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  {/* Col 1: Role, Company, Mode */}
                  <div className="flex items-start gap-3 min-w-[280px] max-w-md">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors'
                      }`}
                    >
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {roleTitle}
                        </h4>
                        {report.report_mode === 'pool' && poolCount > 1 ? (
                          <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200">
                            Pool: {poolCount} Roles
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold text-zinc-500">
                            Single Role
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge className="bg-blue-600 text-white text-[10px] font-bold animate-pulse">
                            ● Viewing Below
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{companyName}</span>
                        <span>•</span>
                        <span>Batch {report.target_batch_year || '2026'}</span>
                        <span>•</span>
                        <span className="truncate max-w-[180px]">{branches}</span>
                        {report.credits_spent ? (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            • {report.credits_spent} Credits
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Col 2: Cohort Metrics (Students, Ready %, Avg Score) */}
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    {/* Batch Size */}
                    <div className="text-left sm:text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Batch Size
                      </span>
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" /> {report.batch_size} Students
                      </span>
                    </div>

                    {/* Ready Candidates */}
                    <div className="text-left sm:text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Ready (&ge;70%)
                      </span>
                      <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-xs font-bold gap-1">
                        <Award className="w-3 h-3 text-emerald-600" /> {report.ready_count} ({readyPct}%)
                      </Badge>
                    </div>

                    {/* Average Match */}
                    <div className="text-left sm:text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Avg Match
                      </span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {report.avg_match_score}%
                      </span>
                    </div>

                    {/* Date */}
                    <div className="text-left sm:text-right text-xs text-zinc-500 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                        Analyzed On
                      </span>
                      <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-medium">
                        <Clock className="w-3 h-3 text-zinc-400" /> {formatReportDate(report.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Col 3: Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoadIntoForm(report)
                      }}
                      className="text-xs gap-1 font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                      title="Load scope and jobs into the configuration form above"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Re-run
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs gap-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectReport(report)
                      }}
                    >
                      View Full Report <ArrowRight className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteReport(e, report.id)}
                      className="text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8 p-0"
                      title="Delete this report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}