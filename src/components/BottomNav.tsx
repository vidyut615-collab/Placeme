'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-white dark:bg-zinc-950 border-t flex items-center justify-around px-2 pb-safe">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              isActive
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
            )}
          >
            <item.icon
              className={cn('h-5 w-5', isActive ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400')}
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium leading-none">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
