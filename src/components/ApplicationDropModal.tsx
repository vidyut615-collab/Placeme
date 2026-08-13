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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateApplicationStatus } from '@/app/(dashboards)/college/actions'

export function ApplicationDropModal({ applicationId, studentName, trigger }: { applicationId: string, studentName: string, trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [reason, setReason] = useState<string>('')

  const handleDrop = async () => {
    if (!reason) {
      toast.error('Please select a reason for dropping the student.')
      return
    }

    setIsSaving(true)
    const formData = new FormData()
    formData.append('applicationId', applicationId)
    formData.append('status', 'dropped')
    formData.append('dropped_reason', reason)

    const result = await updateApplicationStatus(formData)
    setIsSaving(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
      setIsOpen(false)
      setReason('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Drop Student</DialogTitle>
          <DialogDescription>
            You are removing <strong>{studentName}</strong> from this job process. Please select the reason.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Drop Reason</Label>
            <Select value={reason} onValueChange={(val: any) => setReason(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="did_not_qualify">Did Not Qualify (0 Penalty)</SelectItem>
                <SelectItem value="no_show">No-Show (Penalty Strike)</SelectItem>
                <SelectItem value="excused_absence">Excused Absence (0 Penalty)</SelectItem>
                <SelectItem value="student_withdrew">Student Withdrew Mid-Process (Penalty Strike)</SelectItem>
                <SelectItem value="student_withdrew_post_shortlist">Student Withdrew Post-Shortlist (Penalty Strike)</SelectItem>
                <SelectItem value="unprofessional_conduct">Unprofessional Conduct (Disciplinary Strike)</SelectItem>
                <SelectItem value="data_fraud">Data Fraud (Integrity Strike)</SelectItem>
                <SelectItem value="revoked_by_company">Revoked by Company (Refunds upgrade, 0 penalty)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDrop} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Drop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
