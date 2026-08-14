'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Users, Settings, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

import { LogoutButton } from './LogoutButton'

export const collegeNavigation = [
  { name: 'Overview', href: '/college/dashboard', icon: LayoutDashboard },
  { name: 'Local Jobs', href: '/college/jobs', icon: Briefcase },
  { name: 'Students', href: '/college/students', icon: Users },
  { name: 'Policies', href: '/college/policies', icon: Shield },
  { name: 'Settings', href: '/college/settings', icon: Settings },
]

export function CollegeSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-full md:w-64 flex-col border-r bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold tracking-tight">College Portal</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {collegeNavigation.map((item) => {
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
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">CA</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">College Admin</span>
            <span className="text-xs text-zinc-500">Local Role</span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}
