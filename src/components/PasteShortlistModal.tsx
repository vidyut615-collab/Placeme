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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { advanceCandidatesBatch, closeCandidatesBatch } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { Loader2, ClipboardPaste, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

interface CandidateApp {
  id: string
  status: string
  students: {
    id: string
    user_id: string
    profile_data: any
    user_email?: string
  } | null
}

interface PasteShortlistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStage: string
  jobId: string
  candidates: CandidateApp[]
  stageOptions: Array<{ id: string; label: string }>
  onSuccess: () => void
}

export function PasteShortlistModal({
  open,
  onOpenChange,
  currentStage,
  jobId,
  candidates,
  stageOptions,
  onSuccess,
}: PasteShortlistModalProps) {
  const [rawText, setRawText] = useState('')
  const [targetStage, setTargetStage] = useState<string>('')
  const [closeRemaining, setCloseRemaining] = useState(false)
  const [closeReason, setCloseReason] = useState('Screened out by company')
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter stage options to only those that come after the current stage
  const currentStageIndex = stageOptions.findIndex(s => s.id === currentStage)
  const subsequentStages = currentStageIndex >= 0 
    ? stageOptions.slice(currentStageIndex + 1).filter(s => s.id !== 'closed' && s.id !== 'overview')
    : stageOptions.filter(s => s.id !== 'closed' && s.id !== 'overview' && s.id !== currentStage)

  // Default target stage to the immediate next stage
  const defaultTargetStage = subsequentStages[0]?.id || ''
  const effectiveTargetStage = targetStage || defaultTargetStage

  // Helper to extract email from student profile
  const getCandidateEmail = (app: CandidateApp): string => {
    const email = app.students?.user_email || 
      app.students?.profile_data?.email || 
      app.students?.profile_data?.contact?.email || 
      ''
    return email.toLowerCase().trim()
  }

  // Parse emails using standard RFC 5322-compatible regex
  const parsedEmails: string[] = Array.from(
    new Set(
      (rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).map(e =>
        e.toLowerCase().trim()
      )
    )
  )

  // Map candidates by email
  const candidateEmailMap = new Map<string, CandidateApp>()
  candidates.forEach(app => {
    const email = getCandidateEmail(app)
    if (email) {
      candidateEmailMap.set(email, app)
    }
  })

  // Matched candidate applications
  const matchedApps: CandidateApp[] = []
  const unmatchedEmails: string[] = []

  parsedEmails.forEach(email => {
    const app = candidateEmailMap.get(email)
    if (app) {
      matchedApps.push(app)
    } else {
      unmatchedEmails.push(email)
    }
  })

  // Candidates in stage who were NOT matched in the paste
  const matchedAppIds = new Set(matchedApps.map(a => a.id))
  const remainingApps = candidates.filter(a => !matchedAppIds.has(a.id))

  const handleAdvance = async () => {
    if (matchedApps.length === 0) {
      toast.error('No matched candidates found in this round.')
      return
    }

    if (!effectiveTargetStage) {
      toast.error('Please select a target stage.')
      return
    }

    setIsProcessing(true)

    // 1. Advance matched candidates
    const advanceRes = await advanceCandidatesBatch({
      applicationIds: matchedApps.map(a => a.id),
      targetStage: effectiveTargetStage,
      jobId,
    })

    if (advanceRes.error) {
      toast.error(advanceRes.error)
      setIsProcessing(false)
      return
    }

    // 2. If closeRemaining is checked and there are remaining candidates
    if (closeRemaining && remainingApps.length > 0) {
      const closeRes = await closeCandidatesBatch({
        applicationIds: remainingApps.map(a => a.id),
        reason: closeReason,
        notes: `Auto-closed remaining unshortlisted candidates during paste advancement to ${effectiveTargetStage}`,
        jobId,
      })

      if (closeRes.error) {
        toast.error(`Advanced candidates, but failed to close remaining: ${closeRes.error}`)
      } else {
        toast.success(`Advanced ${matchedApps.length} candidate(s) and closed ${remainingApps.length} remaining.`)
      }
    } else {
      toast.success(advanceRes.success || `Successfully advanced ${matchedApps.length} candidate(s)!`)
    }

    setIsProcessing(false)
    setRawText('')
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg flex items-center gap-2">
            <ClipboardPaste className="h-5 w-5 text-blue-600" />
            Paste Recruiter Shortlist
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Paste recruiter feedback emails or text. The system extracts email addresses and matches them against active candidates in this round.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Textarea Input */}
          <div className="space-y-1.5">
            <Label htmlFor="paste-input" className="text-xs font-semibold">
              Paste Emails or Text from Recruiter
            </Label>
            <Textarea
              id="paste-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Please find shortlisted candidates: aniket@college.edu, priya.sharma@college.edu..."
              className="min-h-[140px] text-xs font-mono"
            />
          </div>

          {/* Match Analysis Stats */}
          {rawText.trim().length > 0 && (
            <div className="rounded-lg border p-4 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">Parsed from text:</span>
                <span className="font-semibold">{parsedEmails.length} email(s) found</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      {matchedApps.length} Matched
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Ready to advance
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {unmatchedEmails.length} Unmatched
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400">
                      Not in this stage
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched Preview */}
              {matchedApps.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-[11px] text-zinc-500 font-medium">Matched Candidates Preview:</Label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 border rounded bg-white dark:bg-zinc-800">
                    {matchedApps.map(app => {
                      const name = app.students?.profile_data?.personal?.full_name || 
                        app.students?.profile_data?.name || 
                        getCandidateEmail(app)
                      return (
                        <Badge key={app.id} variant="secondary" className="text-[10px] px-2 py-0.5">
                          {name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Target Stage Progression Dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="target-stage" className="text-xs font-semibold">
              Advance Matched Candidates To:
            </Label>
            <Select value={effectiveTargetStage} onValueChange={(val) => setTargetStage(val || '')}>
              <SelectTrigger id="target-stage" className="h-9 text-xs">
                <SelectValue placeholder="Select target stage" />
              </SelectTrigger>
              <SelectContent>
                {subsequentStages.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-zinc-500">
              Coordinators can advance candidates to the immediate next stage or jump to any subsequent round.
            </p>
          </div>

          {/* Close Remaining Candidates Checkbox */}
          <div className="p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="close-remaining-checkbox"
                checked={closeRemaining}
                onChange={(e) => setCloseRemaining(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <label htmlFor="close-remaining-checkbox" className="text-xs font-semibold cursor-pointer">
                  Close remaining {remainingApps.length} candidate(s) in this stage
                </label>
                <p className="text-[11px] text-zinc-500">
                  Automatically move unselected candidates from this round to the Closed tab with a standard round failure reason.
                </p>
              </div>
            </div>

            {closeRemaining && (
              <div className="pt-2 pl-6 space-y-1">
                <Label htmlFor="close-reason" className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Close Reason for Remaining Candidates:
                </Label>
                <Select value={closeReason} onValueChange={(val) => setCloseReason(val || '')}>
                  <SelectTrigger id="close-reason" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Screened out by company" className="text-xs">
                      Screened out by company (Zero Penalty)
                    </SelectItem>
                    <SelectItem value="Screened out by college / Profile mismatch" className="text-xs">
                      Screened out by college (Zero Penalty)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
            size="sm"
            onClick={handleAdvance}
            disabled={isProcessing || matchedApps.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Advance {matchedApps.length} Candidate(s)
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
