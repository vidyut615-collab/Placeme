'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 space-y-4">
      <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="text-xl font-semibold">Something went wrong!</h2>
      <p className="text-center text-zinc-500 dark:text-zinc-400 max-w-md">
        We encountered an error while loading the student details.
      </p>
      <div className="flex gap-4 mt-4">
        <Button onClick={() => reset()} variant="outline">Try again</Button>
      </div>
    </div>
  )
}
