'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { declareStudentOffer } from '@/app/(dashboards)/student/actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import {
  Award,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
  Building2,
  Globe,
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  TrendingUp,
  X,
  Briefcase,
  Check,
} from 'lucide-react'

export interface AppliedJobDetails {
  company_name?: string
  title?: string
  compensation_ctc?: number | string | null
}

export interface AppliedJobSummary {
  id: string
  job_id: string
  jobs?: AppliedJobDetails | AppliedJobDetails[] | null
}

export interface PendingOfferDetails {
  company_name: string
  job_role: string
  compensation_ctc?: number | string | null
  created_at?: string
  offer_type?: string | null
  offer_letter_url?: string | null
}

export interface ApprovedOfferDetails {
  company_name: string
  job_role: string
  compensation_ctc: number
}

export interface DeclareHiredModalProps {
  appliedJobs?: AppliedJobSummary[]
  triggerButton?: React.ReactElement
  triggerClassName?: string
  hasPendingOffer?: boolean
  pendingOfferDetails?: PendingOfferDetails | null
  approvedOfferDetails?: ApprovedOfferDetails | null
}

export function DeclareHiredModal({
  appliedJobs = [],
  triggerButton,
  triggerClassName,
  hasPendingOffer = false,
  pendingOfferDetails,
  approvedOfferDetails,
}: DeclareHiredModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields
  const [offerType, setOfferType] = useState<'on_campus' | 'off_campus'>('on_campus')
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [companyName, setCompanyName] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [compensationCtc, setCompensationCtc] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // File Upload State
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSizeKb, setFileSizeKb] = useState<number | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileObj, setFileObj] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compliance Consents
  const [consentAuthentic, setConsentAuthentic] = useState(false)
  const [consentPolicyLock, setConsentPolicyLock] = useState(false)

  // Derive dynamic tier from entered CTC
  const parsedCtc = parseFloat(compensationCtc) || 0
  const currentApprovedCtc = approvedOfferDetails ? Number(approvedOfferDetails.compensation_ctc) : 0
  const isCtcBelowCurrentOffer = currentApprovedCtc > 0 && parsedCtc > 0 && parsedCtc <= currentApprovedCtc

  const getTierClassification = (ctc: number) => {
    if (ctc <= 0) return null
    if (ctc < 6) return { name: 'Core / Standard', color: 'text-[#57534E] dark:text-[#ACA59A] bg-[#FAF8F5] dark:bg-[#12110F] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]' }
    if (ctc < 10) return { name: 'Mass / Corporate', color: 'text-sky-700 dark:text-sky-400 bg-sky-500/[0.08] border-sky-500/20' }
    if (ctc < 20) return { name: 'Dream Tier', color: 'text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.08] border-[#0F766E]/20' }
    return { name: 'Super Dream Tier', color: 'text-amber-700 dark:text-amber-400 bg-amber-500/[0.08] border-amber-500/20' }
  }

  const tierInfo = getTierClassification(parsedCtc)

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId)
    const match = appliedJobs.find((a) => a.job_id === jobId)
    const jobInfo = Array.isArray(match?.jobs) ? match.jobs[0] : match?.jobs
    if (jobInfo) {
      if (jobInfo.company_name) setCompanyName(jobInfo.company_name)
      if (jobInfo.title) setJobRole(jobInfo.title)
      if (jobInfo.compensation_ctc) setCompensationCtc(jobInfo.compensation_ctc.toString())
    }
  }

  const processFile = (file: File) => {
    setFileError(null)

    // 500KB strict size limit
    const maxSize = 500 * 1024
    if (file.size > maxSize) {
      const sizeInKb = (file.size / 1024).toFixed(1)
      setFileError(`File is ${sizeInKb} KB, exceeding the 500 KB limit. Please compress your document.`)
      setFileName(null)
      setFileSizeKb(null)
      setFileBase64(null)
      setFileObj(null)
      return
    }

    // Allowed file types: PDF, PNG, JPG, JPEG
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file format. Please upload a PDF, PNG, or JPG document.')
      setFileName(null)
      setFileSizeKb(null)
      setFileBase64(null)
      setFileObj(null)
      return
    }

    setFileName(file.name)
    setFileSizeKb(Math.round(file.size / 1024))
    setFileObj(file)

    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleRemoveFile = () => {
    setFileName(null)
    setFileSizeKb(null)
    setFileBase64(null)
    setFileObj(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setCompanyName('')
    setJobRole('')
    setCompensationCtc('')
    setPassword('')
    setSelectedJobId('')
    setFileName(null)
    setFileSizeKb(null)
    setFileBase64(null)
    setFileObj(null)
    setFileError(null)
    setConsentAuthentic(false)
    setConsentPolicyLock(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasPendingOffer) {
      toast.error('You already have an offer declaration pending verification by the college.')
      return
    }

    if (!companyName.trim() || !jobRole.trim() || !compensationCtc) {
      toast.error('Please complete Company Name, Job Role, and Total CTC.')
      return
    }

    const ctcNumber = parseFloat(compensationCtc)
    if (isNaN(ctcNumber) || ctcNumber <= 0) {
      toast.error('Please enter a valid CTC in LPA.')
      return
    }

    if (currentApprovedCtc > 0 && ctcNumber <= currentApprovedCtc) {
      toast.error(`Under the 1-Offer Policy, your new offer must be higher than your current holding offer of ₹${currentApprovedCtc} LPA.`)
      return
    }

    if (!fileObj && !fileBase64) {
      toast.error('Please upload your official Offer Letter document (PDF or Image, max 500KB).')
      return
    }

    if (!consentAuthentic || !consentPolicyLock) {
      toast.error('Please acknowledge both declaration and governance agreements.')
      return
    }

    if (!password) {
      toast.error('Please enter your account password to authorize this declaration.')
      return
    }

    setIsSubmitting(true)

    try {
      let finalOfferLetterUrl = fileBase64 || null

      if (fileObj) {
        const supabase = createClient()
        const ext = fileObj.name.split('.').pop()
        const storageFileName = `${Date.now()}_offer_${companyName.trim().replace(/\s+/g, '_')}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`offers/${storageFileName}`, fileObj, {
            cacheControl: '3600',
            upsert: false,
          })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(`offers/${storageFileName}`)
          finalOfferLetterUrl = publicUrlData.publicUrl
        }
      }

      const res = await declareStudentOffer({
        companyName: companyName.trim(),
        jobRole: jobRole.trim(),
        compensationCtc: ctcNumber,
        offerType,
        jobId: offerType === 'on_campus' && selectedJobId ? selectedJobId : null,
        offerLetterUrl: finalOfferLetterUrl,
        password,
      })

      setIsSubmitting(false)

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.success || 'Offer declaration submitted successfully!')
        setOpen(false)
        resetForm()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          ((triggerButton ? (
            triggerButton
          ) : (
            <Button
              size="sm"
              className={`gap-2 h-8.5 px-3.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer select-none ${
                hasPendingOffer
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-[0_1px_2px_rgba(217,119,6,0.25)]'
                  : 'bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] shadow-[0_1px_2px_rgba(15,118,110,0.2)]'
              } ${triggerClassName || ''}`}
            >
              {hasPendingOffer ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200" />
                  </span>
                  <Clock className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Offer Verification Pending</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Declare Placement</span>
                </>
              )}
            </Button>
          )) as React.ReactElement)
        }
      />

      <DialogContent className="sm:max-w-[640px] max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-2xl shadow-[0_12px_40px_rgba(28,25,23,0.12)]">
        {/* ── View A: Active Pending Review Mode ── */}
        {hasPendingOffer ? (
          <div className="flex flex-col h-full max-h-[92vh]">
            <DialogHeader className="p-6 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/[0.1] text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Audit in Progress
                </span>
                <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                  Institutional Placement Cell
                </span>
              </div>
              <DialogTitle className="text-xl font-medium tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500 stroke-[1.5]" />
                Placement Declaration Under Review
              </DialogTitle>
              <DialogDescription className="text-xs text-[#78716C] dark:text-[#8A847A] leading-relaxed">
                Your submitted offer details and verification documents are currently being audited by your campus placement office.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Summary Hero Card */}
              <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
                      <span className="text-[17px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        {pendingOfferDetails?.company_name || 'Designated Employer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#57534E] dark:text-[#ACA59A]">
                      <Briefcase className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>{pendingOfferDetails?.job_role || 'Job Designation'}</span>
                    </div>
                  </div>

                  {pendingOfferDetails?.compensation_ctc ? (
                    <div className="text-right shrink-0">
                      <div className="font-mono text-base font-medium tabular-nums text-[#0F766E] dark:text-[#14B8A6] px-2.5 py-1 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                        ₹{Number(pendingOfferDetails.compensation_ctc).toFixed(1)} LPA
                      </div>
                      <span className="text-[10px] text-[#78716C] dark:text-[#8A847A] block mt-0.5">
                        Total CTC
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#191816] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] font-mono text-[11px]">
                    Channel: {pendingOfferDetails?.offer_type === 'off_campus' ? 'Off-Campus Opportunity' : 'On-Campus Drive'}
                  </span>
                  <span className="text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono">
                    Declared on: {formatDate(pendingOfferDetails?.created_at)}
                  </span>
                </div>
              </div>

              {/* 3-Stage Verification Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                  Verification Progress
                </span>

                <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-4 space-y-3">
                  {/* Step 1: Candidate Declaration */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        Offer Declared by Candidate
                      </div>
                      <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                        Credentials and offer letter uploaded with cryptographic verification.
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 h-4 border-l border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1]" />

                  {/* Step 2: Placement Cell Review */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        Placement Committee Verification (Active)
                      </div>
                      <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                        TPO office audits salary breakdown, bond terms, and company validation.
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 h-4 border-l border-dashed border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1]" />

                  {/* Step 3: Official Offer Registration */}
                  <div className="flex items-start gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="w-3.5 h-3.5 stroke-[1.5]" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[#57534E] dark:text-[#ACA59A]">
                        Official Placement Status Registration
                      </div>
                      <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                        Locks standard drives and clears 1.5× upgrade pathway for dream roles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Document Proof Card */}
              {pendingOfferDetails?.offer_letter_url ? (
                <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] p-3.5 bg-[#FAF8F5] dark:bg-[#12110F] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-center shrink-0 text-[#0F766E] dark:text-[#14B8A6]">
                      <FileText className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                        Official Offer Letter Document
                      </div>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 stroke-[2]" /> Attached &amp; Secured
                      </span>
                    </div>
                  </div>

                  <a
                    href={pendingOfferDetails.offer_letter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-[#0F766E] dark:text-[#14B8A6] hover:bg-white dark:hover:bg-[#191816] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 transition-colors shrink-0"
                  >
                    <span>View Document</span>
                    <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                  </a>
                </div>
              ) : null}

              {/* Policy Advisory Card */}
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] dark:bg-amber-500/10 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[1.5]" />
                  <span>Institutional Policy Lock Active</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  To prevent duplicate applications and concurrent status conflicts, new declaration submissions are locked while this offer is under audit. If you need to rectify compensation figures or retract this submission, contact your TPO coordinator.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex justify-end bg-[#FAF8F5]/50 dark:bg-[#12110F]/50">
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-medium h-9 px-4 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] shadow-[0_1px_2px_rgba(15,118,110,0.2)] cursor-pointer"
              >
                Close Status Window
              </Button>
            </div>
          </div>
        ) : (
          /* ── View B: Fresh Declaration / Offer Upgrade Form ── */
          <div className="flex flex-col h-full max-h-[92vh]">
            <DialogHeader className="p-6 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20">
                  <Award className="w-3.5 h-3.5 stroke-[1.5]" />
                  Formal Placement Declaration
                </span>
                <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                  Institutional Verification System
                </span>
              </div>
              <DialogTitle className="text-xl font-medium tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
                Declare Placement Offer
              </DialogTitle>
              <DialogDescription className="text-xs text-[#78716C] dark:text-[#8A847A] leading-relaxed">
                Formally report your campus or off-campus job offer. Verified offers update your academic record and unlock eligible upgrades.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Upgrade Multiplier Advisory Banner (if candidate already holds an approved offer) */}
              {approvedOfferDetails && (
                <div className="rounded-xl border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-gradient-to-br from-[#0F766E]/[0.06] via-transparent to-white dark:to-[#191816] p-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      <TrendingUp className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
                      <span>Existing Offer on Record: <strong>{approvedOfferDetails.company_name}</strong></span>
                    </div>
                    <span className="font-mono text-xs tabular-nums font-medium px-2 py-0.5 rounded-md bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20">
                      ₹{approvedOfferDetails.compensation_ctc.toFixed(1)} LPA
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                    Under the college 1-Offer Multiplier Policy, new declarations must be qualifying upgrade roles (recommended minimum floor: <strong>₹{(approvedOfferDetails.compensation_ctc * 1.5).toFixed(1)} LPA</strong> at 1.5×).
                  </p>
                </div>
              )}

              {/* 1. Placement Channel Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                  <span>1. Placement Channel *</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOfferType('on_campus')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                      offerType === 'on_campus'
                        ? 'border-[#0F766E] dark:border-[#14B8A6] bg-[#0F766E]/[0.05] dark:bg-[#14B8A6]/[0.08] shadow-[0_1px_2px_rgba(15,118,110,0.1)]'
                        : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] hover:border-[#1C1917]/[0.18]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 stroke-[1.5] ${offerType === 'on_campus' ? 'text-[#0F766E] dark:text-[#14B8A6]' : 'text-[#78716C] dark:text-[#8A847A]'}`} />
                      <span className={`text-xs font-medium ${offerType === 'on_campus' ? 'text-[#0F766E] dark:text-[#14B8A6]' : 'text-[#1C1917] dark:text-[#EFECE6]'}`}>
                        On-Campus Drive
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-1">
                      Hired through an official campus placement drive
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOfferType('off_campus')
                      setSelectedJobId('')
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none ${
                      offerType === 'off_campus'
                        ? 'border-[#0F766E] dark:border-[#14B8A6] bg-[#0F766E]/[0.05] dark:bg-[#14B8A6]/[0.08] shadow-[0_1px_2px_rgba(15,118,110,0.1)]'
                        : 'border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] hover:border-[#1C1917]/[0.18]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className={`w-4 h-4 stroke-[1.5] ${offerType === 'off_campus' ? 'text-[#0F766E] dark:text-[#14B8A6]' : 'text-[#78716C] dark:text-[#8A847A]'}`} />
                      <span className={`text-xs font-medium ${offerType === 'off_campus' ? 'text-[#0F766E] dark:text-[#14B8A6]' : 'text-[#1C1917] dark:text-[#EFECE6]'}`}>
                        Off-Campus Opportunity
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-1">
                      Direct application, competitive hackathon, or referral
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Campus Drive Selector (Only if On-Campus is selected) */}
              {offerType === 'on_campus' && appliedJobs.length > 0 && (
                <div className="space-y-1.5 p-3.5 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F]">
                  <Label htmlFor="job-select" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-between">
                    <span>Link with Campus Drive (Auto-Fills Details)</span>
                    <span className="text-[10px] font-mono text-[#0F766E] dark:text-[#14B8A6]">Optional</span>
                  </Label>
                  <Select value={selectedJobId} onValueChange={(val) => handleJobSelect(val || '')}>
                    <SelectTrigger id="job-select" className="h-9 text-xs bg-white dark:bg-[#191816] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6]">
                      <SelectValue placeholder="Select from your applied jobs to auto-fill" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#191816] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                      {appliedJobs.map((app) => {
                        const jobInfo = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs
                        const ctcText = jobInfo?.compensation_ctc ? ` · ₹${jobInfo.compensation_ctc} LPA` : ''
                        return (
                          <SelectItem key={app.id} value={app.job_id} className="text-xs cursor-pointer">
                            {jobInfo?.company_name || 'Campus Drive'} — {jobInfo?.title || 'Role'}{ctcText}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 3. Company & Role Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company_name" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Company / Employer Name *
                  </Label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-[#78716C] dark:text-[#8A847A] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                    <Input
                      id="company_name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Google, Microsoft, Infosys"
                      required
                      className="pl-9 h-9 text-xs bg-white dark:bg-[#191816] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="job_role" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Job Designation / Role *
                  </Label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-[#78716C] dark:text-[#8A847A] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                    <Input
                      id="job_role"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="e.g. Software Engineer, SDE-1"
                      required
                      className="pl-9 h-9 text-xs bg-white dark:bg-[#191816] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6]"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Compensation CTC with Dynamic Tier Calculation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compensation_ctc" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Total Annual CTC (in LPA) *
                  </Label>
                  {tierInfo && (
                    <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${tierInfo.color}`}>
                      {tierInfo.name}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#78716C] dark:text-[#8A847A]">
                    ₹
                  </span>
                  <Input
                    id="compensation_ctc"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={compensationCtc}
                    onChange={(e) => setCompensationCtc(e.target.value)}
                    placeholder="e.g. 14.5"
                    required
                    className="pl-7 pr-12 h-9 text-xs font-mono bg-white dark:bg-[#191816] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                    LPA
                  </span>
                </div>

                {/* Math Feedback on Upgrade Delta */}
                {currentApprovedCtc > 0 && parsedCtc > 0 && (
                  <div className="pt-1">
                    {isCtcBelowCurrentOffer ? (
                      <div className="p-2 text-xs text-rose-700 dark:text-rose-400 bg-rose-500/[0.08] dark:bg-rose-500/15 rounded-lg border border-rose-500/20 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>CTC must be higher than your current holding offer (₹{currentApprovedCtc.toFixed(1)} LPA).</span>
                      </div>
                    ) : (
                      <div className="p-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08] dark:bg-emerald-500/15 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Valid Upgrade: +₹{(parsedCtc - currentApprovedCtc).toFixed(1)} LPA increase</span>
                        </span>
                        <span className="font-mono text-[11px] font-medium">
                          {(parsedCtc / currentApprovedCtc).toFixed(2)}× Multiplier
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Drag & Drop Document Vault (Strictly ≤ 500 KB) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="offer_letter_upload" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Offer Letter Copy (PDF or Image) *
                  </Label>
                  <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A]">
                    Max 500 KB Limit
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  id="offer_letter_upload"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!fileName ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-[#0F766E] bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/[0.1]'
                        : 'border-[#1C1917]/[0.12] dark:border-[#EFECE6]/[0.12] bg-[#FAF8F5] dark:bg-[#12110F] hover:border-[#0F766E]/40'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-center text-[#0F766E] dark:text-[#14B8A6]">
                        <Upload className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-[#0F766E] dark:text-[#14B8A6] hover:underline block">
                          Click to select document or drag &amp; drop
                        </span>
                        <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                          Accepted: PDF, PNG, JPG (strictly under 500 KB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] dark:bg-emerald-500/10 p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#191816] border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                        <FileText className="w-4 h-4 stroke-[1.5]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] block truncate">
                          {fileName}
                        </span>
                        <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                          {fileSizeKb ? `${fileSizeKb} KB` : 'Verified'} · Under 500 KB threshold
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-[#78716C] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                )}

                {fileError && (
                  <div className="p-2.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-500/[0.08] dark:bg-rose-500/15 rounded-lg border border-rose-500/20 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>

              {/* 6. Cryptographic Governance & Compliance Covenants */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] dark:bg-amber-500/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[1.5]" />
                  <span>Institutional Compliance Agreements</span>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 text-xs text-[#1C1917] dark:text-[#EFECE6] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentAuthentic}
                      onChange={(e) => setConsentAuthentic(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#1C1917]/[0.2] text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                    />
                    <span className="leading-relaxed">
                      <strong>Authenticity Guarantee:</strong> I solemnly confirm that the offer credentials and attached document are authentic and issued to me. Falsification constitutes academic fraud resulting in permanent debarment.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-[#1C1917] dark:text-[#EFECE6] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consentPolicyLock}
                      onChange={(e) => setConsentPolicyLock(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#1C1917]/[0.2] text-[#0F766E] focus:ring-[#0F766E] cursor-pointer"
                    />
                    <span className="leading-relaxed">
                      <strong>1-Offer Policy &amp; Status Lock:</strong> Upon college verification, my status updates to Placed. Regular campus drives close, and only authorized Dream/Super Dream upgrades remain available.
                    </span>
                  </label>
                </div>
              </div>

              {/* 7. Account Password Confirmation */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="confirm_password" className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-between">
                  <span>Placeme Account Password *</span>
                  <span className="text-[10px] font-mono text-[#78716C] dark:text-[#8A847A]">Identity Verification</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your Placeme password to sign declaration"
                    required
                    className="pr-10 h-9 text-xs bg-white dark:bg-[#191816] border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6] p-1 rounded cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5 stroke-[1.5]" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                  Cryptographic verification prevents accidental or unauthorized submissions.
                </p>
              </div>
            </form>

            <div className="p-4 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-end gap-2 bg-[#FAF8F5]/50 dark:bg-[#12110F]/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                disabled={isSubmitting}
                className="text-xs cursor-pointer bg-white dark:bg-[#191816] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                size="sm"
                disabled={
                  isSubmitting ||
                  !companyName.trim() ||
                  !jobRole.trim() ||
                  !compensationCtc ||
                  isCtcBelowCurrentOffer ||
                  (!fileObj && !fileBase64) ||
                  !consentAuthentic ||
                  !consentPolicyLock ||
                  !password
                }
                className="bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] gap-1.5 text-xs font-medium shadow-[0_1px_2px_rgba(15,118,110,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting Declaration...</span>
                  </>
                ) : (
                  <>
                    <Award className="h-3.5 w-3.5 stroke-[1.5]" />
                    <span>Submit Offer Declaration</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
