'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
        <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Something went wrong!
      </h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
        We encountered an unexpected error while loading this page. This could be a temporary network issue or a database timeout.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <Button onClick={() => reset()} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <RefreshCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
