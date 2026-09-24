'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { withdrawApplication } from '@/app/(dashboards)/student/actions'

const WITHDRAWAL_REASONS = [
  { value: 'Accepted another offer', label: 'Accepted another job offer (On-Campus / Off-Campus)' },
  { value: 'Higher studies preparation', label: 'Preparing for Higher Studies (GATE / CAT / GRE / MS)' },
  { value: 'Location / Relocation constraints', label: 'Location / Travel constraints' },
  { value: 'Medical / Health reasons', label: 'Medical / Health emergency' },
  { value: 'Academic / Exam schedule clash', label: 'Academic / Exam date conflict' },
  { value: 'Job role / CTC mismatch', label: 'Job role / CTC mismatch with career plans' },
  { value: 'Opting out of campus placements', label: 'Opting out of campus placements entirely' },
  { value: 'Other personal reasons', label: 'Other (specify details below)' },
]

export function WithdrawButton({ applicationId, status }: { applicationId: string, status: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [reasonCategory, setReasonCategory] = useState(WITHDRAWAL_REASONS[0].value)
  const [reasonDetails, setReasonDetails] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Disallow withdrawing once hired, already dropped/closed, or forfeited
  const cannotWithdraw = ['dropped', 'hired', 'forfeited', 'joined'].includes(status)
  if (cannotWithdraw) return null

  const isPostShortlist = ['shortlisted', 'stage1', 'stage2', 'stage3', 'interviewing', 'offered'].includes(status)

  const handleWithdraw = async () => {
    if (!reasonDetails.trim()) {
      setErrorMsg('Please provide a brief explanation for withdrawing.')
      return
    }

    setErrorMsg(null)
    setIsWithdrawing(true)
    const result = await withdrawApplication(applicationId, reasonCategory, reasonDetails)
    setIsWithdrawing(false)

    if (result.error) {
      setErrorMsg(result.error)
      toast.error(result.error)
    } else {
      toast.success(result.success)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs h-8" />}>
        Withdraw
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-red-600 dark:text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Withdraw Application
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 pt-1">
            Please review the policy consequences and select your reason for opting out of this placement drive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md">
              {errorMsg}
            </div>
          )}

          {/* Policy Warning Box */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 rounded-lg text-amber-900 dark:text-amber-300 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              Placement Policy Consequence
            </p>
            <p className="leading-relaxed text-amber-800 dark:text-amber-400">
              {isPostShortlist 
                ? "You are withdrawing after shortlisting / round advancement. This will incur a 'Post-Shortlist Withdrawal' penalty strike. Exceeding college limits will lead to automatic blacklisting." 
                : "Withdrawing will log a general withdrawal strike in your placement profile according to your college's policy limits."}
            </p>
          </div>

          {/* Structured Reason Category */}
          <div className="space-y-1.5">
            <Label htmlFor="withdrawal-reason-select" className="text-xs font-semibold">
              Primary Reason for Withdrawal *
            </Label>
            <Select value={reasonCategory} onValueChange={(val) => { if (val) setReasonCategory(val) }}>
              <SelectTrigger id="withdrawal-reason-select" className="h-9 text-xs">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {WITHDRAWAL_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-xs">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-1.5">
            <Label htmlFor="withdrawal-details" className="text-xs font-semibold">
              Brief Explanation (Required for TPO Records) *
            </Label>
            <Textarea
              id="withdrawal-details"
              placeholder="e.g., Selected in Microsoft off-campus drive, joining July 2026..."
              value={reasonDetails}
              onChange={e => setReasonDetails(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} disabled={isWithdrawing}>
            Keep Application
          </Button>
          <Button variant="destructive" size="sm" onClick={handleWithdraw} disabled={isWithdrawing || !reasonDetails.trim()}>
            {isWithdrawing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirm Withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
