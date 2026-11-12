import React from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { StudentSidebar } from '@/components/StudentSidebar'
import { StudentTopNav } from '@/components/StudentTopNav'
import { StudentBottomNav } from '@/components/StudentBottomNav'
import { StudentFooter } from '@/components/StudentFooter'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileUserMenu } from '@/components/MobileUserMenu'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let creditBalance = 0
  let collegeName = 'Placement Network'
  let candidateName = ''
  const candidateEmail = user?.email || ''
  let profilePicture = ''
  let firstName = ''
  let accessEndDate: string | null = null

  if (user) {
    const { data: student } = await supabase
      .from('students')
      .select('credit_balance, access_end_date, profile_data, colleges ( name )')
      .eq('user_id', user.id)
      .maybeSingle()

    if (student) {
      creditBalance = student.credit_balance || 0
      accessEndDate = student.access_end_date || null

      const collegeRow = Array.isArray(student.colleges)
        ? student.colleges[0]
        : student.colleges
      collegeName = (collegeRow as { name?: string } | null)?.name || 'Placement Network'

      const prof = (student.profile_data as Record<string, unknown>) || {}
      const profFullName = typeof prof.full_name === 'string' ? prof.full_name : ''
      const profFirst = typeof prof.first_name === 'string' ? prof.first_name : ''
      const profLast = typeof prof.last_name === 'string' ? prof.last_name : ''

      firstName =
        profFirst ||
        (profFullName ? profFullName.split(' ')[0] : '') ||
        (user.user_metadata?.first_name as string) ||
        (typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name.split(' ')[0]
          : '') ||
        (user.email ? user.email.split('@')[0] : 'Candidate')

      candidateName = profFirst
        ? `${profFirst} ${profLast}`.trim()
        : profFullName || firstName

      profilePicture = typeof prof.profile_picture === 'string' ? prof.profile_picture : ''
    } else {
      firstName =
        (user.user_metadata?.first_name as string) ||
        (typeof user.user_metadata?.name === 'string'
          ? user.user_metadata.name.split(' ')[0]
          : '') ||
        (user.email ? user.email.split('@')[0] : 'Candidate')
      candidateName = firstName
    }
  }

  return (
    <div className="fixed inset-0 flex w-full h-full max-w-full max-h-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6] overflow-hidden font-sans selection:bg-[#0F766E]/20 selection:text-[#0F766E] dark:selection:bg-[#14B8A6]/20 dark:selection:text-[#14B8A6]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0 h-full">
        <StudentSidebar
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          profilePicture={profilePicture}
          collegeName={collegeName}
        />
      </div>

      {/* Main Column: Top Bar + Main Scroll Area + Footer + Mobile Nav */}
      <div className="flex flex-col flex-1 min-w-0 max-w-full h-full overflow-hidden relative">
        {/* Desktop Top Navigation */}
        <StudentTopNav
          collegeName={collegeName}
          firstName={firstName}
          creditBalance={creditBalance}
        />

        {/* Mobile Top Navigation */}
        <header className="md:hidden flex items-center justify-between h-14 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] px-4 shrink-0 z-20">
          <Link href="/student/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#10B981] text-white flex items-center justify-center font-medium text-[12px] font-mono shrink-0">
              P
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-medium tracking-[-0.01em] text-[#1C1917] dark:text-[#EFECE6] leading-none truncate">
                Placeme
              </span>
              <span className="text-[10px] text-[#78716C] dark:text-[#8A847A] truncate mt-0.5">
                {collegeName}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/student/billing"
              className="px-2.5 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[11px] font-mono tabular-nums font-medium text-[#0F766E] dark:text-[#14B8A6]"
            >
              {creditBalance.toLocaleString()} cr
            </Link>
            <ThemeToggle className="bg-[#FAF8F5] dark:bg-[#12110F] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]" />
            <MobileUserMenu />
          </div>
        </header>

        {/* Scrollable Main Content + Integrated Footer */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-w-0 w-full max-w-full bg-[#FAF8F5] dark:bg-[#12110F] pb-16 md:pb-0">
          <div className="flex-1 flex flex-col min-w-0 max-w-full w-full">{children}</div>
          <StudentFooter collegeName={collegeName} accessEndDate={accessEndDate} />
        </main>

        {/* Mobile Curated Bottom Nav + More Drawer */}
        <StudentBottomNav
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          creditBalance={creditBalance}
          collegeName={collegeName}
        />
      </div>
    </div>
  )
}
