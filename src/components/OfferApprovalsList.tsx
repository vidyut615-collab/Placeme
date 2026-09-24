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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { approveStudentOffer, rejectStudentOffer } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Award,
  Loader2,
  Eye,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Download,
  IndianRupee,
} from 'lucide-react'

export interface StudentOfferItem {
  id: string
  company_name: string
  job_role: string
  compensation_ctc: number
  offer_type: string
  offer_letter_url: string | null
  status: string
  student_confirmed_at: string
  job_id: string | null
  jobs?: {
    id: string
    title: string
    company_name: string
    compensation_ctc?: number
    workplace_mode?: string
    job_location?: string
    employment_type?: string
  } | null
  students: {
    id: string
    profile_data: any
    users?: { email: string } | { email: string }[] | null
    email?: string
  } | null | any
}

export function getStudentDetails(offer: StudentOfferItem) {
  const student = Array.isArray(offer.students) ? offer.students[0] : offer.students
  const profile = student?.profile_data || {}
  const personal = profile.personal || {}
  const academic = profile.academic || {}

  // Email
  const rawUsers = student?.users
  const userEmail = Array.isArray(rawUsers) ? rawUsers[0]?.email : rawUsers?.email
  const email = userEmail || student?.email || profile.email || personal.email || ''

  // Full Name
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
    studentName = prefix
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase())
  }
  if (!studentName) {
    studentName = 'Student'
  }

  // Roll Number / USN (never fallback to '—' or hyphen)
  const rawRoll =
    profile.roll_number ||
    profile.roll_no ||
    profile.usn ||
    profile.reg_no ||
    personal.roll_number ||
    academic.roll_no
  const rollNo = rawRoll && rawRoll !== '—' && rawRoll !== '-' ? String(rawRoll).trim() : null

  // Department
  const rawDept = profile.department || academic.department || profile.dept
  const department = rawDept && rawDept !== '—' ? String(rawDept).trim() : null

  // Degree / Type
  const rawDegree = profile.type || academic.degree || profile.degree
  const degree = rawDegree && rawDegree !== '—' ? String(rawDegree).trim() : null

  // Passing Year / Batch
  const rawYear = profile.year || academic.passing_year || profile.batch
  const year = rawYear && rawYear !== '—' ? String(rawYear).trim() : null

  // GPA / CGPA
  const rawGpa = profile.gpa || academic.gpa || profile.cgpa
  const gpa = rawGpa && rawGpa !== '—' ? String(rawGpa).trim() : null

  // Phone
  const rawPhone = profile.phone || personal.phone
  const phone = rawPhone && rawPhone !== '—' ? String(rawPhone).trim() : null

  // Initials
  const words = studentName.trim().split(/\s+/)
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : studentName.slice(0, 2).toUpperCase()

  return {
    studentName,
    rollNo,
    email,
    department,
    degree,
    year,
    gpa,
    phone,
    initials,
  }
}

