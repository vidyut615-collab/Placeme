'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  RotateCcw,
  History,
  FileText,
  AlertTriangle,
  GraduationCap,
  User,
  Code,
  Link2,
  Building2,
  IndianRupee,
  MapPin,
  Mail,
  ExternalLink,
  Download,
  AlertCircle,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { TableColumnFilter, TableColumnSort } from '@/components/TableColumnFilter'
import { revokeApproval } from '@/app/(dashboards)/college/approvals/actions'
import { formatDate } from '@/lib/utils'

// Helper function from OfferApprovalsList
function getStudentDetailsLocal(student: any) {
  const profile = student?.profile_data || {}
  const personal = profile.personal || {}
  const academic = profile.academic || {}

  const rawUsers = student?.users
  const userEmail = Array.isArray(rawUsers) ? rawUsers[0]?.email : rawUsers?.email
  const email = userEmail || student?.email || profile.email || personal.email || ''

  let studentName = profile.full_name || personal.full_name
  if (!studentName && (profile.first_name || profile.last_name)) {
    const parts = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean)
    studentName = parts.join(' ').trim()
  }
  if (!studentName && (personal.first_name || personal.last_name)) {
    const parts = [personal.first_name, personal.last_name].filter(Boolean)
    studentName = parts.join(' ').trim()
  }
  if (!studentName && profile.name) {
    studentName = profile.name
  }
  if (!studentName && email) {
    const prefix = email.split('@')[0]
    studentName = prefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  }
  if (!studentName) studentName = 'Student'

  const rawRoll = profile.roll_number || profile.roll_no || profile.usn || profile.reg_no || personal.roll_number || academic.roll_no
  const rollNo = rawRoll && rawRoll !== '—' && rawRoll !== '-' ? String(rawRoll).trim() : null

  const rawDept = profile.department || academic.department || profile.dept
  const department = rawDept && rawDept !== '—' ? String(rawDept).trim() : null

  const rawDegree = profile.type || academic.degree || profile.degree
  const degree = rawDegree && rawDegree !== '—' ? String(rawDegree).trim() : null

  const rawYear = profile.year || academic.passing_year || profile.batch
  const year = rawYear && rawYear !== '—' ? String(rawYear).trim() : null

  const rawGpa = profile.gpa || academic.gpa || profile.cgpa
  const gpa = rawGpa && rawGpa !== '—' ? String(rawGpa).trim() : null

  const rawPhone = profile.phone || personal.phone
  const phone = rawPhone && rawPhone !== '—' ? String(rawPhone).trim() : null

  return { studentName, rollNo, email, department, degree, year, gpa, phone }
}

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  first_name: 'First Name',
  middle_name: 'Middle Name',
  last_name: 'Last Name',
  phone: 'Contact Phone',
  type: 'Degree / Program',
  department: 'Department / Branch',
  year: 'Passing Year / Batch',
  gpa: 'Cumulative GPA / CGPA',
  academic_10th: '10th Percentage / Score',
  academic_12th: '12th Percentage / Score',
  diploma_percentage: 'Diploma Percentage',
  graduation_percentage: 'Graduation Percentage',
  active_backlogs: 'Active Backlogs',
  historical_backlogs: 'Historical Backlogs',
  academic_gap_years: 'Academic Gap Years',
}

const ACADEMIC_KEYS = ['gpa', 'type', 'department', 'year', 'academic_10th', 'academic_12th', 'diploma_percentage', 'graduation_percentage', 'active_backlogs', 'historical_backlogs', 'academic_gap_years']
const PERSONAL_KEYS = ['full_name', 'first_name', 'middle_name', 'last_name', 'phone']

function normalizeVal(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v).trim()
}

function countTotalChanges(oldData: any, newData: any): number {
  let count = 0
  const allKeys = Array.from(new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]))
  for (const k of allKeys) {
    if (k === 'skills' || k === 'links' || k === 'projects' || k === 'experience' || k === 'education') {
      if (JSON.stringify(oldData?.[k] || null) !== JSON.stringify(newData?.[k] || null)) count++
    } else {
      if (normalizeVal(oldData?.[k]) !== normalizeVal(newData?.[k])) count++
    }
  }
  return count
}

