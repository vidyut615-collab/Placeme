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
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 transition-colors cursor-pointer select-none"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin stroke-[1.5]" />
      ) : (
        <LogOut className="w-3.5 h-3.5 flex-shrink-0 stroke-[1.5]" aria-hidden="true" />
      )}
      <span>Sign out</span>
    </button>
  )
}
