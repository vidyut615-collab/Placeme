'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleJobPause } from '@/app/(dashboards)/college/actions'
import { toast } from 'sonner'
import { PauseCircle, PlayCircle, Loader2 } from 'lucide-react'

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

  const handleToggle = async () => {
    setIsLoading(true)
    const res = await toggleJobPause(jobId)
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(res.success)
      router.refresh()
    }
  }

  if (isPaused) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className="gap-1.5 text-xs text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <PlayCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        )}
        Resume Applications
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={disabled || isLoading}
      className="gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <PauseCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
      )}
      Pause Applications
    </Button>
  )
}
