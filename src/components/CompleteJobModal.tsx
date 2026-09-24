'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { checkJobCompletionReadiness, completeJob } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { CheckCircle2, AlertTriangle, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react'
import { ScreenLoader } from '@/components/ScreenLoader'

interface CompleteJobModalProps {
  jobId: string
  jobTitle: string
}

export function CompleteJobModal({ jobId, jobTitle }: CompleteJobModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'audit' | 'confirm'>('audit')
  const [bulkDropConfirmed, setBulkDropConfirmed] = useState(false)
  const [massReason, setMassReason] = useState('Not Selected (Drive Concluded)')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [readinessData, setReadinessData] = useState<{
    totalApplicants: number
    hiredCount: number
    closedCount: number
    inProgressCount: number
    inProgressApplicants: { id: string; name: string; email: string; rollNumber: string; status: string }[]
  } | null>(null)

  const isBusy = isSubmitting || isPending

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setStep('audit')
      setIsLoading(true)
      const res = await checkJobCompletionReadiness(jobId)
      setIsLoading(false)
      if (res.error) {
        toast.error(res.error)
        setOpen(false)
      } else {
        setReadinessData({
          totalApplicants: res.totalApplicants || 0,
          hiredCount: res.hiredCount || 0,
          closedCount: res.closedCount || 0,
          inProgressCount: res.inProgressCount || 0,
          inProgressApplicants: res.inProgressApplicants || [],
        })
      }
    } else {
      setReadinessData(null)
      setStep('audit')
    }
  }

  // Step 1 -> Move to Confirmation View inside the same Dialog
  const handleInitiateComplete = (bulkDrop: boolean) => {
    setBulkDropConfirmed(bulkDrop)
    setStep('confirm')
  }

  // Step 2 -> Execute completion with screen loader
  const handleConfirmedComplete = () => {
    setIsSubmitting(true)
    startTransition(async () => {
      try {
        const res = await completeJob({ 
          jobId, 
          bulkDropRemaining: bulkDropConfirmed,
          massDropReason: bulkDropConfirmed ? massReason : undefined 
        })
        if (res.error) {
          toast.error(res.error)
          setIsSubmitting(false)
        } else {
          toast.success(res.success || 'Drive completed successfully!')
          setOpen(false)
          router.refresh()
          setIsSubmitting(false)
        }
      } catch {
        toast.error('Failed to complete drive.')
        setIsSubmitting(false)
      }
    })
  }

  return (
    <>
      <ScreenLoader
        show={isBusy}
        title="Completing Recruitment Drive..."
        message="Finalizing candidate decisions, updating student quotas, and archiving drive..."
        variant="emerald"
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Mark Complete
          </Button>
        } />

        <DialogContent className="sm:max-w-[560px] p-6">
          {step === 'confirm' ? (
            /* STEP 2: CONFIRMATION VIEW (Guaranteed smooth single-dialog flow) */
            <div className="space-y-4 animate-in fade-in-0 zoom-in-95 duration-150">
              <DialogHeader className="pb-3 border-b">
                <DialogTitle className="text-base flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  Confirm Drive Completion
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Please confirm before concluding the recruitment drive for <strong>{jobTitle}</strong>.
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 space-y-3">
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Are you sure you want to mark <strong>{jobTitle}</strong> as <strong>Completed</strong>?
                </p>

                {bulkDropConfirmed && readinessData && readinessData.inProgressCount > 0 ? (
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-3">
                    <div>
                      <div className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        Remaining Candidates Resolution
                      </div>
                      <p className="text-[11px] leading-relaxed mt-1.5">
                        You have selected <strong>{readinessData.inProgressCount} in-progress candidate(s)</strong> who are not yet hired or closed. Please select a reason to mass-drop them before concluding the drive:
                      </p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <select
                        value={massReason}
                        onChange={(e) => setMassReason(e.target.value)}
                        disabled={isBusy}
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        <option value="Not Selected (Drive Concluded)">Not Selected (Drive Concluded)</option>
                        <option value="Did not meet company criteria">Did not meet company criteria</option>
                        <option value="Not shortlisted for further rounds">Not shortlisted for further rounds</option>
                        <option value="Requirements Fulfilled">Requirements Fulfilled / Drive closed early</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                    All <strong>{readinessData?.totalApplicants}</strong> applicant(s) are resolved ({readinessData?.hiredCount} hired, {readinessData?.closedCount} closed).
                  </div>
                )}

                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3.5 border text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">Irreversible Action:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>This drive will be officially archived and closed.</li>
                    <li>All candidate application records and statuses will be permanently frozen.</li>
                    <li>No further applications, interview evaluations, or modifications can be made.</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('audit')}
                  disabled={isBusy}
                  className="text-xs gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Review
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmedComplete}
                  disabled={isBusy}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-medium shadow-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Yes, Mark as Completed
                </Button>
              </div>
            </div>
          ) : (
            /* STEP 1: AUDIT / READINESS REVIEW VIEW */
            <>
              <DialogHeader className="pb-3 border-b">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Complete Recruitment Drive
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Conclude the recruitment drive for <strong>{jobTitle}</strong>.
                </DialogDescription>
              </DialogHeader>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  Checking candidate application states...
                </div>
              ) : readinessData ? (
                <div className="space-y-4 py-2">
                  {/* Quick Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border text-center">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-medium">Total Applicants</div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{readinessData.totalApplicants}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-medium">Final Hires</div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{readinessData.hiredCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-medium">In Progress</div>
                      <div className={`text-lg font-bold ${readinessData.inProgressCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-500'}`}>
                        {readinessData.inProgressCount}
                      </div>
                    </div>
                  </div>

                  {/* CASE 1: All candidates resolved */}
                  {readinessData.inProgressCount === 0 ? (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                          <strong>All candidates are resolved!</strong>
                          <p className="mt-1 text-emerald-800 dark:text-emerald-300">
                            Every applicant in this drive has either been hired ({readinessData.hiredCount}) or closed out ({readinessData.closedCount}). Marking this drive as Completed will finalize official records and archive the drive.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setOpen(false)}
                          disabled={isBusy}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleInitiateComplete(false)}
                          disabled={isBusy}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                          Continue to Final Confirmation
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* CASE 2: Candidates still in progress */
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                          <strong>{readinessData.inProgressCount} Candidate{readinessData.inProgressCount > 1 ? 's' : ''} Still in Progress!</strong>
                          <p className="mt-1 text-amber-800 dark:text-amber-300">
                            Some candidates are still in intermediate rounds (e.g. Applied, Screened, PPT, Stage 1–3) and have not received a final decision.
                          </p>
                        </div>
                      </div>

                      {/* In-progress list snippet */}
                      <div className="border rounded-md max-h-36 overflow-y-auto divide-y bg-white dark:bg-zinc-950">
                        {readinessData.inProgressApplicants.slice(0, 10).map((cand) => (
                          <div key={cand.id} className="p-2 px-3 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{cand.name}</span>
                              <span className="text-[11px] text-zinc-400 ml-2">({cand.rollNumber})</span>
                            </div>
                            <span className="inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                              {cand.status}
                            </span>
                          </div>
                        ))}
                        {readinessData.inProgressCount > 10 && (
                          <div className="p-2 text-center text-[11px] text-zinc-500 italic">
                            + {readinessData.inProgressCount - 10} more candidates in progress
                          </div>
                        )}
                      </div>

                      {/* Mass Drop Notice */}
                      <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Mass Drop Resolution
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          If you choose to drop remaining candidates and proceed, you will be prompted to select a common reason to mass-drop all {readinessData.inProgressCount} in-progress applicants before finalizing.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setOpen(false)}
                          disabled={isBusy}
                          className="text-xs"
                        >
                          Review in Pipeline First
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleInitiateComplete(true)}
                          disabled={isBusy}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
                        >
                          Drop Remaining &amp; Proceed to Confirmation
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
