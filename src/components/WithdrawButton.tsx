'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export function WithdrawButton({
  applicationId,
  status,
  onSuccess,
}: {
  applicationId: string
  status: string
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [reasonCategory, setReasonCategory] = useState(WITHDRAWAL_REASONS[0].value)
  const [reasonDetails, setReasonDetails] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const cannotWithdraw = [
    'dropped',
    'hired',
    'joined',
    'forfeited',
    'rejected',
    'withdrawn',
    'closed',
    'cancelled',
    'offer_declined',
    'not_joined',
  ].includes(status.toLowerCase())
  if (cannotWithdraw) return null

  const isPostShortlist = [
    'shortlisted',
    'stage1',
    'stage2',
    'stage3',
    'interviewing',
    'offered',
  ].includes(status.toLowerCase())

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
      toast.success(result.success || 'Application withdrawn')
      setReasonDetails('')
      setIsOpen(false)
      onSuccess?.()
      router.refresh()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-[#B91C1C] dark:text-[#FCA5A5] border-[#DC2626]/20 hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/25 hover:text-[#991B1B] transition-colors duration-150 cursor-pointer"
          />
        }
      >
        Withdraw
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] bg-[#FAF8F5] dark:bg-[#191816] border-[#1C1917]/[0.10] dark:border-[#EFECE6]/[0.10]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
            <AlertTriangle className="h-4 w-4 stroke-[1.5] text-[#DC2626] dark:text-[#F87171]" />
            <span>Withdraw application</span>
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#57534E] dark:text-[#ACA59A] pt-1">
            Review the placement policy impact and provide your reason before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 text-[13px] text-[#B91C1C] dark:text-[#FCA5A5] bg-[#FEF2F2] dark:bg-[#7F1D1D]/25 border border-[#DC2626]/20 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="bg-[#FEF3C7]/70 dark:bg-[#B45309]/20 border border-[#B45309]/25 p-3.5 rounded-xl text-[13px] space-y-1">
            <p className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
              Policy consequence
            </p>
            <p className="leading-relaxed text-[#57534E] dark:text-[#ACA59A]">
              {isPostShortlist
                ? 'Withdrawing after shortlisting or round advancement logs a post-shortlist withdrawal strike. Exceeding college limits can trigger automatic suspension.'
                : 'Withdrawing logs a standard withdrawal strike under your college policy rules.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="withdrawal-reason-select" className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
              Primary reason
            </Label>
            <Select
              value={reasonCategory}
              onValueChange={(val) => {
                if (val) setReasonCategory(val)
              }}
            >
              <SelectTrigger
                id="withdrawal-reason-select"
                className="h-9 text-[13px] bg-white dark:bg-[#12110F] border-[#1C1917]/[0.10] dark:border-[#EFECE6]/[0.10]"
              >
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {WITHDRAWAL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-[13px]">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="withdrawal-details" className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
              Brief explanation
            </Label>
            <Textarea
              id="withdrawal-details"
              placeholder="Explain why you are withdrawing for placement cell records"
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              className="text-[13px] min-h-[84px] bg-white dark:bg-[#12110F] border-[#1C1917]/[0.10] dark:border-[#EFECE6]/[0.10]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isWithdrawing}
            className="h-9 px-4 rounded-lg text-[13px] font-medium cursor-pointer"
          >
            Keep application
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleWithdraw}
            disabled={isWithdrawing || !reasonDetails.trim()}
            className="h-9 px-4 rounded-lg text-[13px] font-medium cursor-pointer"
          >
            {isWithdrawing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Confirm withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