export function ApprovalLogTable({ logs }: { logs: any[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewingLog, setViewingLog] = useState<any | null>(null)
  const [revokingLog, setRevokingLog] = useState<any | null>(null)

  // Filters and Pagination
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [actionByFilter, setActionByFilter] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRevoke = async () => {
    if (!revokingLog) return
    setProcessingId(revokingLog.id)
    const res = await revokeApproval(revokingLog.id)
    setProcessingId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
      setRevokingLog(null)
    }
  }

  const handleOpenInNewTab = (dataUrl: string) => {
    if (dataUrl.startsWith('data:')) {
      const win = window.open()
      if (win) {
        if (dataUrl.startsWith('data:application/pdf')) {
          win.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
        } else {
          win.document.write(`<body style="margin:0; background:#09090b; display:flex; align-items:center; justify-content:center; min-height:100vh;"><img src="${dataUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;" /></body>`)
        }
        win.document.title = `Offer Letter Document`
      }
    } else {
      window.open(dataUrl, '_blank')
    }
  }

  const processedLogs = logs.map(log => {
    const studentDetails = getStudentDetailsLocal(log.students)
    return {
      ...log,
      studentName: studentDetails.studentName,
      studentEmail: studentDetails.email,
      adminEmail: log.admin?.email || 'Admin',
      typeLabel: log.entity_type === 'placement_offer' ? 'Placement Offer' : 'Profile Audit'
    }
  })

  const uniqueAdminEmails = Array.from(new Set(processedLogs.map(l => l.adminEmail))).filter(Boolean) as string[]

  const filteredLogs = processedLogs.filter(log => {
    const matchesType = typeFilter.length === 0 || typeFilter.includes(log.typeLabel)
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(log.status)
    const matchesActionBy = actionByFilter.length === 0 || actionByFilter.includes(log.adminEmail)
    return matchesType && matchesStatus && matchesActionBy
  })

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let valA = a[sortConfig.key]
    let valB = b[sortConfig.key]
    
    if (sortConfig.key === 'typeLabel') {
      valA = a.typeLabel
      valB = b.typeLabel
    } else if (sortConfig.key === 'studentName') {
      valA = a.studentName
      valB = b.studentName
    } else if (sortConfig.key === 'adminEmail') {
      valA = a.adminEmail
      valB = b.adminEmail
    } else if (sortConfig.key === 'status') {
      valA = a.status
      valB = b.status
    } else {
      valA = a.created_at
      valB = b.created_at
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedLogs.length / pageSize)
  const paginatedLogs = sortedLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const hasActiveFilters = typeFilter.length > 0 || statusFilter.length > 0 || actionByFilter.length > 0
  const activeFiltersCount = typeFilter.length + statusFilter.length + actionByFilter.length

  const handleClearAllFilters = () => {
    setTypeFilter([])
    setStatusFilter([])
    setActionByFilter([])
    setCurrentPage(1)
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 border rounded-xl dark:bg-zinc-900 border-dashed">
        <History className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No Logs Found</h3>
        <p className="text-xs text-zinc-500 mt-1">There are no recorded approval logs yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Clear Filters Bar (only visible when filters are applied) */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg px-3 py-1.5 text-xs animate-in fade-in-0 duration-150">
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
            <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              <strong className="text-blue-900 dark:text-blue-200 font-semibold">{activeFiltersCount}</strong> active {activeFiltersCount === 1 ? 'filter' : 'filters'} applied
              <span className="text-zinc-400 mx-1.5">•</span>
              Showing {filteredLogs.length} of {processedLogs.length} logs
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAllFilters}
            className="h-6 px-2 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 gap-1 rounded transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
              <tr>
                <th className="px-4 py-2">
                  <TableColumnSort
                    title="Date & Time"
                    field="created_at"
                    currentField={sortConfig.key}
                    currentDirection={sortConfig.direction}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-4 py-2">
                  <TableColumnFilter
                    title="Type"
                    options={['Placement Offer', 'Profile Audit']}
                    selectedValues={typeFilter}
                    onChange={(vals) => { setTypeFilter(vals); setCurrentPage(1); }}
                    showSearch={false}
                  />
                </th>
                <th className="px-4 py-2">
                  <div className="inline-flex items-center gap-1.5 font-semibold text-xs py-1 px-1.5">
                    Requested By
                  </div>
                </th>
                <th className="px-4 py-2">
                  <TableColumnFilter
                    title="Action By"
                    options={uniqueAdminEmails}
                    selectedValues={actionByFilter}
                    onChange={(vals) => { setActionByFilter(vals); setCurrentPage(1); }}
                  />
                </th>
                <th className="px-4 py-2">
                  <TableColumnFilter
                    title="Status"
                    options={['approved', 'rejected']}
                    selectedValues={statusFilter}
                    onChange={(vals) => { setStatusFilter(vals); setCurrentPage(1); }}
                    showSearch={false}
                  />
                </th>
                <th className="px-4 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5 font-semibold text-xs py-1 px-1.5">
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 text-xs">No matching logs found.</td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {log.typeLabel}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{log.studentName}</div>
                      <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">{log.studentEmail}</div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400">
                      {log.adminEmail}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {log.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-800 text-[9px] py-0">Approved</Badge>}
                      {log.status === 'rejected' && <Badge className="bg-red-100 text-red-800 text-[9px] py-0">Rejected</Badge>}
                      {log.status === 'revoked' && <Badge className="bg-amber-100 text-amber-800 text-[9px] py-0">Revoked</Badge>}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="icon" onClick={() => setViewingLog(log)} className="h-7 w-7 text-zinc-500 hover:text-blue-600 bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-900/50" title="View Review">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {log.status === 'approved' && (
                          <Button variant="ghost" size="icon" onClick={() => setRevokingLog(log)} className="h-7 w-7 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50" title="Revoke">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sortedLogs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 pt-1">
          <div>
            Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{Math.min(currentPage * pageSize, sortedLogs.length)}</span> of{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{sortedLogs.length}</span> entries (50 per page)
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="px-2.5 font-medium text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Replicated Widescreen Review Modal */}
      <Dialog open={!!viewingLog} onOpenChange={(open) => !open && setViewingLog(null)}>
        <DialogContent
          className="!w-[min(95vw,calc(90vh*16/9))] !max-w-[min(95vw,calc(90vh*16/9))] sm:!max-w-[min(95vw,calc(90vh*16/9))] h-[90vh] max-h-[90vh] flex flex-col p-5 md:p-6 overflow-hidden gap-0"
          style={{ width: 'min(95vw, calc(90vh * 16 / 9))', maxWidth: 'min(95vw, calc(90vh * 16 / 9))', height: '90vh', maxHeight: '90vh' }}
        >
          {viewingLog && (() => {
            const studentDetails = getStudentDetailsLocal(viewingLog.students)
            
            // Layout for Placement Offers
            if (viewingLog.entity_type === 'placement_offer') {
              const offer = viewingLog.snapshot_data
              const isPdf = offer?.offer_letter_url?.startsWith('data:application/pdf') || offer?.offer_letter_url?.toLowerCase().includes('.pdf')
              
              return (
                <div className="flex flex-col h-full overflow-hidden">
                  <DialogHeader className="pb-3 border-b shrink-0 pr-8">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                          <span>Placement Offer Verification Log</span>
                          <span className="text-zinc-400 font-normal">•</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{offer?.company_name}</span>
                          <Badge className={viewingLog.status === 'approved' ? "bg-emerald-100 text-emerald-800 text-[10px]" : viewingLog.status === 'rejected' ? "bg-red-100 text-red-800 text-[10px]" : "bg-amber-100 text-amber-800 text-[10px]"}>
                            {viewingLog.status.toUpperCase()}
                          </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                          Candidate: <strong className="text-zinc-700 dark:text-zinc-300">{studentDetails.studentName}</strong>
                          {studentDetails.rollNo ? ` (${studentDetails.rollNo})` : ''} • Role: <strong className="text-zinc-700 dark:text-zinc-300">{offer?.job_role}</strong>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 overflow-hidden">
                    <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto pr-1 space-y-3.5">
                      
                      {viewingLog.status === 'rejected' && viewingLog.reason && (
                        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs">
                          <strong>Rejection Reason:</strong> {viewingLog.reason}
                        </div>
                      )}

                      <div className="rounded-lg border bg-zinc-50/70 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          Employer & Role Details
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-[11px] text-zinc-500 block">Company</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{offer?.company_name}</span></div>
                          <div><span className="text-[11px] text-zinc-500 block">Role</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{offer?.job_role}</span></div>
                          <div><span className="text-[11px] text-zinc-500 block">Channel</span><span className="font-medium text-zinc-800 dark:text-zinc-200">{offer?.offer_type === 'on_campus' ? 'On-Campus' : 'Off-Campus'}</span></div>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Compensation Package</span>
                        </div>
                        <div className="flex items-baseline gap-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                          <IndianRupee className="h-5 w-5" /><span>{offer?.compensation_ctc}</span><span className="text-sm font-semibold text-zinc-500 ml-1">LPA</span>
                        </div>
                      </div>

                      <div className="rounded-lg border bg-zinc-50/70 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                          Candidate Institutional Profile
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-[11px] text-zinc-500 block">Name</span><span className="font-semibold text-zinc-900 dark:text-zinc-100">{studentDetails.studentName}</span></div>
                          <div><span className="text-[11px] text-zinc-500 block">Roll/USN</span><span className="font-mono text-zinc-800 dark:text-zinc-200">{studentDetails.rollNo || 'N/A'}</span></div>
                          <div><span className="text-[11px] text-zinc-500 block">Department</span><span className="font-medium text-zinc-800 dark:text-zinc-200">{studentDetails.department || 'N/A'}</span></div>
                          <div><span className="text-[11px] text-zinc-500 block">Degree</span><span className="font-medium text-zinc-800 dark:text-zinc-200">{studentDetails.degree || 'N/A'}</span></div>
                        </div>
                      </div>

                      {/* Footer Actions Spacer */}
                      <div className="pt-2 mt-auto border-t flex items-center justify-end">
                        <Button variant="outline" size="sm" onClick={() => setViewingLog(null)} className="h-8 text-xs">Close</Button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900/5 dark:bg-zinc-950 overflow-hidden shadow-xs">
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Offer Letter Document</span>
                        </div>
                        {offer?.offer_letter_url && (
                          <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="sm" onClick={() => handleOpenInNewTab(offer.offer_letter_url)} className="h-7 text-[11px] gap-1 px-2.5">
                              <ExternalLink className="h-3 w-3" /> Open Full
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 w-full h-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-2">
                        {offer?.offer_letter_url ? (
                          isPdf ? (
                            <iframe src={offer.offer_letter_url} className="w-full h-full rounded border-0 bg-white shadow-xs" title="Offer Letter PDF" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={offer.offer_letter_url} alt="Offer Letter" className="max-h-full max-w-full object-contain rounded-md shadow-md border bg-white" />
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                            <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-2" />
                            <p className="text-sm font-medium">No Document</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            } 
            
            // Layout for Profile Audits
            else {
              const oldData = viewingLog.snapshot_data?.old_data || {}
              const newData = viewingLog.snapshot_data?.new_data || {}
              const totalDiffs = countTotalChanges(oldData, newData)

              const renderFieldCompare = (key: string, label: string) => {
                const oldVal = oldData[key]
                const newVal = newData[key]
                const isChanged = normalizeVal(oldVal) !== normalizeVal(newVal)

                return {
                  isChanged,
                  leftNode: (
                    <div key={`old-${key}`} className={`p-3 rounded-lg border text-xs transition-colors ${isChanged ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                        <span className="font-medium">{label}</span>
                        {isChanged && <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300">Previous</Badge>}
                      </div>
                      <div className={`font-semibold ${isChanged ? 'text-zinc-700 dark:text-zinc-300 line-through decoration-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== '' ? String(oldVal) : <span className="text-zinc-400 italic font-normal">Not Set</span>}
                      </div>
                    </div>
                  ),
                  rightNode: (
                    <div key={`new-${key}`} className={`p-3 rounded-lg border text-xs transition-colors ${isChanged ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                        <span className="font-medium">{label}</span>
                        {isChanged && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">Modified</Badge>}
                      </div>
                      <div className={`font-bold ${isChanged ? 'text-emerald-900 dark:text-emerald-200' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {newVal !== undefined && newVal !== null && String(newVal).trim() !== '' ? String(newVal) : <span className="text-zinc-400 italic font-normal">Empty</span>}
                      </div>
                    </div>
                  )
                }
              }

              const academicFieldRows = ACADEMIC_KEYS.map((key) => renderFieldCompare(key, FIELD_LABELS[key] || key))
              const personalFieldRows = PERSONAL_KEYS.map((key) => renderFieldCompare(key, FIELD_LABELS[key] || key))
              const oldSkills = oldData.skills || {}
              const newSkills = newData.skills || {}
              const skillsDiff = JSON.stringify(oldSkills) !== JSON.stringify(newSkills)
              const oldLinks = oldData.links || {}
              const newLinks = newData.links || {}
              const linksDiff = JSON.stringify(oldLinks) !== JSON.stringify(newLinks)

              return (
                <div className="flex flex-col h-full overflow-hidden">
                  <DialogHeader className="pb-3 border-b shrink-0 pr-8">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <History className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                          <span>Profile Change Log</span>
                          <span className="text-zinc-400 font-normal">•</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{studentDetails.studentName}</span>
                          <Badge className={viewingLog.status === 'approved' ? "bg-emerald-100 text-emerald-800 text-[10px]" : viewingLog.status === 'rejected' ? "bg-red-100 text-red-800 text-[10px]" : "bg-amber-100 text-amber-800 text-[10px]"}>
                            {viewingLog.status.toUpperCase()}
                          </Badge>
                          <Badge className="bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                            {totalDiffs} {totalDiffs === 1 ? 'Field Modified' : 'Fields Modified'}
                          </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                          Candidate: <strong className="text-zinc-700 dark:text-zinc-300">{studentDetails.studentName}</strong>
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-hidden">
                    {/* Left Column: Old Data */}
                    <div className="flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden shadow-xs">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border-b flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Earlier (Current Live Profile)</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-5">
                        {viewingLog.status === 'rejected' && viewingLog.reason && (
                          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs">
                            <strong>Rejection Reason:</strong> {viewingLog.reason}
                          </div>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-600" /> Academic Records
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{academicFieldRows.map((r) => r.leftNode)}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <User className="h-3.5 w-3.5 text-blue-600" /> Personal & Contact
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{personalFieldRows.map((r) => r.leftNode)}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <Code className="h-3.5 w-3.5 text-blue-600" /> Technical Skills
                          </div>
                          <div className="p-3 rounded-lg border bg-white dark:bg-zinc-900 space-y-2 text-xs">
                            <div><span className="text-[11px] text-zinc-500 block">Languages:</span><span className="font-semibold">{oldSkills.languages || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">Frameworks:</span><span className="font-semibold">{oldSkills.frameworks || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">Tools:</span><span className="font-semibold">{oldSkills.tools || '—'}</span></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <Link2 className="h-3.5 w-3.5 text-blue-600" /> Portfolio & Profile Links
                          </div>
                          <div className="p-3 rounded-lg border bg-white dark:bg-zinc-900 space-y-2 text-xs">
                            <div><span className="text-[11px] text-zinc-500 block">LinkedIn:</span><span className="font-medium truncate block">{oldLinks.linkedin || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">GitHub:</span><span className="font-medium truncate block">{oldLinks.github || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">Portfolio:</span><span className="font-medium truncate block">{oldLinks.portfolio || '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: New Data */}
                    <div className="flex flex-col h-full rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10 overflow-hidden shadow-xs">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">What They Changed</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" /> Academic Records
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{academicFieldRows.map((r) => r.rightNode)}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <User className="h-3.5 w-3.5 text-emerald-600" /> Personal & Contact
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{personalFieldRows.map((r) => r.rightNode)}</div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                              <Code className="h-3.5 w-3.5 text-emerald-600" /> Technical Skills
                            </div>
                            {skillsDiff && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">Modified</Badge>}
                          </div>
                          <div className={`p-3 rounded-lg border space-y-2 text-xs ${skillsDiff ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>
                            <div><span className="text-[11px] text-zinc-500 block">Languages:</span><span className="font-bold">{newSkills.languages || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">Frameworks:</span><span className="font-bold">{newSkills.frameworks || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">Tools:</span><span className="font-bold">{newSkills.tools || '—'}</span></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                              <Link2 className="h-3.5 w-3.5 text-emerald-600" /> Portfolio & Profile Links
                            </div>
                            {linksDiff && <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">Modified</Badge>}
                          </div>
                          <div className={`p-3 rounded-lg border space-y-2 text-xs ${linksDiff ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-zinc-900 border-zinc-200'}`}>
                            <div><span className="text-[11px] text-zinc-500 block">LinkedIn:</span><span className="font-bold truncate block">{newLinks.linkedin || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">GitHub:</span><span className="font-bold truncate block">{newLinks.github || '—'}</span></div>
                            <div><span className="text-[11px] text-zinc-500 block">Portfolio:</span><span className="font-bold truncate block">{newLinks.portfolio || '—'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions Spacer */}
                  <div className="pt-3 mt-auto border-t flex items-center justify-end">
                    <Button variant="outline" size="sm" onClick={() => setViewingLog(null)} className="h-8 text-xs">Close</Button>
                  </div>
                </div>
              )
            }
          })()}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Modal */}
      <Dialog open={!!revokingLog} onOpenChange={(open) => !open && setRevokingLog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Revoke Approval
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this approval? This will change the status back to pending, allowing it to be reviewed again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setRevokingLog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={processingId === revokingLog?.id}>
              {processingId === revokingLog?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Revoke
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
