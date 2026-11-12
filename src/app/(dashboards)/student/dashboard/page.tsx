import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Award,
  Briefcase,
  Check,
  Clock,
  FileText,
  Lock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { RollingCounter } from '@/components/ui/tactile'
import { formatDate } from '@/lib/utils'

interface ProfileData {
  gpa?: number | string
  backlogs?: number
  department?: string
}

interface CollegeInfo {
  name?: string | null
  logo_url?: string | null
}

interface PolicyConfig {
  upgrade?: {
    multiplier?: number
  }
}

interface PolicyCounters {
  no_show_count?: number
  withdrawal_count?: number
  post_shortlist_withdrawal_count?: number
  disciplinary_strikes?: number
  integrity_strikes?: number
}

interface DashboardJob {
  id: string
  title?: string | null
  company_name?: string | null
  compensation_ctc?: number | string | null
  workplace_mode?: string | null
  location?: string | null
}

interface RecentApplicationRow {
  id: string
  status?: string | null
  created_at: string
  jobs?: DashboardJob | DashboardJob[] | null
}

function formatCtc(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return '—'
  return `₹${num.toFixed(1)} LPA`
}

function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`
}

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interviewing: 'Interviewing',
  selected: 'Selected',
  offered: 'Offered',
  offer_accepted: 'Offer accepted',
  offer_declined: 'Offer declined',
  hired: 'Hired',
  joined: 'Joined',
  not_joined: 'Not joined',
  withdrawn: 'Withdrawn',
  rejected: 'Not selected',
  dropped: 'Dropped',
  forfeited: 'Forfeited',
}

function getStageProgress(status: string): { step: number; percent: number; isTerminal: boolean; isPositive: boolean } {
  switch (status) {
    case 'selected':
    case 'offered':
    case 'offer_accepted':
    case 'hired':
    case 'joined':
      return { step: 4, percent: 100, isTerminal: false, isPositive: true }
    case 'interviewing':
      return { step: 3, percent: 75, isTerminal: false, isPositive: true }
    case 'shortlisted':
      return { step: 2, percent: 50, isTerminal: false, isPositive: true }
    case 'rejected':
    case 'dropped':
    case 'withdrawn':
    case 'forfeited':
    case 'offer_declined':
    case 'not_joined':
      return { step: 1, percent: 100, isTerminal: true, isPositive: false }
    default:
      return { step: 1, percent: 25, isTerminal: false, isPositive: false }
  }
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // 1. Fetch student master profile + college details
  const { data: student } = await supabase
    .from('students')
    .select(
      `
      id,
      college_id,
      profile_data,
      is_blacklisted,
      policy_counters,
      access_end_date,
      credit_balance,
      colleges (
        name,
        logo_url
      )
    `
    )
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return (
      <div className="min-h-full w-full bg-[#FAF8F5] dark:bg-[#12110F] p-8">
        <div className="max-w-7xl mx-auto rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-6 text-[14px] text-[#57534E] dark:text-[#ACA59A]">
          Unable to load your student profile. Please contact your campus placement office.
        </div>
      </div>
    )
  }

  const profile = (student.profile_data as ProfileData | null) ?? {}
  const collegeRel = student.colleges as CollegeInfo | CollegeInfo[] | null
  const collegeName =
    (Array.isArray(collegeRel) ? collegeRel[0]?.name : collegeRel?.name) ||
    'Campus Placement Cell'

  // 2. Parallel fetch applications, active jobs, offers, AI resumes, and policy config
  const [
    { data: recentApplications, count: totalAppsCount },
    { data: allApplications },
    { data: recentJobs, count: totalJobsCount },
    { data: offers },
    { count: totalResumesCount },
    { data: policyDoc },
  ] = await Promise.all([
    supabase
      .from('applications')
      .select(
        `
        id,
        status,
        created_at,
        jobs (
          id,
          title,
          company_name,
          compensation_ctc,
          college_id,
          workplace_mode,
          location,
          deadline,
          status
        )
      `,
        { count: 'exact' }
      )
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('applications')
      .select('id, job_id, status, jobs ( title, company_name, compensation_ctc )')
      .eq('student_id', student.id),

    supabase
      .from('jobs')
      .select(
        'id, title, company_name, compensation_ctc, college_id, workplace_mode, location, deadline, created_at',
        { count: 'exact' }
      )
      .eq('status', 'active')
      .or(`college_id.eq.${student.college_id},is_all_colleges.eq.true`)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('student_offers')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false }),

    supabase
      .from('ai_resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),

    supabase
      .from('placement_policies')
      .select('config')
      .eq('college_id', student.college_id)
      .maybeSingle(),
  ])

  // Offer & Upgrade Gate calculation
  const approvedOffer = offers?.find((o) => o.status === 'approved')
  const pendingOffer = offers?.find((o) => o.status === 'pending')
  const isPlaced = !!approvedOffer
  const holdingCtc = approvedOffer ? Number(approvedOffer.compensation_ctc) : 0
  const upgradeMultiplier =
    (policyDoc?.config as PolicyConfig | null)?.upgrade?.multiplier || 1.5
  const upgradeMinCtc = holdingCtc > 0 ? (holdingCtc * upgradeMultiplier).toFixed(1) : '0.0'

  // Application funnel metrics
  const allApps = allApplications || []
  const appliedCount = allApps.filter((a) => a.status === 'applied').length
  const shortlistedCount = allApps.filter((a) => a.status === 'shortlisted').length
  const interviewingCount = allApps.filter((a) => a.status === 'interviewing').length
  const inFlightCount = appliedCount + shortlistedCount + interviewingCount

  // Policy standing & strikes
  const counters = (student.policy_counters as PolicyCounters | null) ?? {}
  const noShowStrikes = counters.no_show_count || 0
  const withdrawalStrikes =
    (counters.withdrawal_count || 0) + (counters.post_shortlist_withdrawal_count || 0)
  const disciplinaryStrikes =
    (counters.disciplinary_strikes || 0) + (counters.integrity_strikes || 0)
  const totalStrikes = noShowStrikes + withdrawalStrikes + disciplinaryStrikes
  const isBlacklisted = student.is_blacklisted || false
  const activeBacklogs = Number(profile.backlogs ?? 0)

  const appliedJobIdSet = new Set(allApps.map((a) => a.job_id))

  return (
    <div className="min-h-full w-full min-w-0 bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6]">
      <div className="max-w-7xl mx-auto w-full min-w-0 px-6 py-7 md:px-8 md:py-8 space-y-6">
        {/* ── 1. Page Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-medium tracking-[-0.02em] leading-[1.15] text-[#1C1917] dark:text-[#EFECE6]">
              Placement Overview
            </h1>
            <p className="text-[14px] text-[#57534E] dark:text-[#ACA59A] mt-1">
              {collegeName} · Cycle I — Track active drives, interview stages, and offer eligibility
            </p>
          </div>
        </header>

        {/* ── 2. Standing & Offer Gate Banner (Primary Focal Moment) ── */}
        {approvedOffer ? (
          <section className="rounded-[14px] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-gradient-to-br from-[#0F766E]/[0.07] via-[#10B981]/[0.03] to-white dark:from-[#0F766E]/[0.18] dark:via-[#10B981]/[0.06] dark:to-[#191816] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF8] dark:bg-[#0F766E]/25 border border-[#0F766E]/20 dark:border-[#14B8A6]/30 text-[#115E59] dark:text-[#5EEAD4] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Offer holding confirmed · {approvedOffer.company_name}
                  </span>
                  <span className="font-mono text-[12px] font-medium tabular-nums px-2 py-0.5 rounded-md bg-[#ECFEFF] dark:bg-[#0F766E]/30 text-[#0F766E] dark:text-[#5EEAD4] border border-[#0F766E]/20 dark:border-[#14B8A6]/30">
                    {formatCtc(holdingCtc)}
                  </span>
                </div>
                <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                  The {upgradeMultiplier}× upgrade policy is active on your record — you can apply to dream roles offering ≥ ₹{upgradeMinCtc} LPA
                </p>
              </div>
            </div>

            <div className="md:text-right shrink-0 md:pl-5 md:border-l border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              <div className="text-[12px] text-[#78716C] dark:text-[#8A847A]">
                Minimum upgrade floor
              </div>
              <div className="font-mono text-[16px] font-medium tabular-nums text-[#115E59] dark:text-[#5EEAD4] mt-0.5">
                ≥ ₹{upgradeMinCtc} LPA
              </div>
            </div>
          </section>
        ) : pendingOffer ? (
          <section className="rounded-[14px] border border-[#B45309]/25 dark:border-[#F59E0B]/25 bg-gradient-to-br from-[#D97706]/[0.07] via-[#F59E0B]/[0.02] to-white dark:from-[#D97706]/[0.16] dark:via-transparent dark:to-[#191816] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#FEF3C7] dark:bg-[#B45309]/25 border border-[#B45309]/20 text-[#B45309] dark:text-[#FCD34D] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Offer verification in progress · {pendingOffer.company_name}
                  </span>
                  {pendingOffer.compensation_ctc ? (
                    <span className="font-mono text-[12px] font-medium tabular-nums px-2 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#B45309]/30 text-[#B45309] dark:text-[#FCD34D] border border-[#B45309]/20">
                      {formatCtc(pendingOffer.compensation_ctc)}
                    </span>
                  ) : null}
                </div>
                <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                  Submitted on {formatDate(pendingOffer.created_at)} — awaiting confirmation from your placement cell
                </p>
              </div>
            </div>

            <span className="font-mono text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#FEF3C7] dark:bg-[#B45309]/25 text-[#B45309] dark:text-[#FCD34D] border border-[#B45309]/20 shrink-0">
              Awaiting review
            </span>
          </section>
        ) : inFlightCount > 0 ? (
          <section className="rounded-[14px] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-gradient-to-br from-[#0F766E]/[0.07] via-[#10B981]/[0.03] to-white dark:from-[#0F766E]/[0.18] dark:via-[#10B981]/[0.06] dark:to-[#191816] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF8] dark:bg-[#0F766E]/25 border border-[#0F766E]/20 dark:border-[#14B8A6]/30 text-[#115E59] dark:text-[#5EEAD4] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <div className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {pluralize(inFlightCount, 'active application')} in progress
                </div>
                <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                  {interviewingCount > 0
                    ? `${pluralize(interviewingCount, 'role')} currently in interview rounds — keep your resume updated for upcoming panels`
                    : `${pluralize(appliedCount + shortlistedCount, 'submission')} under recruiter review and shortlist checks`}
                </p>
              </div>
            </div>

            <Link
              href="/student/applications"
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[13px] font-medium bg-white dark:bg-[#24221F] hover:bg-[#F3EFE9] dark:hover:bg-[#2D2A26] text-[#115E59] dark:text-[#5EEAD4] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 transition-colors duration-150 shrink-0"
            >
              Review applications
            </Link>
          </section>
        ) : (
          <section className="rounded-[14px] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-gradient-to-br from-[#0F766E]/[0.06] via-[#10B981]/[0.02] to-white dark:from-[#0F766E]/[0.16] dark:via-transparent dark:to-[#191816] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF8] dark:bg-[#0F766E]/25 border border-[#0F766E]/20 dark:border-[#14B8A6]/30 text-[#115E59] dark:text-[#5EEAD4] flex items-center justify-center shrink-0">
                {isBlacklisted ? (
                  <ShieldAlert className="w-4 h-4 stroke-[1.5] text-[#DC2626] dark:text-[#F87171]" />
                ) : (
                  <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  {isBlacklisted ? 'Placement access paused' : 'Eligible for open campus drives'}
                </div>
                <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                  {isBlacklisted
                    ? 'A cooldown restriction is active on your account — check your placement rules for details'
                    : 'No pending actions today — browse open campus drives or prepare a tailored resume'}
                </p>
              </div>
            </div>

            <Link
              href={isBlacklisted ? '/student/policies' : '/student/jobs'}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[13px] font-medium bg-gradient-to-b from-[#13857C] to-[#0C635C] hover:from-[#10736B] hover:to-[#0A554F] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_1px_2px_rgba(28,25,23,0.12)] transition-colors duration-150 shrink-0"
            >
              {isBlacklisted ? 'View policy rules' : 'Explore open drives'}
            </Link>
          </section>
        )}

        {/* ── 3. Three Compact Stat Cards (Numbers, label, and comparison only) ── */}
        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/student/applications"
            className="block rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:border-[#1C1917]/20 dark:hover:border-[#EFECE6]/20 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-normal text-[#57534E] dark:text-[#ACA59A]">
                Active applications
              </span>
              <span className="font-mono text-[12px] text-[#78716C] dark:text-[#8A847A]">
                Cycle I
              </span>
            </div>
            <div className="text-[30px] font-mono font-medium tabular-nums leading-none tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
              <RollingCounter value={totalAppsCount || 0} />
            </div>
            <p className="text-[13px] text-[#78716C] dark:text-[#8A847A] mt-2.5">
              <span className="text-[#115E59] dark:text-[#5EEAD4] font-medium">
                {interviewingCount} in interviews
              </span>{' '}
              · {shortlistedCount} shortlisted
            </p>
          </Link>

          <Link
            href="/student/policies"
            className="block rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:border-[#1C1917]/20 dark:hover:border-[#EFECE6]/20 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-normal text-[#57534E] dark:text-[#ACA59A]">
                Academic standing
              </span>
              <span className="font-mono text-[12px] text-[#78716C] dark:text-[#8A847A]">
                {profile.department || 'Verified'}
              </span>
            </div>
            <div className="text-[30px] font-mono font-medium tabular-nums leading-none tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
              {profile.gpa ? `${Number(profile.gpa).toFixed(2)} GPA` : 'Verified'}
            </div>
            <p className="text-[13px] text-[#78716C] dark:text-[#8A847A] mt-2.5">
              {isBlacklisted ? (
                <span className="text-[#DC2626] dark:text-[#F87171] font-medium">
                  Cooldown active
                </span>
              ) : totalStrikes > 0 ? (
                <span className="text-[#B45309] dark:text-[#FCD34D] font-medium">
                  {pluralize(totalStrikes, 'strike')} active
                </span>
              ) : (
                <span>0 strikes</span>
              )}{' '}
              · {pluralize(activeBacklogs, 'active backlog')}
            </p>
          </Link>

          <Link
            href="/student/billing"
            className="block rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:border-[#1C1917]/20 dark:hover:border-[#EFECE6]/20 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-colors duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-normal text-[#57534E] dark:text-[#ACA59A]">
                Resume credits
              </span>
              <span className="font-mono text-[12px] text-[#78716C] dark:text-[#8A847A]">
                Balance
              </span>
            </div>
            <div className="text-[30px] font-mono font-medium tabular-nums leading-none tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
              <RollingCounter value={student.credit_balance || 0} />
            </div>
            <p className="text-[13px] text-[#78716C] dark:text-[#8A847A] mt-2.5">
              {pluralize(totalResumesCount || 0, 'tailored resume')} compiled
            </p>
          </Link>
        </section>

        {/* ── 4. Split Workstream: Active Applications (7 cols) vs Recommended Drives (5 cols) ── */}
        <section className="grid gap-5 lg:grid-cols-12">
          {/* Left Column: Active Applications */}
          <div className="lg:col-span-7 rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              <div>
                <h2 className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Active Applications
                </h2>
                <p className="text-[13px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                  Stage updates from visiting campus recruiters
                </p>
              </div>

              <Link
                href="/student/applications"
                className="text-[13px] font-medium text-[#115E59] dark:text-[#5EEAD4] hover:underline shrink-0"
              >
                View all {totalAppsCount || 0}
              </Link>
            </div>

            <div className="divide-y divide-[#1C1917]/[0.08] dark:divide-[#EFECE6]/[0.08] flex-1">
              {!recentApplications || recentApplications.length === 0 ? (
                <div className="px-6 py-12 text-center space-y-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#78716C] dark:text-[#8A847A] flex items-center justify-center mx-auto">
                    <FileText className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      No applications submitted yet
                    </p>
                    <p className="text-[13px] text-[#78716C] dark:text-[#8A847A] max-w-sm mx-auto">
                      Browse matching campus drives from corporate partners and apply in one click
                    </p>
                  </div>
                  <Link
                    href="/student/jobs"
                    className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-[13px] font-medium bg-gradient-to-b from-[#13857C] to-[#0C635C] hover:from-[#10736B] hover:to-[#0A554F] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.20)] transition-colors duration-150"
                  >
                    Explore campus jobs
                  </Link>
                </div>
              ) : (
                (recentApplications as RecentApplicationRow[]).map((app) => {
                  const job = (Array.isArray(app.jobs) ? app.jobs[0] : app.jobs) ?? ({} as Partial<DashboardJob>)
                  const status = app.status || 'applied'
                  const label = STAGE_LABELS[status] || status
                  const progress = getStageProgress(status)

                  return (
                    <div
                      key={app.id}
                      className="px-5 py-4 hover:bg-[#FAF8F5] dark:hover:bg-[#24221F]/60 transition-colors duration-150 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                            {job.title || 'Placement Drive'}
                            {job.company_name ? ` · ${job.company_name}` : ''}
                          </div>
                          <div className="text-[13px] text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                            {job.location || job.workplace_mode || 'Campus drive'} · Applied{' '}
                            {formatDate(app.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {job.compensation_ctc ? (
                            <span className="font-mono text-[13px] font-medium tabular-nums text-[#1C1917] dark:text-[#EFECE6]">
                              {formatCtc(job.compensation_ctc)}
                            </span>
                          ) : null}

                          <span
                            className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-0.5 rounded-md border ${
                              progress.isTerminal
                                ? 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 text-[#B91C1C] dark:text-[#FCA5A5] border-[#DC2626]/20'
                                : progress.isPositive
                                  ? 'bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] border-[#0F766E]/20 dark:border-[#14B8A6]/30'
                                  : 'bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                progress.isTerminal
                                  ? 'bg-[#DC2626] dark:bg-[#F87171]'
                                  : progress.isPositive
                                    ? 'bg-[#0F766E] dark:bg-[#2DD4BF]'
                                    : 'bg-[#78716C] dark:bg-[#8A847A]'
                              }`}
                            />
                            <span>{label}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-[#F3EFE9] dark:bg-[#24221F] overflow-hidden">
                          <div
                            style={{ width: `${progress.percent}%` }}
                            className={`h-full rounded-full ${
                              progress.isTerminal
                                ? 'bg-[#DC2626]/60 dark:bg-[#F87171]/60'
                                : progress.isPositive
                                  ? 'bg-gradient-to-r from-[#0F766E] to-[#10B981]'
                                  : 'bg-[#78716C]/45 dark:bg-[#8A847A]/45'
                            }`}
                          />
                        </div>
                        <span className="font-mono text-[12px] tabular-nums text-[#78716C] dark:text-[#8A847A] w-24 text-right shrink-0">
                          {progress.isTerminal ? 'Closed' : `Stage ${progress.step} of 4`}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Recommended Drives */}
          <div className="lg:col-span-5 rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              <div>
                <h2 className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Recommended Drives
                </h2>
                <p className="text-[13px] text-[#78716C] dark:text-[#8A847A] mt-0.5">
                  Filtered against your CGPA and upgrade floor
                </p>
              </div>

              <Link
                href="/student/jobs"
                className="text-[13px] font-medium text-[#115E59] dark:text-[#5EEAD4] hover:underline shrink-0"
              >
                Explore {totalJobsCount || 0}
              </Link>
            </div>

            <div className="divide-y divide-[#1C1917]/[0.08] dark:divide-[#EFECE6]/[0.08] flex-1">
              {!recentJobs || recentJobs.length === 0 ? (
                <div className="px-6 py-12 text-center space-y-3">
                  <div className="w-10 h-10 rounded-[10px] bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#78716C] dark:text-[#8A847A] flex items-center justify-center mx-auto">
                    <Briefcase className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      No active drives right now
                    </p>
                    <p className="text-[13px] text-[#78716C] dark:text-[#8A847A]">
                      New campus drives appear here as soon as your placement cell publishes them
                    </p>
                  </div>
                </div>
              ) : (
                (recentJobs as DashboardJob[]).map((job) => {
                  const ctc = Number(job.compensation_ctc)
                  const tierLabel = ctc >= 20 ? 'Super Dream' : ctc >= 10 ? 'Dream' : 'Core'
                  const hasApplied = appliedJobIdSet.has(job.id)
                  const isMultiplierGated = isPlaced && ctc < holdingCtc * upgradeMultiplier

                  return (
                    <div
                      key={job.id}
                      className="px-5 py-4 hover:bg-[#FAF8F5] dark:hover:bg-[#24221F]/60 transition-colors duration-150 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href="/student/jobs"
                            className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6] hover:text-[#0F766E] dark:hover:text-[#5EEAD4] transition-colors duration-150 truncate"
                          >
                            {job.title}
                          </Link>
                          <span className="text-[12px] text-[#78716C] dark:text-[#8A847A] shrink-0">
                            {tierLabel}
                          </span>
                        </div>
                        <div className="text-[13px] text-[#57534E] dark:text-[#ACA59A] mt-0.5 truncate">
                          {job.company_name || 'Corporate Partner'} ·{' '}
                          <span className="capitalize">{job.workplace_mode || 'On-site'}</span> ·{' '}
                          <span className="font-mono tabular-nums">{formatCtc(job.compensation_ctc)}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {hasApplied ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#ECFEFF] dark:bg-[#0F766E]/25 text-[#0F766E] dark:text-[#5EEAD4] border border-[#0F766E]/20 dark:border-[#14B8A6]/30">
                            <Check className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>Applied</span>
                          </span>
                        ) : isMultiplierGated ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#FEF3C7] dark:bg-[#B45309]/25 text-[#B45309] dark:text-[#FCD34D] border border-[#B45309]/20"
                            title={`Locked by ${upgradeMultiplier}× Multiplier Policy (< ₹${upgradeMinCtc} LPA)`}
                          >
                            <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
                            <span>{upgradeMultiplier}× Gated</span>
                          </span>
                        ) : (
                          <Link
                            href="/student/jobs"
                            className="inline-flex items-center text-[12px] font-medium px-2.5 py-1 rounded-md bg-[#ECFDF8] dark:bg-[#0F766E]/25 text-[#115E59] dark:text-[#5EEAD4] hover:bg-[#D1FAE5] dark:hover:bg-[#0F766E]/40 border border-[#0F766E]/20 dark:border-[#14B8A6]/30 transition-colors duration-150"
                          >
                            Eligible · Apply
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
