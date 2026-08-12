'use client'

import { useTransition } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => signOut())}
      disabled={isPending}
      className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
    >
      {isPending ? (
        <Loader2 className="mr-3 h-5 w-5 flex-shrink-0 animate-spin" />
      ) : (
        <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      )}
      Sign Out
    </button>
  )
}
