'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, GraduationCap, Briefcase, Users, Settings, ShieldCheck, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

import { LogoutButton } from './LogoutButton'
import { SidebarThemeToggle } from './ThemeToggle'

export const agencyNavigation = [
  { name: 'Overview', href: '/agency/dashboard', icon: LayoutDashboard },
  { name: 'Colleges', href: '/agency/colleges', icon: GraduationCap },
  { name: 'Global Jobs', href: '/agency/jobs', icon: Briefcase },
  { name: 'Students', href: '/agency/students', icon: Users },
  { name: 'Manage Roles', href: '/agency/roles', icon: ShieldCheck },
  { name: 'Manage Lists', href: '/agency/manage-lists', icon: Database },
  { name: 'Settings', href: '/agency/settings', icon: Settings },
]

export function AgencySidebar({ 
  role = 'agency_staff'
}: { 
  role?: string 
}) {
  const pathname = usePathname()

  const filteredNav = agencyNavigation.filter(item => {
    if (item.name === 'Manage Roles' && role !== 'superadmin') return false
    return true
  })

  const roleLabel = role === 'superadmin' ? 'Admin Owner' 
                  : role === 'agency_admin' ? 'Agency Admin' 
                  : 'Agency Staff'
  const initials = role === 'superadmin' ? 'AO' 
                 : role === 'agency_admin' ? 'AA' 
                 : 'AS'

  return (
    <div className="flex h-full w-full md:w-64 flex-col border-r bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold tracking-tight">Placeme Agency</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNav.map((item) => {
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
      <div className="border-t p-4 flex flex-col gap-3">
        <SidebarThemeToggle />

        {/* User profile snippet */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{initials}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">{roleLabel}</span>
            <span className="text-[11px] text-zinc-500">Agency Role</span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}
