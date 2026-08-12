'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, GraduationCap, Briefcase, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

import { LogoutButton } from './LogoutButton'

const navigation = [
  { name: 'Overview', href: '/agency/dashboard', icon: LayoutDashboard },
  { name: 'Colleges', href: '/agency/colleges', icon: GraduationCap },
  { name: 'Global Jobs', href: '/agency/jobs', icon: Briefcase },
  { name: 'Students', href: '/agency/students', icon: Users },
  { name: 'Settings', href: '/agency/settings', icon: Settings },
]

export function AgencySidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold tracking-tight">Placeme Agency</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4 flex flex-col gap-4">
        {/* User profile snippet could go here */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">SA</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Super Admin</span>
            <span className="text-xs text-zinc-500">Agency Role</span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}
