'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Shield,
  CheckSquare,
  Award,
  UserCheck,
  Calendar,
  Building2,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { LogoutButton } from './LogoutButton'
import { SidebarThemeToggle } from './ThemeToggle'

export const baseCollegeNavigation = [
  { name: 'Overview', href: '/college/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/college/jobs', icon: Briefcase },
  { name: 'Students', href: '/college/students', icon: Users },
  { name: 'Placed Students', href: '/college/placed-students', icon: Award },
  { name: 'Approvals', href: '/college/approvals', icon: CheckSquare },
  { name: 'Policies', href: '/college/policies', icon: Shield },
]

export const collegeAdminNavigation = [
  ...baseCollegeNavigation,
  { name: 'Placement Cycles', href: '/college/placement-cycles', icon: Calendar },
  { name: 'Manage Roles', href: '/college/roles', icon: UserCheck },
  { name: 'College Profile', href: '/college/profile', icon: Building2 },
  { name: 'My Profile', href: '/college/my-profile', icon: User },
]

export const collegeStaffNavigation = [
  ...baseCollegeNavigation,
  { name: 'Placement Cycles', href: '/college/placement-cycles', icon: Calendar },
  { name: 'College Profile', href: '/college/profile', icon: Building2 },
  { name: 'My Profile', href: '/college/my-profile', icon: User },
]

// Default navigation export for backwards compatibility
export const collegeNavigation = collegeAdminNavigation

export function CollegeSidebar({
  role = 'college_admin',
  userName,
  userEmail,
  department,
}: {
  role?: string
  userName?: string
  userEmail?: string
  department?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  collegeName?: string | null
  availableDepartments?: string[]
}) {
  const pathname = usePathname()
  const navigation = role === 'college_admin' ? collegeAdminNavigation : collegeStaffNavigation

  const displayName = userName || (role === 'college_admin' ? 'College Admin' : 'College Staff')
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || (role === 'college_admin' ? 'CA' : 'CS')

  return (
    <div className="flex h-full w-full md:w-64 flex-col border-r bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold tracking-tight">College Portal</span>
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
      <div className="border-t p-4 flex flex-col gap-3">
        <SidebarThemeToggle />

        <div className="flex items-center gap-3 text-left w-full p-2 -mx-2 rounded-lg select-none">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs shrink-0 shadow-xs ${
              role === 'college_admin'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
            }`}
          >
            <span>{initials}</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {displayName}
            </span>
            <div className="flex items-center gap-1 text-xs text-zinc-500 truncate">
              <span>{role === 'college_admin' ? 'College Admin' : 'College Staff'}</span>
              {department && <span className="text-zinc-400 truncate">• {department}</span>}
            </div>
          </div>
        </div>

        <LogoutButton />
      </div>
    </div>
  )
}
