import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 shadow-2xs transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900/20 dark:focus-visible:ring-zinc-100/20 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:opacity-50 resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
