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
  CheckCircle2,
  XCircle,
  Eye,
  GraduationCap,
  User,
  Phone,
  Mail,
  BookOpen,
  Briefcase,
  Code,
  Link2,
  FileText,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
  Layers,
  History,
  Check,
} from 'lucide-react'
import { processApprovalRequest } from './actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export type RequestItem = {
  id: string
  proposed_profile_data: any
  created_at: string
  status: string
  students: {
    id: string
    profile_data: any
    users: { email: string } | { email: string }[]
  }
}

// Academic & personal field label dictionary
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

const ACADEMIC_KEYS = [
  'gpa',
  'type',
  'department',
  'year',
  'academic_10th',
  'academic_12th',
  'diploma_percentage',
  'graduation_percentage',
  'active_backlogs',
  'historical_backlogs',
  'academic_gap_years',
]

const PERSONAL_KEYS = [
  'full_name',
  'first_name',
  'middle_name',
  'last_name',
  'phone',
]

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
      if (JSON.stringify(oldData?.[k] || null) !== JSON.stringify(newData?.[k] || null)) {
        count++
      }
    } else {
      if (normalizeVal(oldData?.[k]) !== normalizeVal(newData?.[k])) {
        count++
      }
    }
  }
  return count
}

export function ApprovalsList({ requests }: { requests: RequestItem[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewingRequest, setViewingRequest] = useState<RequestItem | null>(null)

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    const res = await processApprovalRequest(id, action)
    setProcessingId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
      if (viewingRequest?.id === id) {
        setViewingRequest(null)
      }
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 border rounded-xl dark:bg-zinc-900 border-dashed">
        <CheckCircle2 className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">All Caught Up!</h3>
        <p className="text-xs text-zinc-500 mt-1">There are no pending student profile update requests.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {requests.map((req) => {
        const studentData = Array.isArray(req.students) ? req.students[0] : req.students
        const oldData = studentData?.profile_data || {}
        const newData = req.proposed_profile_data || {}

        const rawUsers = studentData?.users
        const email = Array.isArray(rawUsers) ? rawUsers[0]?.email : rawUsers?.email || '—'

        const studentName =
          newData.full_name ||
          (newData.first_name ? `${newData.first_name} ${newData.last_name || ''}`.trim() : '') ||
          oldData.full_name ||
          'Candidate'

        const initials = studentName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((p: string) => p[0]?.toUpperCase())
          .join('') || studentName[0]?.toUpperCase() || 'S'

        const totalDiffs = countTotalChanges(oldData, newData)

        return (
          <Card
            key={req.id}
            className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-950">
              {/* Left Candidate Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {initials}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {studentName}
                    </h3>
                    <Badge
                      className={`${
                        totalDiffs > 0
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      } text-[10px] font-bold`}
                    >
                      {totalDiffs} {totalDiffs === 1 ? 'Field Modified' : 'Fields Modified'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>{email}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                      <span>Submitted {formatDate(req.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingRequest(req)}
                  className="h-8 text-xs gap-1.5 font-medium border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Changes
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(req.id, 'reject')}
                  disabled={processingId === req.id}
                  className="h-8 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleAction(req.id, 'approve')}
                  disabled={processingId === req.id}
                  className="h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
                >
                  {processingId === req.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          </Card>
        )
      })}

      {/* 16:9 Widescreen Side-by-Side Profile Change Comparator Modal */}
      <Dialog open={!!viewingRequest} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent
          className="!w-[min(95vw,calc(90vh*16/9))] !max-w-[min(95vw,calc(90vh*16/9))] sm:!max-w-[min(95vw,calc(90vh*16/9))] h-[90vh] max-h-[90vh] flex flex-col p-5 md:p-6 overflow-hidden gap-0"
          style={{
            width: 'min(95vw, calc(90vh * 16 / 9))',
            maxWidth: 'min(95vw, calc(90vh * 16 / 9))',
            height: '90vh',
            maxHeight: '90vh',
          }}
        >
          {viewingRequest && (() => {
            const studentData = Array.isArray(viewingRequest.students)
              ? viewingRequest.students[0]
              : viewingRequest.students
            const oldData = studentData?.profile_data || {}
            const newData = viewingRequest.proposed_profile_data || {}

            const rawUsers = studentData?.users
            const email = Array.isArray(rawUsers) ? rawUsers[0]?.email : rawUsers?.email || '—'

            const candidateName =
              newData.full_name ||
              (newData.first_name ? `${newData.first_name} ${newData.last_name || ''}`.trim() : '') ||
              oldData.full_name ||
              'Candidate'

            const totalDiffs = countTotalChanges(oldData, newData)

            // Render single field comparison row
            const renderFieldCompare = (key: string, label: string) => {
              const oldVal = oldData[key]
              const newVal = newData[key]
              const isChanged = normalizeVal(oldVal) !== normalizeVal(newVal)

              return {
                isChanged,
                leftNode: (
                  <div
                    key={`old-${key}`}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      isChanged
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                      <span className="font-medium">{label}</span>
                      {isChanged && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300"
                        >
                          Previous
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`font-semibold ${
                        isChanged
                          ? 'text-zinc-700 dark:text-zinc-300 line-through decoration-zinc-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {oldVal !== undefined && oldVal !== null && String(oldVal).trim() !== '' ? (
                        String(oldVal)
                      ) : (
                        <span className="text-zinc-400 italic font-normal">Not Set</span>
                      )}
                    </div>
                  </div>
                ),
                rightNode: (
                  <div
                    key={`new-${key}`}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      isChanged
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                      <span className="font-medium">{label}</span>
                      {isChanged && (
                        <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold animate-pulse">
                          Modified
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`font-bold ${
                        isChanged
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {newVal !== undefined && newVal !== null && String(newVal).trim() !== '' ? (
                        String(newVal)
                      ) : (
                        <span className="text-zinc-400 italic font-normal">Empty</span>
                      )}
                    </div>
                  </div>
                ),
              }
            }

            // Skills compare helper
            const oldSkills = oldData.skills || {}
            const newSkills = newData.skills || {}
            const skillsDiff = JSON.stringify(oldSkills) !== JSON.stringify(newSkills)

            // Links compare helper
            const oldLinks = oldData.links || {}
            const newLinks = newData.links || {}
            const linksDiff = JSON.stringify(oldLinks) !== JSON.stringify(newLinks)

            // Academic fields nodes
            const academicFieldRows = ACADEMIC_KEYS.map((key) =>
              renderFieldCompare(key, FIELD_LABELS[key] || key)
            )

            // Personal fields nodes
            const personalFieldRows = PERSONAL_KEYS.map((key) =>
              renderFieldCompare(key, FIELD_LABELS[key] || key)
            )

            return (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Modal Header */}
                <DialogHeader className="pb-3 border-b shrink-0 pr-8">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <History className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                          <span>Profile Change Audit</span>
                          <span className="text-zinc-400 font-normal">•</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{candidateName}</span>
                          <Badge
                            className={`${
                              totalDiffs > 0
                                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-zinc-100 text-zinc-600'
                            } text-[10px] font-bold`}
                          >
                            {totalDiffs} {totalDiffs === 1 ? 'Field Modified' : 'Fields Modified'}
                          </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-0.5" suppressHydrationWarning>
                          Candidate: <strong className="text-zinc-700 dark:text-zinc-300">{candidateName}</strong> ({email}) • Submitted {new Date(viewingRequest.created_at).toLocaleString()}
                        </DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* 2-Side Comparison View: Left (Earlier) vs Right (Changed) */}
                <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 py-4 overflow-hidden">
                  {/* LEFT COLUMN: Earlier (Current Live Profile) */}
                  <div className="flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950 overflow-hidden shadow-xs">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border-b flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          Earlier (Current Live Profile)
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Baseline Version
                      </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                      {/* 1. Academic Credentials */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                          Academic Records
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {academicFieldRows.map((r) => r.leftNode)}
                        </div>
                      </div>

                      {/* 2. Personal & Contact */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <User className="h-3.5 w-3.5 text-blue-600" />
                          Personal & Contact Information
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {personalFieldRows.map((r) => r.leftNode)}
                        </div>
                      </div>

                      {/* 3. Skills */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <Code className="h-3.5 w-3.5 text-blue-600" />
                          Technical Skills
                        </div>
                        <div className="p-3 rounded-lg border bg-white dark:bg-zinc-900 space-y-2 text-xs">
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Languages:</span>
                            <span className="font-semibold">{oldSkills.languages || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Frameworks:</span>
                            <span className="font-semibold">{oldSkills.frameworks || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Tools:</span>
                            <span className="font-semibold">{oldSkills.tools || '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Links */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <Link2 className="h-3.5 w-3.5 text-blue-600" />
                          Portfolio & Profile Links
                        </div>
                        <div className="p-3 rounded-lg border bg-white dark:bg-zinc-900 space-y-2 text-xs">
                          <div>
                            <span className="text-[11px] text-zinc-500 block">LinkedIn:</span>
                            <span className="font-medium truncate block">{oldLinks.linkedin || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">GitHub:</span>
                            <span className="font-medium truncate block">{oldLinks.github || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Portfolio:</span>
                            <span className="font-medium truncate block">{oldLinks.portfolio || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: What They Changed (Proposed Changes) */}
                  <div className="flex flex-col h-full rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10 overflow-hidden shadow-xs">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                          What They Changed (Proposed Profile)
                        </span>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                        Pending Verification
                      </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                      {/* 1. Academic Credentials */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                          Academic Records
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {academicFieldRows.map((r) => r.rightNode)}
                        </div>
                      </div>

                      {/* 2. Personal & Contact */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                          <User className="h-3.5 w-3.5 text-emerald-600" />
                          Personal & Contact Information
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {personalFieldRows.map((r) => r.rightNode)}
                        </div>
                      </div>

                      {/* 3. Skills */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <Code className="h-3.5 w-3.5 text-emerald-600" />
                            Technical Skills
                          </div>
                          {skillsDiff && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-lg border space-y-2 text-xs ${
                            skillsDiff
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Languages:</span>
                            <span className="font-bold">{newSkills.languages || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Frameworks:</span>
                            <span className="font-bold">{newSkills.frameworks || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Tools:</span>
                            <span className="font-bold">{newSkills.tools || '—'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Links */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                            <Link2 className="h-3.5 w-3.5 text-emerald-600" />
                            Portfolio & Profile Links
                          </div>
                          {linksDiff && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <div
                          className={`p-3 rounded-lg border space-y-2 text-xs ${
                            linksDiff
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <div>
                            <span className="text-[11px] text-zinc-500 block">LinkedIn:</span>
                            <span className="font-bold truncate block">{newLinks.linkedin || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">GitHub:</span>
                            <span className="font-bold truncate block">{newLinks.github || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Portfolio:</span>
                            <span className="font-bold truncate block">{newLinks.portfolio || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer with Direct Actions */}
                <div className="pt-3 mt-auto border-t flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>
                      Approving will immediately update the student's live directory profile and sync across all company placement drives.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingRequest(null)}
                      className="h-8 text-xs"
                    >
                      Close
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(viewingRequest.id, 'reject')}
                      disabled={processingId === viewingRequest.id}
                      className="h-8 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 gap-1.5"
                    >
                      {processingId === viewingRequest.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Reject Changes
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleAction(viewingRequest.id, 'approve')}
                      disabled={processingId === viewingRequest.id}
                      className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                    >
                      {processingId === viewingRequest.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve & Update Profile
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
