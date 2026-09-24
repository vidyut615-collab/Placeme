'use client'

import { useState } from 'react'
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
import { Award, Upload, CheckCircle2, ShieldCheck, Loader2, AlertCircle, FileText, Clock } from 'lucide-react'

export interface JobApplicationSummary {
  id: string
  job_id: string
  jobs?: any
}

interface DeclareHiredModalProps {
  appliedJobs?: any[]
  triggerButton?: React.ReactElement
  triggerClassName?: string
  hasPendingOffer?: boolean
  pendingOfferDetails?: {
    company_name: string
    job_role: string
    created_at?: string
  } | null
  approvedOfferDetails?: {
    company_name: string
    job_role: string
    compensation_ctc: number
  } | null
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

  // File Upload
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // Consents
  const [consentAuthentic, setConsentAuthentic] = useState(false)
  const [consentPolicyLock, setConsentPolicyLock] = useState(false)

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId)
    const match = appliedJobs.find((a: any) => a.job_id === jobId)
    const jobInfo = Array.isArray(match?.jobs) ? match.jobs[0] : match?.jobs
    if (jobInfo) {
      if (jobInfo.company_name) setCompanyName(jobInfo.company_name)
      if (jobInfo.title) setJobRole(jobInfo.title)
      if (jobInfo.compensation_ctc) setCompensationCtc(jobInfo.compensation_ctc.toString())
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // 500KB size limit (500 * 1024 bytes)
    const maxSize = 500 * 1024
    if (file.size > maxSize) {
      setFileError('File size exceeds the 500KB limit. Please upload a smaller PDF or image (max 500KB).')
      setFileName(null)
      setFileBase64(null)
      return
    }

    // Allowed file types: PDF, PNG, JPG, JPEG
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setFileError('Invalid file type. Please upload a PDF or image (PNG, JPG).')
      setFileName(null)
      setFileBase64(null)
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setFileBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasPendingOffer) {
      toast.error('You already have an offer declaration pending verification by the college.')
      return
    }

    if (!companyName.trim() || !jobRole.trim() || !compensationCtc) {
      toast.error('Please fill in Company Name, Job Role, and Total CTC.')
      return
    }

    const ctcNumber = parseFloat(compensationCtc)
    if (isNaN(ctcNumber) || ctcNumber <= 0) {
      toast.error('Please enter a valid CTC in LPA.')
      return
    }

    if (!fileBase64) {
      toast.error('Please upload your Offer Letter document (PDF or Image, max 500KB).')
      return
    }

    if (!consentAuthentic || !consentPolicyLock) {
      toast.error('You must confirm both declaration agreements.')
      return
    }

    if (!password) {
      toast.error('Please enter your account password to confirm this declaration.')
      return
    }

    setIsSubmitting(true)

    const res = await declareStudentOffer({
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      compensationCtc: ctcNumber,
      offerType,
      jobId: offerType === 'on_campus' && selectedJobId ? selectedJobId : null,
      offerLetterBase64: fileBase64,
      password,
    })

    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Offer declared successfully!')
      setOpen(false)
      // Reset form
      setCompanyName('')
      setJobRole('')
      setCompensationCtc('')
      setPassword('')
      setFileName(null)
      setFileBase64(null)
      setConsentAuthentic(false)
      setConsentPolicyLock(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        ((triggerButton ? (
          triggerButton
        ) : (
          <Button 
            className={`gap-2 ${hasPendingOffer ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white ${triggerClassName || ''}`}
          >
            {hasPendingOffer ? <Clock className="h-4 w-4" /> : <Award className="h-4 w-4" />}
            {hasPendingOffer ? 'Offer Verification Pending' : 'Declare Placement / Got Placed'}
          </Button>
        )) as React.ReactElement)
      } />

      <DialogContent className="sm:max-w-[620px] max-h-[92vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-xl flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            {hasPendingOffer ? (
              <Clock className="h-5 w-5 text-amber-600" />
            ) : (
              <Award className="h-5 w-5 text-emerald-600" />
            )}
            {hasPendingOffer ? 'Offer Declaration Under Review' : 'Declare Placement Offer'}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {hasPendingOffer 
              ? 'Your declaration has been submitted and is awaiting official verification from the college placement cell.'
              : 'Formally report your campus or off-campus job offer. Once verified by the college, your placement status will be officially registered.'}
          </DialogDescription>
        </DialogHeader>

        {hasPendingOffer && (
          <div className="mt-3 p-3.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3">
            <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Offer Declaration Pending Verification:</span>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                You currently have an active placement declaration for <strong>{pendingOfferDetails?.company_name || 'your employer'}</strong> ({pendingOfferDetails?.job_role || 'Job Role'}) awaiting verification by the college.
              </p>
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                To prevent duplicate records and concurrent actions, new submissions are locked until the college placement cell confirms or returns your pending offer.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
          <fieldset disabled={hasPendingOffer || isSubmitting} className="space-y-5">
          {/* Placement Type (On-Campus vs Off-Campus) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Placement Channel *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOfferType('on_campus')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  offerType === 'on_campus'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="text-xs font-bold">On-Campus Drive</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Hired through college placement portal</div>
              </button>

              <button
                type="button"
                onClick={() => setOfferType('off_campus')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  offerType === 'off_campus'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="text-xs font-bold">Off-Campus Placement</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Direct company application, referral, or contest</div>
              </button>
            </div>
          </div>

          {/* If On-Campus: Select Applied Job */}
          {offerType === 'on_campus' && appliedJobs.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="job-select" className="text-xs font-semibold">Select Campus Drive (Optional)</Label>
              <Select value={selectedJobId} onValueChange={(val) => handleJobSelect(val || '')}>
                <SelectTrigger id="job-select" className="h-9 text-xs">
                  <SelectValue placeholder="Select from your applied jobs" />
                </SelectTrigger>
                <SelectContent>
                  {appliedJobs.map((app: any) => {
                    const jobInfo = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs
                    return (
                      <SelectItem key={app.id} value={app.job_id} className="text-xs">
                        {jobInfo?.company_name ? `${jobInfo.company_name} — ` : ''}{jobInfo?.title || 'Job Drive'}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Company Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="company_name" className="text-xs font-semibold">Company / Employer Name *</Label>
              <Input
                id="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Microsoft, TCS"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job_role" className="text-xs font-semibold">Job Designation / Role *</Label>
              <Input
                id="job_role"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Software Engineer, Analyst"
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Compensation CTC */}
          <div className="space-y-1.5">
            <Label htmlFor="compensation_ctc" className="text-xs font-semibold">
              Total Annual CTC (in ₹ LPA) *
            </Label>
            <Input
              id="compensation_ctc"
              type="number"
              step="0.1"
              value={compensationCtc}
              onChange={(e) => setCompensationCtc(e.target.value)}
              placeholder="e.g. 12.5"
              required
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-zinc-500">
              This CTC will be verified against the college&apos;s Dream / Super Dream policy thresholds for future upgrade eligibility.
            </p>
          </div>

          {/* Offer Letter Document Upload (Max 500KB) */}
          <div className="space-y-1.5">
            <Label htmlFor="offer_letter_upload" className="text-xs font-semibold flex items-center justify-between">
              <span>Offer Letter Copy (PDF or Image, max 500KB) *</span>
              <span className="text-[10px] text-zinc-400">Strictly 500KB limit</span>
            </Label>

            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-zinc-400 transition-colors bg-zinc-50/50 dark:bg-zinc-900/30">
              <input
                id="offer_letter_upload"
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="offer_letter_upload" className="cursor-pointer flex flex-col items-center justify-center space-y-1.5">
                <Upload className="h-6 w-6 text-zinc-400" />
                <div className="text-xs font-medium text-blue-600 hover:underline">
                  {fileName ? fileName : 'Click to upload Offer Letter'}
                </div>
                <p className="text-[11px] text-zinc-500">
                  {fileName ? 'Click to replace document' : 'Supported formats: PDF, PNG, JPG (up to 500KB)'}
                </p>
              </label>
            </div>

            {fileError && (
              <div className="p-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {fileError}
              </div>
            )}
            {fileName && !fileError && (
              <div className="p-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                File attached: <span className="font-semibold">{fileName}</span>
              </div>
            )}
          </div>

          {/* Policy & Governance Agreements */}
          <div className="p-3.5 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              Declaration & Governance Acknowledgment
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAuthentic}
                  onChange={(e) => setConsentAuthentic(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I solemnly confirm that the offer details and uploaded document are 100% authentic and solely issued to me. I acknowledge that falsification of placement credentials constitutes fraud and will result in permanent blacklisting.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentPolicyLock}
                  onChange={(e) => setConsentPolicyLock(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I understand that upon college approval of this offer, I will be registered as <strong>Placed</strong>. Under the college&apos;s 1-Offer Policy, I opt out of general campus placement drives and can only apply to eligible Dream or Super Dream upgrades.
                </span>
              </label>
            </div>
          </div>

          {/* Account Password Confirmation */}
          <div className="space-y-1.5 pt-2 border-t">
            <Label htmlFor="confirm_password" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Account Password (Required for Identity Confirmation) *
            </Label>
            <Input
              id="confirm_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Placeme password to submit"
              required
              className="h-9 text-xs"
            />
            <p className="text-[11px] text-zinc-500">
              Entering your password ensures that only you can authorize this placement declaration.
            </p>
          </div>
          </fieldset>

          <div className="flex justify-end pt-3 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || hasPendingOffer}
              className={`${
                hasPendingOffer 
                  ? 'bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed text-zinc-200' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } gap-1.5`}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {hasPendingOffer ? 'Declaration Pending Review' : 'Submit Offer Declaration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
