import React from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { StudentSidebar, studentNavigation } from '@/components/StudentSidebar'
import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileUserMenu } from '@/components/MobileUserMenu'
import { Coins, Sparkles, Building2, ChevronRight } from 'lucide-react'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let creditBalance = 0
  let collegeName = 'Placement Network'
  let candidateName = ''
  let candidateEmail = user?.email || ''
  let profilePicture = ''
  let firstName = ''

  if (user) {
    const { data: student } = await supabase
      .from('students')
      .select('credit_balance, profile_data, colleges ( name )')
      .eq('user_id', user.id)
      .maybeSingle()

    if (student) {
      creditBalance = student.credit_balance || 0
      collegeName = (student.colleges as any)?.name || 'Placement Network'
      const prof = (student.profile_data as Record<string, any>) || {}
      firstName = prof.first_name || (prof.full_name ? prof.full_name.split(' ')[0] : '') || user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || (user?.email ? user.email.split('@')[0] : 'Candidate')
      candidateName = prof.first_name ? `${prof.first_name} ${prof.last_name || ''}`.trim() : prof.full_name || firstName
      profilePicture = prof.profile_picture || ''
    } else {
      firstName = user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || (user?.email ? user.email.split('@')[0] : 'Candidate')
    }
  }

  return (
    <div className="flex h-screen bg-[#fbfbfc] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans selection:bg-purple-500/20 selection:text-purple-900 dark:selection:text-purple-200">
      {/* Linear Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <StudentSidebar 
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          profilePicture={profilePicture}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Desktop Linear Top Command Bar */}
        <header className="hidden md:flex items-center justify-between h-14 border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md shrink-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <span className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              {collegeName}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 stroke-[1.5]" />
            <span className="text-zinc-900 dark:text-white font-semibold">
              Hello, {firstName || 'Candidate'}
            </span>
          </div>

          {/* Right: Credit Balance + Theme */}
          <div className="flex items-center gap-3">
            <Link
              href="/student/billing"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs font-mono text-xs transition-colors group"
            >
              <Coins className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-[1.5]" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {creditBalance.toLocaleString()} Credits
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold group-hover:underline">
                + Top Up
              </span>
            </Link>

            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#09090b] px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs font-mono">
              P
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/student/billing"
              className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-mono font-bold text-purple-600 dark:text-purple-400"
            >
              {creditBalance} cr
            </Link>
            <ThemeToggle />
            <MobileUserMenu />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Floating Bottom Nav */}
        <BottomNav items={studentNavigation} />
      </div>
    </div>
  )
}
