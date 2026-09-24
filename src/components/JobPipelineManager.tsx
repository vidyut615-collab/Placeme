'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PasteShortlistModal } from '@/components/PasteShortlistModal'
import { CloseReasonModal } from '@/components/CloseReasonModal'
import { advanceCandidatesBatch, reinstateCandidate } from '@/app/(dashboards)/college/actions'
import { TableColumnFilter, TableColumnSort } from '@/components/TableColumnFilter'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { formatDate } from '@/lib/utils'
import {
  Search,
  ClipboardPaste,
  Download,
  RotateCcw,
  ArrowRight,
  XCircle,
  CheckCircle2,
  Users,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react'

export interface CandidateApplication {
  id: string
  status: string
  created_at: string
  updated_at?: string
  is_withdrawn?: boolean
  withdrawal_reason?: string
  dropped_reason?: string
  students: {
    id: string
    user_id: string
    profile_data: any
    user_email?: string
  } | null
}

interface JobPipelineManagerProps {
  jobId: string
  jobTitle: string
  currentStageId: string
  currentStageLabel: string
  applications: CandidateApplication[]
  stageOptions: Array<{ id: string; label: string }>
}

export function JobPipelineManager({
  jobId,
  jobTitle,
  currentStageId,
  currentStageLabel,
  applications,
  stageOptions,
}: JobPipelineManagerProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAdvancingBatch, setIsAdvancingBatch] = useState(false)
  const [isReinstatingId, setIsReinstatingId] = useState<string | null>(null)

  // Modals
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [closeTargetIds, setCloseTargetIds] = useState<string[]>([])

  const isClosedTab = currentStageId === 'closed' || currentStageId === 'dropped'
  const isHiredTab = currentStageId === 'hired'

  // Map subsequent stages for advancing
  const currentStageIndex = stageOptions.findIndex(s => s.id === currentStageId)
  const subsequentStages = currentStageIndex >= 0 
    ? stageOptions.slice(currentStageIndex + 1).filter(s => s.id !== 'closed' && s.id !== 'overview')
    : stageOptions.filter(s => s.id !== 'closed' && s.id !== 'overview' && s.id !== currentStageId)

  const defaultNextStage = subsequentStages[0]?.id || ''
  const [bulkTargetStage, setBulkTargetStage] = useState<string>(defaultNextStage)

  // Column Filters & Sorting State
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [sortField, setSortField] = useState<'passYear' | 'cgpa' | 'appliedOn' | 'closedOn' | 'hiredOn' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Available unique degrees and departments for filters
  const availableDegrees = useMemo(() => {
    const set = new Set<string>()
    applications.forEach(app => {
      const prof = app.students?.profile_data || {}
      const acad = prof.academic || {}
      const deg = acad.degree || acad.type || prof.type || prof.degree || ''
      if (deg && deg !== '—' && deg !== 'N/A') set.add(deg)
    })
    return Array.from(set).sort()
  }, [applications])

  const availableDepts = useMemo(() => {
    const set = new Set<string>()
    applications.forEach(app => {
      const prof = app.students?.profile_data || {}
      const acad = prof.academic || {}
      const d = acad.department || prof.department || ''
      if (d && d !== '—' && d !== 'N/A') set.add(d)
    })
    return Array.from(set).sort()
  }, [applications])

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField(null)
        setSortDirection('asc')
      }
    } else {
      setSortField(field as any)
      setSortDirection('asc')
    }
  }

  // Filter & Sort candidates by search query, column filters, and sort field
  const filteredCandidates = useMemo(() => {
    let result = applications

    // 1. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(app => {
        const student = app.students
        const profile = student?.profile_data || {}
        const personal = profile.personal || {}
        const academic = profile.academic || {}

        const name = (personal.full_name || profile.full_name || profile.name || '').toLowerCase()
        const roll = (personal.roll_number || profile.roll_number || academic.roll_no || '').toLowerCase()
        const email = (student?.user_email || personal.email || profile.email || '').toLowerCase()
        const dept = (academic.department || profile.department || '').toLowerCase()
        const degree = (academic.degree || academic.type || profile.type || profile.degree || '').toLowerCase()
        const passYear = (academic.year || academic.batch || profile.year || profile.batch || profile.pass_year || profile.passing_year || '').toString().toLowerCase()

        return name.includes(q) || roll.includes(q) || email.includes(q) || dept.includes(q) || degree.includes(q) || passYear.includes(q)
      })
    }

    // 2. Degree filter (multi-select)
    if (selectedDegrees.length > 0) {
      result = result.filter(app => {
        const prof = app.students?.profile_data || {}
        const acad = prof.academic || {}
        const deg = acad.degree || acad.type || prof.type || prof.degree || '—'
        return selectedDegrees.includes(deg)
      })
    }

    // 3. Dept filter (multi-select)
    if (selectedDepts.length > 0) {
      result = result.filter(app => {
        const prof = app.students?.profile_data || {}
        const acad = prof.academic || {}
        const d = acad.department || prof.department || '—'
        return selectedDepts.includes(d)
      })
    }

    // 4. Sorting
    if (sortField) {
      const mult = sortDirection === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        const profA = a.students?.profile_data || {}
        const acadA = profA.academic || {}
        const profB = b.students?.profile_data || {}
        const acadB = profB.academic || {}

        if (sortField === 'cgpa') {
          const cA = parseFloat(acadA.cgpa || profA.cgpa || profA.gpa || '0') || 0
          const cB = parseFloat(acadB.cgpa || profB.cgpa || profB.gpa || '0') || 0
          return mult * (cA - cB)
        }

        if (sortField === 'passYear') {
          const yA = (acadA.year || acadA.batch || profA.year || profA.batch || profA.pass_year || profA.passing_year || '').toString()
          const yB = (acadB.year || acadB.batch || profB.year || profB.batch || profB.pass_year || profB.passing_year || '').toString()
          const numA = parseInt(yA, 10) || 0
          const numB = parseInt(yB, 10) || 0
          if (numA && numB) return mult * (numA - numB)
          return mult * yA.localeCompare(yB)
        }

        if (sortField === 'appliedOn') {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0
          return mult * (tA - tB)
        }

        if (sortField === 'closedOn') {
          const tA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0)
          const tB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0)
          return mult * (tA - tB)
        }

        if (sortField === 'hiredOn') {
          const tA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0)
          const tB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0)
          return mult * (tA - tB)
        }

        return 0
      })
    }

    return result
  }, [applications, searchQuery, selectedDegrees, selectedDepts, sortField, sortDirection])

  // Multi-select handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCandidates.map(c => c.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Quick single candidate advance to next stage
  const handleQuickAdvance = async (appId: string) => {
    if (!defaultNextStage) return

    const res = await advanceCandidatesBatch({
      applicationIds: [appId],
      targetStage: defaultNextStage,
      jobId,
    })

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Candidate advanced successfully!')
      router.refresh()
    }
  }

  // Quick single candidate close modal open
  const handleOpenSingleClose = (appId: string) => {
    setCloseTargetIds([appId])
    setIsCloseModalOpen(true)
  }

  // Bulk advance
  const handleBulkAdvance = async () => {
    const target = bulkTargetStage || defaultNextStage
    if (!target) {
      toast.error('Please select a target stage.')
      return
    }

    if (selectedIds.length === 0) {
      toast.error('No candidates selected.')
      return
    }

    setIsAdvancingBatch(true)
    const res = await advanceCandidatesBatch({
      applicationIds: selectedIds,
      targetStage: target,
      jobId,
    })
    setIsAdvancingBatch(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || `Advanced ${selectedIds.length} candidate(s)!`)
      setSelectedIds([])
      router.refresh()
    }
  }

  // Bulk close
  const handleOpenBulkClose = () => {
    if (selectedIds.length === 0) {
      toast.error('No candidates selected.')
      return
    }
    setCloseTargetIds(selectedIds)
    setIsCloseModalOpen(true)
  }

  // Reinstate candidate
  const handleReinstate = async (appId: string) => {
    setIsReinstatingId(appId)
    const res = await reinstateCandidate({
      applicationId: appId,
      jobId,
    })
    setIsReinstatingId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Candidate reinstated!')
      router.refresh()
    }
  }

  // Excel Export
  const handleExportExcel = () => {
    if (filteredCandidates.length === 0) {
      toast.error('No candidate data to export.')
      return
    }

    const rows = filteredCandidates.map((app, index) => {
      const student = app.students
      const profile = student?.profile_data || {}
      const personal = profile.personal || {}
      const academic = profile.academic || {}

      const name = personal.full_name || profile.full_name || profile.name || 'N/A'
      const rollNo = personal.roll_number || profile.roll_number || academic.roll_no || 'N/A'
      const email = student?.user_email || personal.email || profile.email || 'N/A'
      const phone = personal.phone || profile.phone || 'N/A'
      const dept = academic.department || profile.department || 'N/A'
      const degree = academic.degree || academic.type || profile.type || profile.degree || 'N/A'
      const passYear = academic.year || academic.batch || profile.year || profile.batch || profile.pass_year || profile.passing_year || 'N/A'
      const cgpa = academic.cgpa || profile.cgpa || profile.gpa || 'N/A'
      const appliedOn = app.created_at ? formatDate(app.created_at) : 'N/A'

      if (isClosedTab) {
        return {
          '#': index + 1,
          'Candidate': name,
          'Email': email,
          'Degree': degree,
          'Dept': dept,
          'Pass Year': passYear,
          'CGPA': cgpa,
          'Applied on': appliedOn,
          'Closed on': app.updated_at ? formatDate(app.updated_at) : (app.created_at ? formatDate(app.created_at) : 'N/A'),
          'Exit Reason': app.dropped_reason || (app.is_withdrawn ? 'Self-Withdrawn by Student' : 'Closed by College'),
          'Exit Type': app.is_withdrawn ? 'Student Withdrawn' : 'College Dropped',
          'Roll / USN': rollNo,
          'Phone': phone,
        }
      }

      if (isHiredTab) {
        return {
          '#': index + 1,
          'Candidate': name,
          'Email': email,
          'Degree': degree,
          'Dept': dept,
          'Pass Year': passYear,
          'CGPA': cgpa,
          'Applied on': appliedOn,
          'Hired on': app.updated_at ? formatDate(app.updated_at) : (app.created_at ? formatDate(app.created_at) : 'N/A'),
          'Status': 'Hired',
          'Roll / USN': rollNo,
          'Phone': phone,
        }
      }

      return {
        '#': index + 1,
        'Candidate': name,
        'Email': email,
        'Degree': degree,
        'Dept': dept,
        'Pass Year': passYear,
        'CGPA': cgpa,
        'Applied on': appliedOn,
        'Current Stage': currentStageLabel,
        'Roll / USN': rollNo,
        'Phone': phone,
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates')

    const cleanTitle = (jobTitle || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_')
    const cleanStage = (currentStageLabel || 'Stage').replace(/[^a-zA-Z0-9_-]/g, '_')
    XLSX.writeFile(workbook, `${cleanTitle}_${cleanStage}_Candidates.xlsx`)
    toast.success(`Exported ${filteredCandidates.length} candidate(s) to Excel!`)
  }

  // Selected candidate names preview for modal
  const selectedCandidateNames = useMemo(() => {
    const idsSet = new Set(closeTargetIds)
    return applications
      .filter(a => idsSet.has(a.id))
      .map(a => a.students?.profile_data?.personal?.full_name || a.students?.profile_data?.name || 'Candidate')
  }, [applications, closeTargetIds])

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by name, roll no, email, branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {(selectedDegrees.length > 0 || selectedDepts.length > 0 || sortField !== null) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDegrees([])
                setSelectedDepts([])
                setSortField(null)
                setSortDirection('asc')
              }}
              className="gap-1.5 text-xs h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              title="Reset all active column filters and sorting"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}

          {!isClosedTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPasteModalOpen(true)}
              className="gap-1.5 text-xs h-9 border-zinc-300 dark:border-zinc-700"
            >
              <ClipboardPaste className="h-3.5 w-3.5 text-blue-600" />
              Paste Shortlist
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs h-9 border-zinc-300 dark:border-zinc-700"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export (.xlsx)
          </Button>

          {!isClosedTab && filteredCandidates.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCloseTargetIds(filteredCandidates.map(c => c.id))
                setIsCloseModalOpen(true)
              }}
              className="text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Close All in Stage
            </Button>
          )}
        </div>
      </div>

      {/* Main Candidate Table */}
      <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableRow>
              {!isClosedTab && (
                <TableHead className="w-10 pl-4">
                  <input
                    type="checkbox"
                    checked={
                      filteredCandidates.length > 0 &&
                      selectedIds.length === filteredCandidates.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </TableHead>
              )}
              {isClosedTab ? (
                <>
                  <TableHead className="text-xs font-semibold">Candidate</TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnFilter
                      title="Degree"
                      options={availableDegrees}
                      selectedValues={selectedDegrees}
                      onChange={setSelectedDegrees}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnFilter
                      title="Dept"
                      options={availableDepts}
                      selectedValues={selectedDepts}
                      onChange={setSelectedDepts}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Pass Year"
                      field="passYear"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="CGPA"
                      field="cgpa"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Applied on"
                      field="appliedOn"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Closed on"
                      field="closedOn"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
                </>
              ) : isHiredTab ? (
                <>
                  <TableHead className="text-xs font-semibold">Candidate</TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnFilter
                      title="Degree"
                      options={availableDegrees}
                      selectedValues={selectedDegrees}
                      onChange={setSelectedDegrees}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnFilter
                      title="Dept"
                      options={availableDepts}
                      selectedValues={selectedDepts}
                      onChange={setSelectedDepts}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Pass Year"
                      field="passYear"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="CGPA"
                      field="cgpa"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Applied on"
                      field="appliedOn"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Hired on"
                      field="hiredOn"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-xs font-semibold">Candidate</TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnFilter
                      title="Degree"
                      options={availableDegrees}
                      selectedValues={selectedDegrees}
                      onChange={setSelectedDegrees}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnFilter
                      title="Dept"
                      options={availableDepts}
                      selectedValues={selectedDepts}
                      onChange={setSelectedDepts}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Pass Year"
                      field="passYear"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="CGPA"
                      field="cgpa"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="py-2 px-1">
                    <TableColumnSort
                      title="Applied on"
                      field="appliedOn"
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isClosedTab ? 8 : (isHiredTab ? 9 : 8)} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <Users className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      No candidates found in {currentStageLabel}
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Try clearing your search query &ldquo;{searchQuery}&rdquo;
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((app) => {
                const student = app.students
                const profile = student?.profile_data || {}
                const personal = profile.personal || {}
                const academic = profile.academic || {}

                const name = personal.full_name || profile.full_name || profile.name || 'Candidate'
                const roll = personal.roll_number || profile.roll_number || academic.roll_no || '—'
                const email = student?.user_email || personal.email || profile.email || '—'
                const dept = academic.department || profile.department || '—'
                const degree = academic.degree || academic.type || profile.type || profile.degree || '—'
                const passYear = academic.year || academic.batch || profile.year || profile.batch || profile.pass_year || profile.passing_year || '—'
                const cgpa = academic.cgpa || profile.cgpa || profile.gpa || '—'
                const isSelected = selectedIds.includes(app.id)

                return (
                  <TableRow
                    key={app.id}
                    className={`transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                  >
                    {!isClosedTab && (
                      <TableCell className="pl-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(app.id)}
                          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </TableCell>
                    )}

                    {isClosedTab ? (
                      <>
                        {/* 1. Candidate Name & Email */}
                        <TableCell>
                          <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {name}
                          </div>
                          <div className="text-[11px] text-zinc-500">{email}</div>
                        </TableCell>

                        {/* 2. Degree */}
                        <TableCell className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {degree}
                        </TableCell>

                        {/* 3. Dept */}
                        <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                          {dept}
                        </TableCell>

                        {/* 4. Pass Year */}
                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                          {passYear}
                        </TableCell>

                        {/* 5. CGPA */}
                        <TableCell className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {cgpa}
                        </TableCell>

                        {/* 6. Applied on */}
                        <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                          {formatDate(app.created_at)}
                        </TableCell>

                        {/* 7. Closed on & Reason Legend */}
                        <TableCell>
                          <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100" suppressHydrationWarning>
                            {formatDate(app.updated_at || app.created_at)}
                          </div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5" title={app.dropped_reason || (app.is_withdrawn ? 'Self-Withdrawn by Student' : 'Closed by College')}>
                            {app.dropped_reason || (app.is_withdrawn ? 'Self-Withdrawn by Student' : 'Closed by College')}
                          </div>
                          <div className="mt-1">
                            {app.is_withdrawn ? (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                                Student Withdrawn
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                College Dropped
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* 8. Reinstate Action */}
                        <TableCell className="text-right pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReinstate(app.id)}
                            disabled={isReinstatingId === app.id}
                            className="h-8 text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                          >
                            {isReinstatingId === app.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Reinstate
                          </Button>
                        </TableCell>
                      </>
                    ) : isHiredTab ? (
                      <>
                        {/* 1. Candidate Name & Email */}
                        <TableCell>
                          <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {name}
                          </div>
                          <div className="text-[11px] text-zinc-500">{email}</div>
                        </TableCell>

                        {/* 2. Degree */}
                        <TableCell className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {degree}
                        </TableCell>

                        {/* 3. Dept */}
                        <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                          {dept}
                        </TableCell>

                        {/* 4. Pass Year */}
                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                          {passYear}
                        </TableCell>

                        {/* 5. CGPA */}
                        <TableCell className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {cgpa}
                        </TableCell>

                        {/* 6. Applied on */}
                        <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                          {formatDate(app.created_at)}
                        </TableCell>

                        {/* 7. Hired on */}
                        <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                          {formatDate(app.updated_at || app.created_at)}
                        </TableCell>

                        {/* 8. Quick Row Actions */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenSingleClose(app.id)}
                              className="h-7 w-7 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Close candidate"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        {/* 1. Candidate Name & Email */}
                        <TableCell>
                          <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {name}
                          </div>
                          <div className="text-[11px] text-zinc-500">{email}</div>
                        </TableCell>

                        {/* 2. Degree */}
                        <TableCell className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {degree}
                        </TableCell>

                        {/* 3. Dept */}
                        <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                          {dept}
                        </TableCell>

                        {/* 4. Pass Year */}
                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                          {passYear}
                        </TableCell>

                        {/* 5. CGPA */}
                        <TableCell className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {cgpa}
                        </TableCell>

                        {/* 6. Applied on */}
                        <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                          {formatDate(app.created_at)}
                        </TableCell>

                        {/* 7. Actions */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {defaultNextStage && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAdvance(app.id)}
                                className="h-7 text-[11px] px-2.5 gap-1 text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-950/40"
                              >
                                Advance
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenSingleClose(app.id)}
                              className="h-7 w-7 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Close candidate"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sticky Bottom Multi-Select Action Bar */}
      {!isClosedTab && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-zinc-800 dark:border-zinc-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pr-2 border-r border-zinc-700 dark:border-zinc-300">
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              {selectedIds.length}
            </Badge>
            <span className="text-xs font-semibold">selected</span>
          </div>

          {/* Advance Dropdown + Button */}
          {subsequentStages.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={bulkTargetStage || defaultNextStage} onValueChange={(val) => setBulkTargetStage(val || '')}>
                <SelectTrigger className="h-8 text-xs bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-700 dark:border-zinc-300 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subsequentStages.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleBulkAdvance}
                disabled={isAdvancingBatch}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {isAdvancingBatch && <Loader2 className="h-3 w-3 animate-spin" />}
                Advance Selected
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Close Selected Button */}
          <Button
            size="sm"
            variant="destructive"
            onClick={handleOpenBulkClose}
            className="h-8 text-xs gap-1.5"
          >
            <XCircle className="h-3.5 w-3.5" />
            Close Selected
          </Button>

          {/* Clear selection */}
          <button
            onClick={() => setSelectedIds([])}
            className="text-zinc-400 hover:text-white dark:hover:text-zinc-900 text-xs ml-1"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Paste Recruiter Shortlist Modal */}
      <PasteShortlistModal
        open={isPasteModalOpen}
        onOpenChange={setIsPasteModalOpen}
        currentStage={currentStageId}
        jobId={jobId}
        candidates={applications}
        stageOptions={stageOptions}
        onSuccess={() => router.refresh()}
      />

      {/* Close Reason Modal */}
      <CloseReasonModal
        open={isCloseModalOpen}
        onOpenChange={setIsCloseModalOpen}
        applicationIds={closeTargetIds}
        currentStage={currentStageId}
        jobId={jobId}
        candidateNames={selectedCandidateNames}
        onSuccess={() => {
          setSelectedIds([])
          router.refresh()
        }}
      />
    </div>
  )
}
