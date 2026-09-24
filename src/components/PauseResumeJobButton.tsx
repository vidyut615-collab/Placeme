'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleJobPause } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { PauseCircle, PlayCircle, Loader2 } from 'lucide-react'
import { ScreenLoader } from '@/components/ScreenLoader'

interface PauseResumeJobButtonProps {
  jobId: string
  isPaused: boolean
  disabled?: boolean
}

export function PauseResumeJobButton({
  jobId,
  isPaused,
  disabled = false,
}: PauseResumeJobButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    setIsLoading(true)
    startTransition(async () => {
      try {
        const res = await toggleJobPause(jobId)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success(res.success)
          router.refresh()
        }
      } catch {
        toast.error('Failed to update drive status.')
      } finally {
        setIsLoading(false)
      }
    })
  }

  const isBusy = isLoading || isPending

  return (
    <>
      <ScreenLoader
        show={isBusy}
        title={isPaused ? 'Resuming Applications...' : 'Pausing Applications...'}
        message={
          isPaused
            ? 'Reopening candidate registrations and enabling student applications...'
            : 'Pausing applications and halting new student registrations...'
        }
        variant={isPaused ? 'blue' : 'amber'}
      />

      {isPaused ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={disabled || isBusy}
          className="gap-1.5 text-xs text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlayCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          )}
          Resume Applications
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggle}
          disabled={disabled || isBusy}
          className="gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PauseCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          )}
          Pause Applications
        </Button>
      )}
    </>
  )
}
