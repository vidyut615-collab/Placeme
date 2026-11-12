'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ScrollText,
  Menu,
  Compass,
  FileCheck,
  CreditCard,
  UserCircle,
  LogOut,
  Loader2,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { executeSmoothThemeSwitch } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { signOut } from '@/app/(auth)/actions'

interface StudentBottomNavProps {
  candidateName?: string
  candidateEmail?: string
  creditBalance?: number
  collegeName?: string
}

export function StudentBottomNav({
  candidateName,
  candidateEmail,
  creditBalance = 0,
  collegeName,
}: StudentBottomNavProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isSigningOut, startTransition] = useTransition()

  const primaryTabs = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/student/jobs', icon: Briefcase },
    { name: 'Applications', href: '/student/applications', icon: FileText },
    { name: 'AI Resume', href: '/student/ai-resume', icon: ScrollText },
  ]

  const isMoreActive = [
    '/student/ai-job-search',
    '/student/policies',
    '/student/billing',
    '/student/profile',
  ].some((href) => pathname.startsWith(href))

  const secondaryLinks = [
    {
      title: 'AI Job Search',
      subtitle: 'External entry-level tech roles',
      href: '/student/ai-job-search',
      icon: Compass,
    },
    {
      title: 'Placement Policies',
      subtitle: 'Campus eligibility, upgrade & tier limits',
      href: '/student/policies',
      icon: FileCheck,
    },
    {
      title: 'Subscription',
      subtitle: `${creditBalance.toLocaleString()} AI credits · Placement Pass`,
      href: '/student/billing',
      icon: CreditCard,
    },
    {
      title: 'DigiProfile Dossier',
      subtitle: 'Verified academic marks & projects',
      href: '/student/profile',
      icon: UserCircle,
    },
  ]

  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white/90 dark:bg-[#191816]/90 backdrop-blur-md border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-around px-2 pb-safe select-none">
        {primaryTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/student/dashboard' && pathname.startsWith(tab.href))
          const Icon = tab.icon

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors duration-150',
                isActive
                  ? 'text-[#0F766E] dark:text-[#14B8A6]'
                  : 'text-[#78716C] dark:text-[#8A847A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5 stroke-[1.5]" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0F766E] dark:bg-[#14B8A6]" />
                )}
              </div>
              <span className="text-[10px] font-medium mt-1 leading-none">
                {tab.name}
              </span>
            </Link>
          )
        })}

        {/* 5th Tab: More Drawer */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors duration-150 cursor-pointer',
            isMoreActive
              ? 'text-[#0F766E] dark:text-[#14B8A6]'
              : 'text-[#78716C] dark:text-[#8A847A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
          )}
        >
          <div className="relative">
            <Menu className="w-5 h-5 stroke-[1.5]" />
            {isMoreActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0F766E] dark:bg-[#14B8A6]" />
            )}
          </div>
          <span className="text-[10px] font-medium mt-1 leading-none">More</span>
        </button>
      </nav>

      {/* More Bottom Sheet */}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-5 bg-white dark:bg-[#191816] border-t border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] text-[#1C1917] dark:text-[#EFECE6] max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="p-0 pb-3 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <SheetTitle className="text-[16px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-between">
              <span>Student menu</span>
              <span className="font-mono text-[11px] text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 px-2 py-0.5 rounded-full">
                {creditBalance.toLocaleString()} credits
              </span>
            </SheetTitle>
            <p className="text-[12px] text-[#78716C] dark:text-[#8A847A]">
              {candidateName || candidateEmail || 'Logged in candidate'} · {collegeName || 'Placement Network'}
            </p>
          </SheetHeader>

          <div className="py-3 space-y-1">
            {secondaryLinks.map((item) => {
              const isSelected = pathname === item.href || pathname.startsWith(item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl transition-colors duration-150',
                    isSelected
                      ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]'
                      : 'hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6]'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        isSelected
                          ? 'bg-[#0F766E] text-white'
                          : 'bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#57534E] dark:text-[#ACA59A]'
                      )}
                    >
                      <Icon className="w-4 h-4 stroke-[1.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">{item.title}</div>
                      <div className="text-[11px] text-[#78716C] dark:text-[#8A847A] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 stroke-[1.5] text-[#78716C] dark:text-[#8A847A] shrink-0" />
                </Link>
              )
            })}
          </div>

          {/* Quick Controls */}
          <div className="pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              <span className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A]">
                Theme appearance
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => executeSmoothThemeSwitch('light', setTheme, e)}
                  className={cn(
                    'p-1.5 rounded-lg text-[12px] transition-colors',
                    theme !== 'dark'
                      ? 'bg-white text-[#1C1917] shadow-xs font-medium'
                      : 'text-[#78716C]'
                  )}
                  title="Light mode"
                >
                  <Sun className="w-4 h-4 stroke-[1.5] text-amber-500" />
                </button>
                <button
                  type="button"
                  onClick={(e) => executeSmoothThemeSwitch('dark', setTheme, e)}
                  className={cn(
                    'p-1.5 rounded-lg text-[12px] transition-colors',
                    theme === 'dark'
                      ? 'bg-[#24221F] text-[#EFECE6] shadow-xs font-medium'
                      : 'text-[#78716C]'
                  )}
                  title="Dark mode"
                >
                  <Moon className="w-4 h-4 stroke-[1.5] text-[#14B8A6]" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startTransition(() => signOut())}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-rose-500/[0.08] text-rose-600 dark:text-rose-400 text-[13px] font-medium hover:bg-rose-500/15 transition-colors duration-150 cursor-pointer disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 stroke-[1.5] animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 stroke-[1.5]" />
              )}
              <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
