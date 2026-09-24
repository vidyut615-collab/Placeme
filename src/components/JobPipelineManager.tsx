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

  // Map subsequent stages for advancing
  const currentStageIndex = stageOptions.findIndex(s => s.id === currentStageId)
  const subsequentStages = currentStageIndex >= 0 
    ? stageOptions.slice(currentStageIndex + 1).filter(s => s.id !== 'closed' && s.id !== 'overview')
    : stageOptions.filter(s => s.id !== 'closed' && s.id !== 'overview' && s.id !== currentStageId)

  const defaultNextStage = subsequentStages[0]?.id || ''
  const [bulkTargetStage, setBulkTargetStage] = useState<string>(defaultNextStage)

  // Filter candidates by search query
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return applications

    const q = searchQuery.toLowerCase().trim()
    return applications.filter(app => {
      const student = app.students
      const profile = student?.profile_data || {}
      const personal = profile.personal || {}
      const academic = profile.academic || {}

      const name = (personal.full_name || profile.name || '').toLowerCase()
      const roll = (personal.roll_number || profile.roll_number || academic.roll_no || '').toLowerCase()
      const email = (student?.user_email || personal.email || profile.email || '').toLowerCase()
      const dept = (academic.department || profile.department || '').toLowerCase()

      return name.includes(q) || roll.includes(q) || email.includes(q) || dept.includes(q)
    })
  }, [applications, searchQuery])

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

      const name = personal.full_name || profile.name || 'N/A'
      const rollNo = personal.roll_number || profile.roll_number || academic.roll_no || 'N/A'
      const email = student?.user_email || personal.email || profile.email || 'N/A'
      const phone = personal.phone || profile.phone || 'N/A'
      const dept = academic.department || profile.department || 'N/A'
      const degree = academic.degree || academic.type || profile.degree || 'N/A'
      const batch = academic.batch || academic.year || profile.batch || 'N/A'
      const cgpa = academic.cgpa || profile.cgpa || 'N/A'
      const appliedAt = app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'

      if (isClosedTab) {
        return {
          '#': index + 1,
          'Name': name,
          'Roll / USN': rollNo,
          'Email': email,
          'Phone': phone,
          'Department': dept,
          'Degree': degree,
          'Batch': batch,
          'CGPA': cgpa,
          'Date Applied': appliedAt,
          'Exit Reason': app.dropped_reason || (app.is_withdrawn ? 'Self-Withdrawn by Student' : 'Closed by College'),
          'Withdrawn by Student': app.is_withdrawn ? 'Yes' : 'No',
          'Exit Date': app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'N/A'
        }
      }

      return {
        '#': index + 1,
        'Name': name,
        'Roll / USN': rollNo,
        'Email': email,
        'Phone': phone,
        'Department': dept,
        'Degree': degree,
        'Batch': batch,
        'CGPA': cgpa,
        'Date Applied': appliedAt,
        'Current Stage': currentStageLabel
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
              <TableHead className="text-xs font-semibold">Candidate</TableHead>
              <TableHead className="text-xs font-semibold">Roll / USN</TableHead>
              <TableHead className="text-xs font-semibold">Program & Branch</TableHead>
              <TableHead className="text-xs font-semibold">CGPA</TableHead>
              {isClosedTab ? (
                <>
                  <TableHead className="text-xs font-semibold">Exit Reason</TableHead>
                  <TableHead className="text-xs font-semibold">Exit Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Action</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="text-xs font-semibold">Applied On</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isClosedTab ? 7 : 7} className="h-40 text-center">
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

                const name = personal.full_name || profile.name || 'Candidate'
                const roll = personal.roll_number || profile.roll_number || academic.roll_no || '—'
                const email = student?.user_email || personal.email || profile.email || '—'
                const dept = academic.department || profile.department || '—'
                const degree = academic.degree || academic.type || profile.degree || ''
                const cgpa = academic.cgpa || profile.cgpa || '—'
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

                    {/* Candidate Name & Email */}
                    <TableCell>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {name}
                      </div>
                      <div className="text-[11px] text-zinc-500">{email}</div>
                    </TableCell>

                    {/* Roll No */}
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      {roll}
                    </TableCell>

                    {/* Program & Branch */}
                    <TableCell>
                      <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {dept}
                      </div>
                      {degree && <div className="text-[11px] text-zinc-400">{degree}</div>}
                    </TableCell>

                    {/* CGPA */}
                    <TableCell className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {cgpa}
                    </TableCell>

                    {isClosedTab ? (
                      <>
                        {/* Exit Reason */}
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 block">
                              {app.dropped_reason || (app.is_withdrawn ? 'Self-Withdrawn by Student' : 'Closed by College')}
                            </span>
                            {app.is_withdrawn ? (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">
                                Student Withdrawn
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                College Dropped
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Exit Date */}
                        <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                          {formatDate(app.updated_at)}
                        </TableCell>

                        {/* Reinstate Action */}
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
                    ) : (
                      <>
                        {/* Applied Date */}
                        <TableCell className="text-xs text-zinc-500" suppressHydrationWarning>
                          {formatDate(app.created_at)}
                        </TableCell>

                        {/* Quick Row Actions */}
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
