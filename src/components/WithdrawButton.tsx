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
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { withdrawApplication } from '@/app/(dashboards)/student/actions'

export function WithdrawButton({ applicationId, status }: { applicationId: string, status: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Only allow withdrawing from applied, shortlisted, interviewing, offered
  const canWithdraw = ['applied', 'shortlisted', 'interviewing', 'offered'].includes(status)
  
  if (!canWithdraw) return null

  const isPostShortlist = ['shortlisted', 'interviewing', 'offered'].includes(status)

  const handleWithdraw = async () => {
    setIsWithdrawing(true)
    const result = await withdrawApplication(applicationId)
    setIsWithdrawing(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirm Withdrawal
          </DialogTitle>
          <DialogDescription className="pt-3 space-y-3">
            <p>Are you sure you want to withdraw your application?</p>
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-md text-orange-900 text-sm">
              <strong>Warning: </strong> 
              {isPostShortlist 
                ? "You are withdrawing after being shortlisted. This will incur a 'Post-Shortlist Withdrawal' penalty strike. Too many strikes will result in automatic blacklisting." 
                : "This will incur a 'Withdrawal' penalty strike. Too many strikes will result in automatic blacklisting."}
            </div>
            <p className="text-sm text-zinc-500">This action cannot be undone.</p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isWithdrawing}>
            Keep Application
          </Button>
          <Button variant="destructive" onClick={handleWithdraw} disabled={isWithdrawing}>
            {isWithdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
