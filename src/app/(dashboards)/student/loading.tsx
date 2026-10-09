import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-500" />
      <h2 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
        Loading...
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Fetching data from the database. Please wait a moment.
      </p>
    </div>
  )
}
