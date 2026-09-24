'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { closeCandidatesBatch } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { Loader2, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react'

interface CloseReasonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationIds: string[]
  currentStage: string
  jobId: string
  candidateNames?: string[]
  onSuccess: () => void
}

export function CloseReasonModal({
  open,
  onOpenChange,
  applicationIds,
  currentStage,
  jobId,
  candidateNames = [],
  onSuccess,
}: CloseReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isApplicationStage = currentStage === 'applied'

  // Default initial reason based on stage
  const defaultReason = isApplicationStage
    ? 'Screened out by college / Profile mismatch'
    : 'Screened out by company'

  const effectiveReason = selectedReason || defaultReason

  // Check if chosen reason is an infraction
  const isInfraction = 
    effectiveReason.includes('voluntarily backed out') ||
    effectiveReason.includes('withdrew') ||
    effectiveReason.includes('Absent') ||
    effectiveReason.includes('No-Show') ||
    effectiveReason.includes('Disciplinary') ||
    effectiveReason.includes('fraud') ||
    effectiveReason.includes('forgery')

  const isFraud = effectiveReason.includes('fraud') || effectiveReason.includes('forgery')

  const handleClose = async () => {
    if (applicationIds.length === 0) {
      toast.error('No candidates selected.')
      return
    }

    setIsProcessing(true)

    const res = await closeCandidatesBatch({
      applicationIds,
      reason: effectiveReason,
      notes: notes.trim() || undefined,
      jobId,
    })

    setIsProcessing(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success || `Successfully closed ${applicationIds.length} candidate(s).`)
      setSelectedReason('')
      setNotes('')
      onOpenChange(false)
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <XCircle className="h-5 w-5 text-red-600" />
            Close Candidate{applicationIds.length > 1 ? 's' : ''} ({applicationIds.length})
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Moving candidates to the Closed tab removes them from active consideration for this drive.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Candidate Names preview if small batch */}
          {candidateNames.length > 0 && candidateNames.length <= 5 && (
            <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Selected: </span>
              {candidateNames.join(', ')}
            </div>
          )}

          {/* Standardized Reason Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="close-reason-select" className="text-xs font-semibold">
              Standard Exit Reason *
            </Label>
            <Select value={effectiveReason} onValueChange={(val) => setSelectedReason(val || '')}>
              <SelectTrigger id="close-reason-select" className="h-9 text-xs">
                <SelectValue placeholder="Select standard reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    🟢 Normal Exits (0 Strikes / No Penalty)
                  </SelectLabel>
                  {isApplicationStage ? (
                    <>
                      <SelectItem value="Screened out by college / Profile mismatch" className="text-xs">
                        Screened out by college / Profile mismatch
                      </SelectItem>
                      <SelectItem value="College clearance / fee hold" className="text-xs">
                        College clearance / fee hold
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Screened out by company" className="text-xs">
                        Screened out by company
                      </SelectItem>
                      <SelectItem value="Offer revoked by company" className="text-xs">
                        Offer revoked by company (Business reasons)
                      </SelectItem>
                    </>
                  )}
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel className="text-[11px] font-bold text-red-700 dark:text-red-400 pt-2 border-t mt-1">
                    🔴 Policy Infractions (Applies Strikes)
                  </SelectLabel>
                  <SelectItem value="Absent / No-Show for scheduled process" className="text-xs">
                    Absent / No-Show for scheduled process (+1 strike)
                  </SelectItem>
                  <SelectItem value="Student voluntarily backed out / withdrew" className="text-xs">
                    Student voluntarily backed out / withdrew (+1 strike)
                  </SelectItem>
                  <SelectItem value="Disciplinary / Unprofessional conduct" className="text-xs">
                    Disciplinary / Unprofessional conduct (+1 strike)
                  </SelectItem>
                  <SelectItem value="Data fraud / resume forgery" className="text-xs">
                    Data fraud / resume forgery (Instant Blacklist)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Warning banner if infraction selected */}
          {isInfraction && (
            <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
              isFraud 
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300' 
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
            }`}>
              {isFraud ? (
                <ShieldAlert className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-semibold">
                  {isFraud ? 'Critical Integrity Penalty:' : 'Conduct Penalty Strike:'}
                </span>
                <p>
                  {isFraud 
                    ? 'Selecting this will immediately auto-blacklist the student from all future campus placements.'
                    : 'This action will automatically increment the student\'s institutional strike counter and may trigger auto-blacklisting if their limit is reached.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Optional remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="close-notes" className="text-xs font-semibold">
              Coordinator Notes (Optional)
            </Label>
            <Textarea
              id="close-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Student informed department head via email on 24 Sep..."
              className="min-h-[70px] text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleClose}
            disabled={isProcessing}
            className="gap-1.5"
          >
            {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Close Candidate{applicationIds.length > 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
