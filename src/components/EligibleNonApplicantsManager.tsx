'use client'

import { useState, useMemo } from 'react'
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
import { recordNonApplicantResolution, bulkRecordNonApplicantResolution } from '@/app/(dashboards)/college/actions'
import { TableColumnFilter, TableColumnSort } from '@/components/TableColumnFilter'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Search, ShieldAlert, CheckCircle, AlertTriangle, Loader2, UserX, Clock, Filter, Download, RotateCcw } from 'lucide-react'
import type { EligibleNonApplicant } from '@/lib/non-applicants-helper'

interface EligibleNonApplicantsManagerProps {
  jobId: string
  jobTitle: string
  isDeadlinePassed: boolean
  nonApplicants: EligibleNonApplicant[]
}

export function EligibleNonApplicantsManager({
  jobId,
  jobTitle,
  isDeadlinePassed,
  nonApplicants = [],
}: EligibleNonApplicantsManagerProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // Column Filters & Sorting State
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [sortField, setSortField] = useState<'passYear' | 'cgpa' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const availableDegrees = useMemo(() => {
    const set = new Set<string>()
    nonApplicants.forEach((s) => {
      if (s.degreeType && s.degreeType !== '—') set.add(s.degreeType)
    })
    return Array.from(set).sort()
  }, [nonApplicants])

  const availableDepts = useMemo(() => {
    const set = new Set<string>()
    nonApplicants.forEach((s) => {
      if (s.department && s.department !== '—') set.add(s.department)
    })
    return Array.from(set).sort()
  }, [nonApplicants])

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

  // Filter & Sort non-applicants based on search query, column filters, and sort field
  const filteredList = useMemo(() => {
    let result = nonApplicants

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.degreeType.toLowerCase().includes(q) ||
          s.gradYear.toLowerCase().includes(q)
      )
    }

    if (selectedDegrees.length > 0) {
      result = result.filter((s) => selectedDegrees.includes(s.degreeType))
    }

    if (selectedDepts.length > 0) {
      result = result.filter((s) => selectedDepts.includes(s.department))
    }

    if (sortField) {
      const mult = sortDirection === 'asc' ? 1 : -1
      result = [...result].sort((a, b) => {
        if (sortField === 'cgpa') {
          const cA = parseFloat(a.gpa?.toString() || '0') || 0
          const cB = parseFloat(b.gpa?.toString() || '0') || 0
          return mult * (cA - cB)
        }
        if (sortField === 'passYear') {
          const yA = parseInt(a.gradYear || '0', 10) || 0
          const yB = parseInt(b.gradYear || '0', 10) || 0
          if (yA && yB) return mult * (yA - yB)
          return mult * (a.gradYear || '').localeCompare(b.gradYear || '')
        }
        return 0
      })
    }

    return result
  }, [nonApplicants, search, selectedDegrees, selectedDepts, sortField, sortDirection])

  // Select all toggle
  const allFilteredSelected =
    filteredList.length > 0 && filteredList.every((s) => selectedIds.includes(s.studentId))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredList.map((s) => s.studentId))
    }
  }

  const toggleSelectOne = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  // Single action: Excuse or Penalize
  const handleSingleAction = async (studentId: string, action: 'excuse' | 'penalize') => {
    setProcessingId(studentId)
    const res = await recordNonApplicantResolution({
      jobId,
      studentId,
      action,
    })
    setProcessingId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
      setSelectedIds((prev) => prev.filter((id) => id !== studentId))
      router.refresh()
    }
  }

  // Bulk action: Excuse or Penalize
  const handleBulkAction = async (action: 'excuse' | 'penalize') => {
    if (selectedIds.length === 0) return
    setIsBulkProcessing(true)

    const res = await bulkRecordNonApplicantResolution({
      jobId,
      studentIds: selectedIds,
      action,
    })
    setIsBulkProcessing(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
      setSelectedIds([])
      router.refresh()
    }
  }

  // Excel Export
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      toast.error('No eligible non-applicants to export.')
      return
    }

    const rows = filteredList.map((cand, index) => ({
      '#': index + 1,
      'Candidate': cand.name,
      'Email': cand.email,
      'Degree': cand.degreeType,
      'Dept': cand.department,
      'Pass Year': cand.gradYear,
      'CGPA': cand.gpa,
      'Previous Strikes': cand.nonParticipationStrikes,
      'Roll / USN': cand.rollNumber,
      'Active Backlogs': cand.activeBacklogs,
      'Status': 'Eligible Non-Applicant'
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Non_Applicants')

    const cleanTitle = (jobTitle || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_')
    XLSX.writeFile(workbook, `${cleanTitle}_Eligible_Non_Applicants.xlsx`)
    toast.success(`Exported ${filteredList.length} candidate(s) to Excel!`)
  }

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {isDeadlinePassed ? (
        <div className="p-3.5 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Application Deadline Passed:</strong> The {nonApplicants.length} students listed below were academically eligible (CGPA, Branch, Backlogs) but did not submit an application. You can either <strong>Excuse</strong> them (e.g. pre-approved medical or exam leave) or <strong>Issue a Non-Participation Strike</strong>.
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <strong>Applications Open:</strong> This drive is currently accepting applications. These {nonApplicants.length} eligible students have not applied yet.
          </div>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-zinc-900 p-3 rounded-lg border">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Search by name, roll number, or department..."
            className="pl-8 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            Showing <strong>{filteredList.length}</strong> of <strong>{nonApplicants.length}</strong> eligible non-applicants
          </span>
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
              className="gap-1 text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              title="Reset all active column filters and sorting"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 text-xs h-8 border-zinc-300 dark:border-zinc-700"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            Export (.xlsx)
          </Button>
        </div>
      </div>

      {/* Non-Applicants Table */}
      <div className="rounded-xl border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableRow>
              <TableHead className="w-10 pl-4">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </TableHead>
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
              <TableHead className="text-xs font-semibold">Previous Strikes</TableHead>
              <TableHead className="text-xs font-semibold text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {search ? 'No eligible non-applicants match your search filter.' : 'All eligible students have applied or been resolved!'}
                    </p>
                    {search && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Try clearing your search query &ldquo;{search}&rdquo;
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredList.map((cand) => {
                const isSelected = selectedIds.includes(cand.studentId)
                const isItemProcessing = processingId === cand.studentId || isBulkProcessing

                return (
                  <TableRow key={cand.studentId} className={`transition-colors ${isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                    <TableCell className="pl-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(cand.studentId)}
                        aria-label={`Select ${cand.name}`}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </TableCell>

                    {/* 1. Candidate Name & Email */}
                    <TableCell>
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {cand.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">{cand.email}</div>
                    </TableCell>

                    {/* 2. Degree */}
                    <TableCell className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {cand.degreeType || '—'}
                    </TableCell>

                    {/* 3. Dept */}
                    <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                      {cand.department || '—'}
                    </TableCell>

                    {/* 4. Pass Year */}
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      {cand.gradYear || '—'}
                    </TableCell>

                    {/* 5. CGPA */}
                    <TableCell className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {cand.gpa || '—'}
                    </TableCell>

                    {/* 6. Previous Strikes */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          cand.nonParticipationStrikes > 0
                            ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {cand.nonParticipationStrikes} Strike{cand.nonParticipationStrikes !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>

                    {/* 7. Actions */}
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isItemProcessing}
                          onClick={() => handleSingleAction(cand.studentId, 'excuse')}
                          className="h-7 text-xs text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          Excuse
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isItemProcessing}
                          onClick={() => handleSingleAction(cand.studentId, 'penalize')}
                          className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30 gap-1"
                        >
                          {processingId === cand.studentId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldAlert className="h-3 w-3 text-amber-600" />
                          )}
                          Issue Strike
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sticky Bottom Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg shadow-xl border border-zinc-800 dark:border-zinc-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
              {selectedIds.length}
            </span>
            <span>Candidates Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isBulkProcessing}
              onClick={() => setSelectedIds([])}
              className="h-8 text-xs bg-transparent text-white dark:text-zinc-900 border-zinc-700 dark:border-zinc-300 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Clear Selection
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isBulkProcessing}
              onClick={() => handleBulkAction('excuse')}
              className="h-8 text-xs gap-1.5"
            >
              {isBulkProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              Excuse Selected ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              disabled={isBulkProcessing}
              onClick={() => handleBulkAction('penalize')}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {isBulkProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5" />
              )}
              Issue Strikes to Selected ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
