'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  UserCircle,
  FileCheck,
  CreditCard,
  Sparkles,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { SidebarThemeToggle } from './ThemeToggle'

export interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const studentNavigationSections = [
  {
    title: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      { name: 'Jobs', href: '/student/jobs', icon: Briefcase },
      { name: 'My Applications', href: '/student/applications', icon: FileText },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { name: 'AI Resume Maker', href: '/student/ai-resume', icon: Sparkles, badge: 'ATS' },
      { name: 'Scraped Job Feed', href: '/student/ai-job-search', icon: Compass },
    ],
  },
  {
    title: 'Governance & Account',
    items: [
      { name: 'Placement Policies', href: '/student/policies', icon: FileCheck },
      { name: 'Credit Balance', href: '/student/billing', icon: CreditCard },
      { name: 'DigiProfile', href: '/student/profile', icon: UserCircle },
    ],
  },
]

export const studentNavigation = studentNavigationSections.flatMap((s) => s.items)

export interface StudentSidebarProps {
  candidateName?: string
  candidateEmail?: string
  profilePicture?: string
}

export function StudentSidebar({ candidateName, candidateEmail, profilePicture }: StudentSidebarProps = {}) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#09090b] flex flex-col justify-between h-screen sticky top-0 select-none z-30 transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
        <Link href="/student/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs tracking-wider font-mono shadow-xs group-hover:scale-[1.02] transition-transform">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
              Placeme
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-1">
              Student Console
            </span>
          </div>
        </Link>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          CYCLE 2026
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
        {studentNavigationSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold mb-1">
              {section.title}
            </div>

            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/student/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'w-4 h-4 stroke-[1.5] transition-colors shrink-0',
                        isActive
                          ? 'text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/60 dark:border-purple-800/40">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer Profile & Utilities */}
      <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40">
        {/* Candidate Profile Capsule */}
        <Link 
          href="/student/profile"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs transition-colors group cursor-pointer"
        >
          {profilePicture ? (
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
              <Image src={profilePicture} alt="Avatar" fill sizes="28px" className="object-cover" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
              {(candidateName?.[0] || candidateEmail?.[0] || 'C').toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {candidateName || 'Candidate Dossier'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
              {candidateEmail || 'Verified Student'}
            </span>
          </div>
        </Link>

        {/* Theme Toggle Pill */}
        <SidebarThemeToggle />

        {/* Logout Action */}
        <div className="pt-0.5">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
