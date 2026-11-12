'use client'

import React, { useTransition } from 'react'
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
  ScrollText,
  Compass,
  LogOut,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/(auth)/actions'

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
    title: 'Career intelligence',
    items: [
      { name: 'AI Resume Maker', href: '/student/ai-resume', icon: ScrollText, badge: 'ATS' },
      { name: 'AI Job Search', href: '/student/ai-job-search', icon: Compass },
    ],
  },
  {
    title: 'Governance & account',
    items: [
      { name: 'Placement Policies', href: '/student/policies', icon: FileCheck },
      { name: 'DigiProfile', href: '/student/profile', icon: UserCircle },
      { name: 'Subscription', href: '/student/billing', icon: CreditCard },
    ],
  },
]

export const studentNavigation = studentNavigationSections.flatMap((s) => s.items)

export interface StudentSidebarProps {
  candidateName?: string
  candidateEmail?: string
  profilePicture?: string
  collegeName?: string
}

export function StudentSidebar({
  candidateName,
  candidateEmail,
  profilePicture,
  collegeName,
}: StudentSidebarProps = {}) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  return (
    <aside className="w-64 border-r border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] flex flex-col justify-between h-full select-none z-30 shrink-0">
      {/* Top Brand Header */}
      <div className="h-14 px-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-between shrink-0">
        <Link href="/student/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#10B981] text-white flex items-center justify-center font-mono font-medium text-[13px] shrink-0 shadow-[0_1px_2px_rgba(15,118,110,0.2)]">
            P
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-[14px] tracking-[-0.01em] text-[#1C1917] dark:text-[#EFECE6] leading-none truncate">
              Placeme
            </span>
            <span className="text-[11px] text-[#78716C] dark:text-[#8A847A] mt-1 truncate">
              Student workspace
            </span>
          </div>
        </Link>
        <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shrink-0">
          2026
        </span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-none">
        {studentNavigationSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 text-[11px] font-medium text-[#78716C] dark:text-[#8A847A] mb-1.5">
              {section.title}
            </div>

            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/student/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-[#F3EFE9] dark:bg-[#24221F] text-[#0F766E] dark:text-[#14B8A6]'
                      : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] hover:bg-[#FAF8F5] dark:hover:bg-[#12110F]'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'w-4 h-4 stroke-[1.5] shrink-0 transition-colors duration-150',
                        isActive
                          ? 'text-[#0F766E] dark:text-[#14B8A6]'
                          : 'text-[#78716C] dark:text-[#8A847A] group-hover:text-[#1C1917] dark:group-hover:text-[#EFECE6]'
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-mono px-1.5 py-0.5 rounded-full border shrink-0',
                        isActive
                          ? 'bg-[#0F766E]/15 text-[#0F766E] dark:bg-[#14B8A6]/20 dark:text-[#14B8A6] border-[#0F766E]/25'
                          : 'bg-[#0F766E]/[0.08] text-[#0F766E] dark:bg-[#14B8A6]/10 dark:text-[#14B8A6] border-[#0F766E]/15'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Candidate Capsule & Sign Out */}
      <div className="border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] p-3 space-y-2 bg-[#FAF8F5]/70 dark:bg-[#12110F]/60">
        {/* Candidate Profile Card */}
        <Link
          href="/student/profile"
          className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#191816] hover:border-[#0F766E]/35 dark:hover:border-[#14B8A6]/35 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] transition-colors duration-150 group"
        >
          {profilePicture ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] shrink-0">
              <Image
                src={profilePicture}
                alt={candidateName || 'Candidate'}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 text-[#0F766E] dark:text-[#14B8A6] flex items-center justify-center font-mono font-medium text-[12px] shrink-0">
              {(candidateName?.[0] || candidateEmail?.[0] || 'C').toUpperCase()}
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] group-hover:text-[#0F766E] dark:group-hover:text-[#14B8A6] truncate transition-colors duration-150">
                {candidateName || 'Candidate profile'}
              </span>
              <CheckCircle2 className="w-3 h-3 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.75] shrink-0" />
            </div>
            <span className="text-[11px] text-[#78716C] dark:text-[#8A847A] truncate">
              {collegeName || candidateEmail || 'Verified student'}
            </span>
          </div>
        </Link>

        {/* Sign Out */}
        <button
          type="button"
          onClick={() => startTransition(() => signOut())}
          disabled={isPending}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-[#78716C] dark:text-[#8A847A] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/[0.08] transition-colors duration-150 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin shrink-0" />
          ) : (
            <LogOut className="w-3.5 h-3.5 stroke-[1.5] shrink-0" />
          )}
          <span>{isPending ? 'Signing out...' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  )
}
