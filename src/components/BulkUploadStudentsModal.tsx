'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  checkExistingStudentEmails,
  bulkInviteStudents,
} from '@/app/(dashboards)/agency/actions'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Copy,
  UserCheck,
  Download,
  Loader2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

export interface ParsedStudentRow {
  rowNumber: number
  email: string
  status: 'valid' | 'invalid' | 'duplicate' | 'already_registered' | 'already_invited'
  reason: string
}

interface BulkUploadStudentsModalProps {
  collegeId: string
  collegeName: string
}

export function BulkUploadStudentsModal({
  collegeId,
  collegeName,
}: BulkUploadStudentsModalProps) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1: Uploading & Verification
  const [fileName, setFileName] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([])

  // Step 2: Review Table Filter & Search
  const [tableFilter, setTableFilter] = useState<'all' | 'valid' | 'issues'>('all')
  const [tableSearch, setTableSearch] = useState('')

  // Step 3: Inviting Execution
  const [isInviting, setIsInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{
    successCount: number
    failedCount: number
  } | null>(null)

  const resetState = () => {
    setFileName(null)
    setIsVerifying(false)
    setParseError(null)
    setParsedRows([])
    setTableFilter('all')
    setTableSearch('')
    setIsInviting(false)
    setInviteResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isInviting) {
      setOpen(isOpen)
      if (!isOpen) {
        resetState()
      }
    }
  }

  // Generate and download a sample Excel template
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Email'],
      ['alex.kumar@example.com'],
      ['priya.sharma@example.com'],
      ['rahul.verma@example.com'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, 'placeme_student_template.xlsx')
  }

  // Parse Excel / CSV and run 3-Tier Validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    setParsedRows([])
    setInviteResult(null)
    setFileName(file.name)
    setIsVerifying(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })

      const firstSheetName = workbook.SheetNames[0]
      if (!firstSheetName) {
        throw new Error('The uploaded workbook contains no sheets.')
      }

      const worksheet = workbook.Sheets[firstSheetName]
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (!rawRows || rawRows.length === 0) {
        throw new Error('The uploaded spreadsheet is completely empty.')
      }

      // TIER 1: Column Header Validation (Row 1, Column A must be Email)
      const headerCell = rawRows[0]?.[0]
      const cleanHeader = String(headerCell || '').trim().toLowerCase()

      if (cleanHeader !== 'email') {
        throw new Error(
          `Invalid file format: Column A, Row 1 must have the header 'Email' (found: "${headerCell || 'empty'}").`
        )
      }

      if (rawRows.length <= 1) {
        throw new Error('No student data rows found below the header row.')
      }

      // TIER 2: Syntax & In-File Duplicate Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const seenInFile = new Set<string>()
      const preliminaryRows: Array<{
        rowNumber: number
        email: string
        status: ParsedStudentRow['status']
        reason: string
      }> = []

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i]
        const rowNum = i + 1
        const rawVal = row ? row[0] : null
        const emailStr = String(rawVal || '').trim()

        // 1. Empty Check
        if (!emailStr) {
          preliminaryRows.push({
            rowNumber: rowNum,
            email: '—',
            status: 'invalid',
            reason: 'Empty row (missing email address)',
          })
          continue
        }

        const lowerEmail = emailStr.toLowerCase()

        // 2. Syntax Check
        if (!emailRegex.test(lowerEmail)) {
          preliminaryRows.push({
            rowNumber: rowNum,
            email: emailStr,
            status: 'invalid',
            reason: 'Invalid email syntax (missing @ or domain)',
          })
          continue
        }

        // 3. In-File Duplicate Check
        if (seenInFile.has(lowerEmail)) {
          preliminaryRows.push({
            rowNumber: rowNum,
            email: emailStr,
            status: 'duplicate',
            reason: 'Duplicate email in this file',
          })
          continue
        }

        seenInFile.add(lowerEmail)
        preliminaryRows.push({
          rowNumber: rowNum,
          email: emailStr,
          status: 'valid',
          reason: 'Ready to invite',
        })
      }

      // TIER 3: Global System Existence Check
      // Only check emails that passed syntax and in-file duplicate checks
      const emailsToCheck = preliminaryRows
        .filter((r) => r.status === 'valid')
        .map((r) => r.email)

      let registeredSet = new Set<string>()
      let pendingSet = new Set<string>()

      if (emailsToCheck.length > 0) {
        const sysCheck = await checkExistingStudentEmails(emailsToCheck)
        if (sysCheck.error) {
          throw new Error(`Database verification failed: ${sysCheck.error}`)
        }
        registeredSet = new Set(
          (sysCheck.registered || []).map((e: string) => e.toLowerCase())
        )
        pendingSet = new Set(
          (sysCheck.pending || []).map((e: string) => e.toLowerCase())
        )
      }

      // Final classification
      const finalizedRows: ParsedStudentRow[] = preliminaryRows.map((item) => {
        if (item.status !== 'valid') return item

        const lower = item.email.toLowerCase()
        if (registeredSet.has(lower)) {
          return {
            ...item,
            status: 'already_registered',
            reason: 'Already registered in the platform',
          }
        }
        if (pendingSet.has(lower)) {
          return {
            ...item,
            status: 'already_invited',
            reason: 'Already invited (pending onboarding)',
          }
        }
        return item
      })

      setParsedRows(finalizedRows)
    } catch (err: any) {
      setParseError(err.message || 'An error occurred while parsing the file.')
      setParsedRows([])
    } finally {
      setIsVerifying(false)
    }
  }

  // Counts summary
  const validRows = parsedRows.filter((r) => r.status === 'valid')
  const invalidRows = parsedRows.filter((r) => r.status === 'invalid')
  const duplicateRows = parsedRows.filter((r) => r.status === 'duplicate')
  const existingRows = parsedRows.filter(
    (r) => r.status === 'already_registered' || r.status === 'already_invited'
  )

  // Filtered rows for the review table
  const displayedRows = parsedRows.filter((r) => {
    // 1. Tab filter
    if (tableFilter === 'valid' && r.status !== 'valid') return false
    if (tableFilter === 'issues' && r.status === 'valid') return false

    // 2. Search filter
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase()
      return (
        r.email.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        String(r.rowNumber).includes(q)
      )
    }
    return true
  })

  // Batch Invite Action
  const handleProceedInvites = async () => {
    if (validRows.length === 0) return

    setIsInviting(true)
    const validEmails = validRows.map((r) => r.email)

    try {
      const res = await bulkInviteStudents({
        collegeId,
        emails: validEmails,
      })

      if (res.error) {
        setParseError(res.error)
      } else {
        setInviteResult({
          successCount: res.totalSuccess || 0,
          failedCount: res.totalFailed || 0,
        })
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to dispatch bulk invitations.')
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-blue-600" />
          Bulk Upload Students
        </Button>
      } />

      <DialogContent className="w-[94vw] sm:max-w-5xl md:max-w-6xl lg:max-w-[1200px] h-[85vh] max-h-[680px] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                Bulk Upload Student Invitations
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 mt-1">
                Upload a spreadsheet with student emails to analyze, validate, and send invitations for{' '}
                <strong className="text-zinc-800 dark:text-zinc-200">{collegeName}</strong>.
              </DialogDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              Download Sample Template
            </Button>
          </div>
        </DialogHeader>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* SUCCESS SCREEN */}
          {inviteResult ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Bulk Invitations Sent Successfully!
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  Successfully invited{' '}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {inviteResult.successCount}
                  </span>{' '}
                  new student(s) via ZeptoMail.
                  {inviteResult.failedCount > 0 && (
                    <span className="text-red-500 ml-1">
                      ({inviteResult.failedCount} failed to deliver)
                    </span>
                  )}
                </p>
              </div>
              <Button onClick={() => setOpen(false)} className="mt-4 px-6">
                Done & View Directory
              </Button>
            </div>
          ) : (
            <>
              {/* UPLOAD ZONE (Only shown when no parsed data or when resetting) */}
              {parsedRows.length === 0 && !isVerifying && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                    Click or drag & drop student Excel sheet here
                  </h4>
                  <p className="text-xs text-zinc-500 text-center max-w-md">
                    Accepts <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong>. Must have a single column with{' '}
                    <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400">Email</code> as the header in Row 1.
                  </p>
                </div>
              )}

              {/* VERIFYING LOADER */}
              {isVerifying && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Analyzing spreadsheet & running 3-tier validation...
                  </p>
                  <p className="text-xs text-zinc-400">
                    Checking syntax, in-file duplicates, and existing database accounts
                  </p>
                </div>
              )}

              {/* ERROR ALERT */}
              {parseError && (
                <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">Validation Error:</span> {parseError}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetState}
                    className="h-6 text-[11px] px-2 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* VALIDATION REPORT & PREVIEW TABLE */}
              {parsedRows.length > 0 && !isVerifying && (
                <div className="space-y-4">
                  {/* File Info Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-zinc-100/70 dark:bg-zinc-800/60 rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {fileName}
                      </span>
                      <span className="text-zinc-400">({parsedRows.length} total rows)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetState}
                      className="h-7 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 flex items-center gap-1 self-start sm:self-auto"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Upload Different File
                    </Button>
                  </div>

                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40">
                      <div className="text-[11px] font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ready to Invite
                      </div>
                      <div className="text-2xl font-bold text-green-800 dark:text-green-300 mt-1">
                        {validRows.length}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40">
                      <div className="text-[11px] font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Invalid Format
                      </div>
                      <div className="text-2xl font-bold text-red-800 dark:text-red-300 mt-1">
                        {invalidRows.length}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40">
                      <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <Copy className="h-3.5 w-3.5" />
                        In-File Duplicates
                      </div>
                      <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1">
                        {duplicateRows.length}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40">
                      <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5" />
                        Already in System
                      </div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1">
                        {existingRows.length}
                      </div>
                    </div>
                  </div>

                  {/* Table Toolbar (Filter tabs & Search) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setTableFilter('all')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                          tableFilter === 'all'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                        }`}
                      >
                        All ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableFilter('valid')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                          tableFilter === 'valid'
                            ? 'bg-white dark:bg-zinc-900 text-green-700 dark:text-green-300 shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                        }`}
                      >
                        Ready ({validRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableFilter('issues')}
                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                          tableFilter === 'issues'
                            ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-300 shadow-xs'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                        }`}
                      >
                        Skipped / Issues ({invalidRows.length + duplicateRows.length + existingRows.length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <Input
                        placeholder="Search emails..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="h-8 pl-8 pr-7 text-xs bg-white dark:bg-zinc-900"
                      />
                      {tableSearch && (
                        <button
                          type="button"
                          onClick={() => setTableSearch('')}
                          className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Data Table */}
                  <div className="rounded-lg border bg-white dark:bg-zinc-900 overflow-hidden">
                    <div className="max-h-72 overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-16 text-xs">Row</TableHead>
                            <TableHead className="text-xs">Email</TableHead>
                            <TableHead className="w-36 text-xs">Status</TableHead>
                            <TableHead className="text-xs">Reason / Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedRows.length > 0 ? (
                            displayedRows.map((r, idx) => (
                              <TableRow key={`${r.rowNumber}-${idx}`} className="text-xs">
                                <TableCell className="font-mono text-zinc-400 text-xs">
                                  #{r.rowNumber}
                                </TableCell>
                                <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">
                                  {r.email}
                                </TableCell>
                                <TableCell>
                                  {r.status === 'valid' && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-green-200"
                                    >
                                      Ready
                                    </Badge>
                                  )}
                                  {r.status === 'invalid' && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200"
                                    >
                                      Invalid
                                    </Badge>
                                  )}
                                  {r.status === 'duplicate' && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200"
                                    >
                                      Duplicate
                                    </Badge>
                                  )}
                                  {(r.status === 'already_registered' ||
                                    r.status === 'already_invited') && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200"
                                    >
                                      {r.status === 'already_invited' ? 'Already Invited' : 'Registered'}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-zinc-500 text-[11px]">
                                  {r.reason}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-zinc-400 text-xs">
                                No student records found matching this view.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        {!inviteResult && (
          <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-zinc-500">
              {parsedRows.length > 0 ? (
                <span>
                  Only the <strong className="text-green-600 dark:text-green-400">{validRows.length} valid</strong> email(s) will receive onboarding invites.
                </span>
              ) : (
                <span>Upload an Excel spreadsheet with student emails to begin.</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isInviting}
                className="w-full sm:w-auto text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleProceedInvites}
                disabled={isVerifying || isInviting || validRows.length === 0}
                className="w-full sm:w-auto text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Sending Invitations ({validRows.length})...
                  </>
                ) : (
                  <>Send Invites to Valid Students ({validRows.length})</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
