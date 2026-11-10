'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, AlertCircle, Plus, FileText, CheckCircle2, ArrowRight, ShieldCheck, Coins } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TactileButton } from '@/components/ui/tactile/TactileButton'
import { createAIResume } from './actions'

interface Props {
  creditBalance: number
  isActive: boolean
  hasProfileData: boolean
}

const AI_RESUME_CREDIT_COST = 30

export function CreateResumeModal({ creditBalance, isActive, hasProfileData }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    employer: '',
    role: '',
    jd: ''
  })

  const wordCount = formData.jd.trim() ? formData.jd.trim().split(/\s+/).filter(w => w.length > 0).length : 0
  const isOverLimit = wordCount > 750

  const handleOpenClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isActive) {
      toast.error('AI Access Inactive', { description: 'Please activate or renew your subscription in Billing to run AI agents.' })
      return
    }
    if (creditBalance < AI_RESUME_CREDIT_COST) {
      toast.error('Insufficient Credits', { description: `You need ${AI_RESUME_CREDIT_COST} credits to generate an AI Resume. Current balance: ${creditBalance}.` })
      return
    }
    setOpen(true)
  }

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.role.trim() || !formData.employer.trim() || !formData.jd.trim()) {
      toast.error('Please complete all required fields.')
      return
    }
    if (isOverLimit) {
      toast.error('Job Description exceeds 750 words. Please trim to focus on key responsibilities.')
      return
    }
    setShowConfirm(true)
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const result = await createAIResume(formData)
      
      if (result.error) {
        toast.error('Failed to create resume', { description: result.error })
        setIsSubmitting(false)
        setShowConfirm(false)
        return
      }

      toast.success('Resume Generated Successfully', {
        description: `Deducted ${AI_RESUME_CREDIT_COST} credits. Opening studio...`
      })
      setOpen(false)
      setShowConfirm(false)
      router.push(`/builder/${result.resumeId}`)
      
    } catch (error: any) {
      toast.error('An unexpected error occurred during synthesis')
      setIsSubmitting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <TactileButton
        onClick={handleOpenClick}
        variant="primary"
        size="sm"
        className="text-xs"
        icon={<Plus className="w-3.5 h-3.5 stroke-[2]" />}
      >
        New AI Resume
      </TactileButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[620px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-6 shadow-2xl">
          {!showConfirm ? (
            <form onSubmit={handlePreSubmit} className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Compile Tailored AI Resume
                  </DialogTitle>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-zinc-900 border border-purple-200 dark:border-zinc-800 text-purple-700 dark:text-purple-400 font-semibold">
                    Cost: 30 Credits
                  </span>
                </div>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Align your profile projects, skills, and metrics to match the recruiter's exact requirements.
                </DialogDescription>
              </DialogHeader>

              {!hasProfileData && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-0.5">Profile Experience Empty</span>
                    You have 0 projects or internships recorded. The AI will synthesize a Fresher profile based on course credentials.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                    Resume Document Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google - SDE 1 (Latex)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                    Target Employer *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Atlassian, Razorpay"
                    value={formData.employer}
                    onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                  Target Role / Designation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backend Software Engineer, Product Analyst"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                    Target Job Description (JD) *
                  </label>
                  <span className={`text-[10px] font-mono ${isOverLimit ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {wordCount} / 750 words
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder="Paste the core requirements, tech stack, and responsibilities from the job listing..."
                  value={formData.jd}
                  onChange={(e) => setFormData({ ...formData, jd: e.target.value })}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-500 transition resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <Coins className="w-3.5 h-3.5 text-zinc-400 stroke-[1.5]" />
                  <span>Deduction: <strong className="text-zinc-900 dark:text-zinc-300 font-mono">30 credits</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <TactileButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </TactileButton>
                  <TactileButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isOverLimit || !formData.jd.trim()}
                    className="text-xs"
                    icon={<ArrowRight className="w-3.5 h-3.5 stroke-[2]" />}
                  >
                    Review & Compile
                  </TactileButton>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
                  Confirm AI Synthesis
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                  Review the token and credit commitment before triggering the LaTeX generator agent.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500">Target Role</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formData.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500">Target Employer</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">{formData.employer}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500">Credit Balance After</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{creditBalance - AI_RESUME_CREDIT_COST} Credits</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Compiler Engine</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">LaTeX ATS Generator</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <TactileButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Back
                </TactileButton>
                <TactileButton
                  variant="primary"
                  size="sm"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                  icon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                >
                  {isSubmitting ? 'Synthesizing...' : 'Start Generation'}
                </TactileButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
