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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cancelOrDeleteJob } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, ShieldCheck, Loader2, Ban } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CancelJobModalProps {
  jobId: string
  jobTitle: string
  companyName?: string
  applicantCount: number
}

const CANCEL_REASONS = [
  'Company hiring freeze / campus visit cancelled by employer',
  'Employer revoked job role or significantly altered terms',
  'Drive schedule clash / Administrative college cancellation',
  'Job posted in error / Reposting revised opportunity',
  'Company did not show up for scheduled recruitment drive',
  'Other operational reasons',
]

export function CancelJobModal({
  jobId,
  jobTitle,
  companyName,
  applicantCount = 0,
}: CancelJobModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0])
  const [details, setDetails] = useState('')

  const hasApplicants = applicantCount > 0

  const handleAction = async () => {
    setIsSubmitting(true)
    const reasonString = hasApplicants
      ? `${selectedReason}${details.trim() ? ` — ${details.trim()}` : ''}`
      : undefined

    const res = await cancelOrDeleteJob({
      jobId,
      reason: reasonString,
    })
    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || (hasApplicants ? 'Drive cancelled.' : 'Job deleted.'))
      setOpen(false)
      if (res.action === 'deleted') {
        router.push('/college/jobs')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        hasApplicants ? (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50">
            <Ban className="h-3.5 w-3.5" />
            Cancel / Scrap Drive
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50">
            <Trash2 className="h-3.5 w-3.5" />
            Delete Job
          </Button>
        )
      } />

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-red-600">
            {hasApplicants ? (
              <>
                <AlertTriangle className="h-5 w-5" />
                Cancel / Scrap Recruitment Drive
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5" />
                Delete Job Posting
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {jobTitle} {companyName ? `(${companyName})` : ''}
          </DialogDescription>
        </DialogHeader>

        {hasApplicants ? (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>{applicantCount} Active Candidate{applicantCount > 1 ? 's' : ''} Affected</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Because students have already applied, deleting this job permanently is blocked to prevent data loss. Scrapping this drive will:
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc pl-4 space-y-1">
                <li>Mark the drive as <strong>Cancelled</strong>.</li>
                <li>Move all {applicantCount} applications to <strong>Cancelled (0 penalty)</strong>.</li>
                <li><strong>Refund student quotas:</strong> Concurrent active slots and Dream attempts will be immediately restored.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason" className="text-xs font-semibold">Cancellation Reason *</Label>
              <Select value={selectedReason} onValueChange={(val) => setSelectedReason(val || CANCEL_REASONS[0])}>
                <SelectTrigger id="cancel-reason" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="details" className="text-xs font-semibold">Additional Details / Notice to Candidates (Optional)</Label>
              <Textarea
                id="details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain context for candidate records and college placement audit log..."
                className="text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Keep Drive
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAction}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm &amp; Scrap Drive
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              No students have applied to this job yet. Permanently deleting this job will completely remove it from the portal.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
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
                onClick={handleAction}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete Job Permanently
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
