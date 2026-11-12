'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  AlertCircle,
  Plus,
  FileText,
  ArrowRight,
  Coins,
  Building2,
  Briefcase,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createAIResume } from './actions'

export interface CampusJobOption {
  id: string
  title: string
  company_name: string
  description: string | null
}

interface Props {
  creditBalance: number
  isActive: boolean
  hasProfileData: boolean
  activeJobs?: CampusJobOption[]
  initialJobId?: string
  triggerButton?: React.ReactElement
}

const AI_RESUME_CREDIT_COST = 50

export function CreateResumeModal({
  creditBalance,
  isActive,
  hasProfileData,
  activeJobs = [],
  initialJobId,
  triggerButton,
}: Props) {
  const router = useRouter()

  const matchedInitialJob = initialJobId
    ? activeJobs.find((j) => j.id === initialJobId)
    : undefined
  const canPreopen = Boolean(
    matchedInitialJob && isActive && creditBalance >= AI_RESUME_CREDIT_COST
  )

  const [open, setOpen] = useState(canPreopen)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedCampusJobId, setSelectedCampusJobId] = useState<string>(
    matchedInitialJob?.id || ''
  )
  const [titleEditedManually, setTitleEditedManually] = useState(false)

  const [formData, setFormData] = useState(() => ({
    title: matchedInitialJob
      ? `${matchedInitialJob.company_name} - ${matchedInitialJob.title}`
      : '',
    employer: matchedInitialJob?.company_name || '',
    role: matchedInitialJob?.title || '',
    jd: matchedInitialJob?.description || '',
  }))

  const wordCount = formData.jd.trim()
    ? formData.jd
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length
    : 0
  const isOverLimit = wordCount > 750

  const handleOpenClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isActive) {
      toast.error('Subscription required', {
        description: 'Activate your placement access in Credit Balance to generate resumes.',
      })
      return
    }
    if (creditBalance < AI_RESUME_CREDIT_COST) {
      toast.error('Insufficient AI credits', {
        description: `You need ${AI_RESUME_CREDIT_COST} credits to generate a tailored resume. Current balance: ${creditBalance} credits.`,
      })
      return
    }
    setOpen(true)
  }

  const handleCampusJobSelect = (jobId: string) => {
    setSelectedCampusJobId(jobId)
    if (!jobId) {
      return
    }
    const found = activeJobs.find((j) => j.id === jobId)
    if (!found) return

    const autoTitle = `${found.company_name} - ${found.title}`
    setTitleEditedManually(false)
    setFormData({
      employer: found.company_name,
      role: found.title,
      title: autoTitle,
      jd: (found.description || '').trim(),
    })
  }

  const handleEmployerChange = (val: string) => {
    setSelectedCampusJobId('')
    setFormData((prev) => ({
      ...prev,
      employer: val,
      title: titleEditedManually
        ? prev.title
        : val && prev.role
        ? `${val} - ${prev.role}`
        : val || prev.role,
    }))
  }

  const handleRoleChange = (val: string) => {
    setSelectedCampusJobId('')
    setFormData((prev) => ({
      ...prev,
      role: val,
      title: titleEditedManually
        ? prev.title
        : prev.employer && val
        ? `${prev.employer} - ${val}`
        : val || prev.employer,
    }))
  }

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.title.trim() ||
      !formData.role.trim() ||
      !formData.employer.trim() ||
      !formData.jd.trim()
    ) {
      toast.error('Please fill in all required fields')
      return
    }
    if (isOverLimit) {
      toast.error('Job description exceeds 750 words — trim to key requirements')
      return
    }
    setShowConfirm(true)
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)

    try {
      const result = await createAIResume(formData)

      if (!result.success || !result.resumeId) {
        toast.error('Failed to generate resume', { description: result.error })
        setIsSubmitting(false)
        setShowConfirm(false)
        return
      }

      toast.success('Resume workspace created', {
        description: `Deducted ${AI_RESUME_CREDIT_COST} credits. Opening builder...`,
      })
      setOpen(false)
      setShowConfirm(false)
      router.push(`/builder/${result.resumeId}`)
    } catch {
      toast.error('Unexpected error while creating resume')
      setIsSubmitting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      {triggerButton ? (
        <span onClick={handleOpenClick} className="inline-flex cursor-pointer">
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleOpenClick}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white text-[13px] font-medium shadow-[0_1px_2px_rgba(15,118,110,0.2)] transition-colors duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[1.75]" />
          <span>New tailored resume</span>
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) {
            setOpen(nextOpen)
            if (!nextOpen) setShowConfirm(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[620px] bg-white dark:bg-[#191816] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6] p-6 shadow-2xl rounded-2xl">
          {!showConfirm ? (
            <form onSubmit={handlePreSubmit} className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pr-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] flex items-center justify-center border border-[#0F766E]/20 dark:border-[#14B8A6]/25">
                      <FileText className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <DialogTitle className="text-[17px] font-medium tracking-[-0.01em] text-[#1C1917] dark:text-[#EFECE6]">
                      Create tailored resume
                    </DialogTitle>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums px-2.5 py-1 rounded-full bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 text-[#0F766E] dark:text-[#14B8A6] font-medium shrink-0">
                    {AI_RESUME_CREDIT_COST} credits
                  </span>
                </div>
                <DialogDescription className="text-[13px] text-[#57534E] dark:text-[#ACA59A] pt-1 leading-relaxed">
                  Import your DigiProfile experiences and projects, extract target job requirements, and edit section-by-section in the live builder.
                </DialogDescription>
              </DialogHeader>

              {!hasProfileData && (
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="text-[12px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                    <span className="font-medium text-amber-900 dark:text-amber-200 block">
                      DigiProfile has no projects or internships yet
                    </span>
                    Adding your projects and work history in DigiProfile first produces stronger, quantified resume bullets.
                  </div>
                </div>
              )}

              {/* Quick-fill from active campus drives */}
              {activeJobs.length > 0 && (
                <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-1.5">
                  <label
                    htmlFor="campus-job-autofill"
                    className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] block"
                  >
                    Quick-fill from an active campus drive (optional)
                  </label>
                  <select
                    id="campus-job-autofill"
                    value={selectedCampusJobId}
                    onChange={(e) => handleCampusJobSelect(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[13px] text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
                  >
                    <option value="">Enter target role manually...</option>
                    {activeJobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.company_name} — {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                    Target employer <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#78716C] dark:text-[#8A847A] absolute left-3 top-2.5 stroke-[1.5]" />
                    <input
                      type="text"
                      placeholder="e.g. Razorpay, Google, Microsoft"
                      value={formData.employer}
                      onChange={(e) => handleEmployerChange(e.target.value)}
                      required
                      className="w-full h-9 bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-lg pl-9 pr-3 text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                    Target role <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#78716C] dark:text-[#8A847A] absolute left-3 top-2.5 stroke-[1.5]" />
                    <input
                      type="text"
                      placeholder="e.g. SDE-1, Full-Stack Engineer"
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      required
                      className="w-full h-9 bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-lg pl-9 pr-3 text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                  Document title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Razorpay - Backend Engineer"
                  value={formData.title}
                  onChange={(e) => {
                    setTitleEditedManually(true)
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }}
                  required
                  className="w-full h-9 bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-lg px-3 text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Target job description <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      isOverLimit
                        ? 'text-rose-600 dark:text-rose-400 font-medium'
                        : wordCount >= 80
                        ? 'text-[#0F766E] dark:text-[#14B8A6] font-medium'
                        : 'text-[#78716C] dark:text-[#8A847A]'
                    }`}
                  >
                    {wordCount} / 750 words
                    {wordCount >= 80 && wordCount <= 600 ? ' (optimal)' : ''}
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Paste the technical requirements, responsibilities, and preferred skills from the job posting..."
                  value={formData.jd}
                  onChange={(e) => {
                    setSelectedCampusJobId('')
                    setFormData((prev) => ({ ...prev, jd: e.target.value }))
                  }}
                  required
                  className="w-full bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] rounded-lg p-3 text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                  <Coins className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
                  <span>
                    Cost:{' '}
                    <span className="text-[#1C1917] dark:text-[#EFECE6] font-mono tabular-nums font-medium">
                      {AI_RESUME_CREDIT_COST} credits
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="h-9 px-4 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] transition-colors duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isOverLimit || !formData.jd.trim()}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Review & create</span>
                    <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-[17px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
                  <span>Confirm resume generation</span>
                </DialogTitle>
                <DialogDescription className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                  Review the target details before creating your tailored resume workspace.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 bg-[#FAF8F5] dark:bg-[#12110F] rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06] text-[13px]">
                <div className="flex justify-between py-2 first:pt-0">
                  <span className="text-[#57534E] dark:text-[#ACA59A]">Target role</span>
                  <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    {formData.role}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#57534E] dark:text-[#ACA59A]">Target employer</span>
                  <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    {formData.employer}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#57534E] dark:text-[#ACA59A]">Document title</span>
                  <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] truncate max-w-[260px]">
                    {formData.title}
                  </span>
                </div>
                <div className="flex justify-between py-2 last:pb-0">
                  <span className="text-[#57534E] dark:text-[#ACA59A]">
                    Remaining credit balance
                  </span>
                  <span className="font-mono tabular-nums text-[#0F766E] dark:text-[#14B8A6] font-medium">
                    {creditBalance - AI_RESUME_CREDIT_COST} credits
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white text-[13px] font-medium transition-colors duration-150 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 stroke-[1.5] animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 stroke-[1.5]" />
                  )}
                  <span>{isSubmitting ? 'Creating workspace...' : 'Create & open builder'}</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
