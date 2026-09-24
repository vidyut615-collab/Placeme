'use client'

import { useState } from 'react'
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
import { CheckCircle2, AlertTriangle, Loader2, Users, Award, ShieldAlert, ArrowRight } from 'lucide-react'

interface CompleteJobModalProps {
  jobId: string
  jobTitle: string
}

export function CompleteJobModal({ jobId, jobTitle }: CompleteJobModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [readinessData, setReadinessData] = useState<{
    totalApplicants: number
    hiredCount: number
    closedCount: number
    inProgressCount: number
    inProgressApplicants: { id: string; name: string; email: string; rollNumber: string; status: string }[]
  } | null>(null)

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
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
    }
  }

  const handleComplete = async (bulkDropRemaining = false) => {
    setIsSubmitting(true)
    const res = await completeJob({ jobId, bulkDropRemaining })
    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || 'Drive completed successfully!')
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Mark Complete
        </Button>
      } />

      <DialogContent className="sm:max-w-[560px] p-6">
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
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleComplete(false)}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm &amp; Mark Completed
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

                {/* Penalty-Free Bulk Option Notice */}
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-blue-600" />
                    Penalty-Free Bulk Resolution
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    If you complete the drive now, all {readinessData.inProgressCount} remaining candidates will automatically be marked as <strong>Not Selected (Dropped)</strong> with <strong>0 penalty strikes</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Review in Pipeline First
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleComplete(true)}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Mark Remaining as Not Selected &amp; Complete Drive
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