export function OfferApprovalsList({
  offers,
  dreamThreshold = 8,
  superDreamThreshold = 15,
}: {
  offers: StudentOfferItem[]
  dreamThreshold?: number
  superDreamThreshold?: number
}) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewingOffer, setViewingOffer] = useState<StudentOfferItem | null>(null)

  // Rejection modal state
  const [rejectingOffer, setRejectingOffer] = useState<StudentOfferItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async (offer: StudentOfferItem) => {
    setProcessingId(offer.id)
    const res = await approveStudentOffer(offer.id)
    setProcessingId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Offer approved successfully! Student is now placed.')
      if (viewingOffer?.id === offer.id) {
        setViewingOffer(null)
      }
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectingOffer) return
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejecting the offer.')
      return
    }

    setProcessingId(rejectingOffer.id)
    const res = await rejectStudentOffer({
      offerId: rejectingOffer.id,
      reason: rejectionReason.trim(),
    })
    setProcessingId(null)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Offer declaration rejected.')
      if (viewingOffer?.id === rejectingOffer.id) {
        setViewingOffer(null)
      }
      setRejectingOffer(null)
      setRejectionReason('')
    }
  }

  const handleOpenInNewTab = (dataUrl: string) => {
    if (dataUrl.startsWith('data:')) {
      const win = window.open()
      if (win) {
        if (dataUrl.startsWith('data:application/pdf')) {
          win.document.write(
            `<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          )
        } else {
          win.document.write(
            `<body style="margin:0; background:#09090b; display:flex; align-items:center; justify-content:center; min-height:100vh;"><img src="${dataUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;" /></body>`
          )
        }
        win.document.title = `Offer Letter - ${viewingOffer?.company_name || 'Document'}`
      }
    } else {
      window.open(dataUrl, '_blank')
    }
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 border rounded-xl dark:bg-zinc-900 border-dashed">
        <Award className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No Pending Offer Approvals</h3>
        <p className="text-xs text-zinc-500 mt-1">All student placement declarations have been verified.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {offers.map((offer) => {
        const details = getStudentDetails(offer)
        const isSuperDream = offer.compensation_ctc >= superDreamThreshold
        const isDream = !isSuperDream && offer.compensation_ctc >= dreamThreshold

        return (
          <Card
            key={offer.id}
            className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-950">
              {/* Left Side: Avatar + Compact Candidate & Placement Details */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Avatar Initials */}
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {details.initials}
                </div>

                <div className="space-y-1.5 min-w-0 flex-1">
                  {/* Row 1: Candidate Name + Roll Number + Dept + Channel + Tier */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {details.studentName}
                    </h3>

                    {details.rollNo && (
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px] px-1.5 py-0 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700"
                      >
                        {details.rollNo}
                      </Badge>
                    )}

                    {details.department && (
                      <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0">
                        {details.department}
                      </Badge>
                    )}

                    {(details.degree || details.year) && (
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {[details.degree, details.year].filter(Boolean).join(' • ')}
                      </span>
                    )}

                    {offer.offer_type === 'on_campus' ? (
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] dark:bg-blue-950/40 dark:text-blue-300 font-medium">
                        On-Campus
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] dark:bg-purple-950/40 dark:text-purple-300 font-medium">
                        Off-Campus
                      </Badge>
                    )}

                    {isSuperDream && (
                      <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold dark:bg-purple-950 dark:text-purple-300">
                        ⭐ Super Dream
                      </Badge>
                    )}
                    {isDream && (
                      <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold dark:bg-amber-950 dark:text-amber-300">
                        🌟 Dream
                      </Badge>
                    )}
                  </div>

                  {/* Row 2: Company + Role + CTC Pill + Email + Linked Drive */}
                  <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{offer.company_name}</span>
                      <span className="text-zinc-300 dark:text-zinc-600">•</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{offer.job_role}</span>
                    </div>

                    <div className="inline-flex items-center gap-0.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded text-xs">
                      <IndianRupee className="h-3 w-3" />
                      <span>{offer.compensation_ctc} LPA</span>
                    </div>

                    {details.email && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span>{details.email}</span>
                      </div>
                    )}

                    {offer.jobs?.title && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400">
                        Drive: {offer.jobs.title}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Security & Verification Audit Stamp */}
                  <div
                    className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5"
                    suppressHydrationWarning
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>
                      Confirmed by candidate on {formatDate(offer.student_confirmed_at)} with password authorization
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                {offer.offer_letter_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingOffer(offer)}
                    className="h-8 text-xs gap-1.5 font-medium border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Offer
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectingOffer(offer)
                    setRejectionReason('')
                  }}
                  disabled={processingId === offer.id}
                  className="h-8 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleApprove(offer)}
                  disabled={processingId === offer.id}
                  className="h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
                >
                  {processingId === offer.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Approve Offer
                </Button>
              </div>
            </div>
          </Card>
        )
      })}

      {/* Offer Letter Viewer Dialog - 16:9 Large Format */}
      <Dialog open={!!viewingOffer} onOpenChange={(open) => !open && setViewingOffer(null)}>
        <DialogContent
          className="!w-[min(95vw,calc(90vh*16/9))] !max-w-[min(95vw,calc(90vh*16/9))] sm:!max-w-[min(95vw,calc(90vh*16/9))] h-[90vh] max-h-[90vh] flex flex-col p-5 md:p-6 overflow-hidden gap-0"
          style={{
            width: 'min(95vw, calc(90vh * 16 / 9))',
            maxWidth: 'min(95vw, calc(90vh * 16 / 9))',
            height: '90vh',
            maxHeight: '90vh',
          }}
        >
          {viewingOffer && (() => {
            const viewingDetails = getStudentDetails(viewingOffer)
            const isOfferSuperDream = viewingOffer.compensation_ctc >= superDreamThreshold
            const isOfferDream = !isOfferSuperDream && viewingOffer.compensation_ctc >= dreamThreshold
            const isPdf =
              viewingOffer.offer_letter_url?.startsWith('data:application/pdf') ||
              viewingOffer.offer_letter_url?.toLowerCase().includes('.pdf')

            return (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <DialogHeader className="pb-3 border-b shrink-0 pr-8">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                          <span>Placement Offer Verification</span>
                          <span className="text-zinc-400 font-normal">•</span>
                          <span className="text-zinc-800 dark:text-zinc-200">{viewingOffer.company_name}</span>
                          {viewingOffer.offer_type === 'on_campus' ? (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] dark:bg-blue-950/40 dark:text-blue-300">
                              On-Campus
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] dark:bg-purple-950/40 dark:text-purple-300">
                              Off-Campus
                            </Badge>
                          )}
                          {isOfferSuperDream && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">
                              ⭐ Super Dream
                            </Badge>
                          )}
                          {isOfferDream && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                              🌟 Dream
                            </Badge>
                          )}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                          Candidate: <strong className="text-zinc-700 dark:text-zinc-300">{viewingDetails.studentName}</strong>
                          {viewingDetails.rollNo ? ` (${viewingDetails.rollNo})` : ''} • Designated Role:{' '}
                          <strong className="text-zinc-700 dark:text-zinc-300">{viewingOffer.job_role}</strong>
                        </DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* 2-Column Split Body */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 overflow-hidden">
                  {/* Left Column: Employer, Compensation, Candidate, Audit Info */}
                  <div className="lg:col-span-5 flex flex-col h-full overflow-y-auto pr-1 space-y-3.5">
                    {/* 1. Employer & Job Info */}
                    <div className="rounded-lg border bg-zinc-50/70 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" />
                        Employer & Role Details
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Company Name</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{viewingOffer.company_name}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Designation / Role</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{viewingOffer.job_role}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Placement Channel</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {viewingOffer.offer_type === 'on_campus' ? 'On-Campus Drive' : 'Off-Campus Placement'}
                          </span>
                        </div>
                        {viewingOffer.jobs?.workplace_mode && (
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Workplace Mode</span>
                            <span className="font-medium capitalize text-zinc-800 dark:text-zinc-200">
                              {viewingOffer.jobs.workplace_mode}
                            </span>
                          </div>
                        )}
                        {viewingOffer.jobs?.title && (
                          <div className="col-span-2">
                            <span className="text-[11px] text-zinc-500 block">Linked Campus Drive</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {viewingOffer.jobs.title}
                            </span>
                          </div>
                        )}
                        {viewingOffer.jobs?.job_location && (
                          <div className="col-span-2 flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                            <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span>{viewingOffer.jobs.job_location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Compensation & Policy Tier */}
                    <div className="rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                          Compensation Package
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px] font-bold">
                          {isOfferSuperDream ? 'Super Dream Tier' : isOfferDream ? 'Dream Tier' : 'Standard Tier'}
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        <IndianRupee className="h-5 w-5" />
                        <span>{viewingOffer.compensation_ctc}</span>
                        <span className="text-sm font-semibold text-zinc-500 ml-1">LPA</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        Approving this offer marks the student as officially placed and updates college placement policy eligibility.
                      </p>
                    </div>

                    {/* 3. Candidate Institutional Profile */}
                    <div className="rounded-lg border bg-zinc-50/70 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                        Candidate Institutional Profile
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Candidate Name</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{viewingDetails.studentName}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Roll / USN</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-200">
                            {viewingDetails.rollNo || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Department</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {viewingDetails.department || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Degree & Batch</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {[viewingDetails.degree, viewingDetails.year].filter(Boolean).join(' • ') || 'Not specified'}
                          </span>
                        </div>
                        {viewingDetails.gpa && (
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Cumulative GPA</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{viewingDetails.gpa}</span>
                          </div>
                        )}
                        {viewingDetails.phone && (
                          <div>
                            <span className="text-[11px] text-zinc-500 block">Contact Phone</span>
                            <span className="text-zinc-800 dark:text-zinc-200">{viewingDetails.phone}</span>
                          </div>
                        )}
                        {viewingDetails.email && (
                          <div className="col-span-2 flex items-center gap-1 text-zinc-600 dark:text-zinc-400 truncate">
                            <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
                            <span className="truncate">{viewingDetails.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. Declaration Security & Audit Info */}
                    <div className="rounded-lg border bg-zinc-50/70 dark:bg-zinc-900/50 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-zinc-300 text-[11px] uppercase tracking-wider">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Verification Audit Trail
                      </div>
                      <div className="text-[11px] text-zinc-500 space-y-1" suppressHydrationWarning>
                        <div>
                          <strong>Declared At:</strong> {new Date(viewingOffer.student_confirmed_at).toLocaleString()}
                        </div>
                        <div>
                          <strong>Verification Method:</strong> Password signature at student submission
                        </div>
                        <div>
                          <strong>Review Status:</strong> Pending College Placement Cell Review
                        </div>
                      </div>
                    </div>

                    {/* 5. Sticky Action Bar inside Modal */}
                    <div className="pt-2 mt-auto border-t flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(viewingOffer)}
                        disabled={processingId === viewingOffer.id}
                        className="flex-1 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                      >
                        {processingId === viewingOffer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve Offer
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const toReject = viewingOffer
                          setViewingOffer(null)
                          setRejectingOffer(toReject)
                          setRejectionReason('')
                        }}
                        disabled={processingId === viewingOffer.id}
                        className="h-9 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 gap-1.5"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingOffer(null)}
                        className="h-9 text-xs"
                      >
                        Close
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Complete Document Preview */}
                  <div className="lg:col-span-7 flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900/5 dark:bg-zinc-950 overflow-hidden shadow-xs">
                    {/* Document Header Toolbar */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          Offer Letter Document
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {isPdf ? 'PDF Format' : 'Image Format'}
                        </Badge>
                      </div>

                      {viewingOffer.offer_letter_url && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInNewTab(viewingOffer.offer_letter_url!)}
                            className="h-7 text-[11px] gap-1 px-2.5"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Open Full
                          </Button>
                          <a
                            href={viewingOffer.offer_letter_url}
                            download={`Offer_Letter_${viewingOffer.company_name.replace(/\s+/g, '_')}_${viewingDetails.studentName.replace(/\s+/g, '_')}.${isPdf ? 'pdf' : 'png'}`}
                            className="inline-flex items-center justify-center h-7 text-[11px] gap-1 px-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-100 transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Viewer Content */}
                    <div className="flex-1 w-full h-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-2">
                      {viewingOffer.offer_letter_url ? (
                        isPdf ? (
                          <iframe
                            src={viewingOffer.offer_letter_url}
                            className="w-full h-full rounded border-0 bg-white shadow-xs"
                            title="Candidate Offer Letter PDF"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={viewingOffer.offer_letter_url}
                              alt={`Offer Letter from ${viewingOffer.company_name}`}
                              className="max-h-full max-w-full object-contain rounded-md shadow-md border bg-white"
                            />
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-400">
                          <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-2" />
                          <p className="text-sm font-medium">No Offer Document Uploaded</p>
                          <p className="text-xs text-zinc-500">
                            The student declared this offer without attaching an offer letter file.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Reject Offer Dialog */}
      <Dialog open={!!rejectingOffer} onOpenChange={(open) => !open && setRejectingOffer(null)}>
        <DialogContent className="sm:max-w-[480px] p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Reject Placement Offer Declaration
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              State the reason for rejecting {rejectingOffer?.company_name} offer ({rejectingOffer?.job_role}). The candidate will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="reject-reason" className="text-xs font-semibold">
              Reason for Rejection *
            </Label>
            <Input
              id="reject-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete offer letter copy, unverified CTC package..."
              className="text-xs"
            />
          </div>

          <div className="flex justify-end pt-3 border-t gap-2">
            <Button size="sm" variant="outline" onClick={() => setRejectingOffer(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={processingId === rejectingOffer?.id}
            >
              {processingId === rejectingOffer?.id && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
