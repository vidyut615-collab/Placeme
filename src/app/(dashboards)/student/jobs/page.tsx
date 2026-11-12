import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentJobsDirectory } from '@/components/StudentJobsDirectory'
import { JobDetailsData } from '@/components/JobDetailsModal'
import { AlertTriangle, Award } from 'lucide-react'
import { DeclareHiredModal } from '@/components/DeclareHiredModal'

interface PolicyConfig {
  upgrade?: {
    enabled?: boolean
    min_multiplier?: number
    min_increment_pct?: number
    max_allowed?: number
    max_upgrade_attempts?: number
  }
  dream?: {
    enabled?: boolean
    min_ctc?: number
    max_dream_attempts?: number
  }
  super_dream?: {
    enabled?: boolean
    min_ctc?: number
    max_attempts?: number
  }
  offer_limit?: {
    enabled?: boolean
    max_offers_total?: number
  }
  application_limit?: {
    enabled?: boolean
    max_active?: number
    max_total?: number
  }
}

export default async function StudentJobsPage(props: {
  searchParams?: Promise<{
    page?: string
    q?: string
    workplace?: string
    employment?: string
    job?: string
  }>
}) {
  const searchParams = (await props.searchParams) || {}
  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 25
  const q = searchParams.q?.toLowerCase() || ''
  const workplace = searchParams.workplace || 'all'
  const employment = searchParams.employment || 'all'
  const initialJobId = searchParams.job || undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's college_id, blacklist status, and access status
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id, is_blacklisted, policy_counters, access_end_date')
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

  let accessStatus: 'active' | 'expired' | 'unpaid' = 'active'
  if (!student.access_end_date) {
    accessStatus = 'unpaid'
  } else if (new Date(student.access_end_date) < new Date()) {
    accessStatus = 'expired'
  }

  // Fetch student declared placement offers
  const { data: offers } = await supabase
    .from('student_offers')
    .select('id, status, compensation_ctc, company_name, job_role, offer_type, offer_letter_url, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const approvedOffers = offers?.filter((o) => o.status === 'approved') || []
  const pendingOffer = offers?.find((o) => o.status === 'pending') || null
  const approvedOffer = approvedOffers[0] || null

  const isPlaced = approvedOffers.length > 0
  const maxCurrentCtc = isPlaced
    ? Math.max(...approvedOffers.map((o) => Number(o.compensation_ctc) || 0))
    : 0
  const latestOffer = approvedOffer

  // Fetch applications for application limit checks
  const { data: applications } = await supabase
    .from('applications')
    .select('id, job_id, status, jobs(title, company_name, compensation_ctc)')
    .eq('student_id', student.id)

  const appliedJobIds = applications?.map((app) => app.job_id) || []
  const activeAppsCount =
    applications?.filter((a) => !['rejected', 'withdrawn', 'closed', 'dropped'].includes(a.status))
      .length || 0
  const totalAppsCount = applications?.length || 0

  const appliedJobsSummary = (applications || []).map((app) => ({
    id: app.id,
    job_id: app.job_id,
    jobs: Array.isArray(app.jobs) ? app.jobs[0] : app.jobs,
  }))

  // Fetch policies
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', student.college_id)
    .maybeSingle()

  const config = (policyDoc?.config as PolicyConfig | null) || {}
  const upgradeConfig = config.upgrade || { enabled: false, min_multiplier: 1.5, max_allowed: 1 }
  const dreamConfig = config.dream || { enabled: false, min_ctc: 10, max_dream_attempts: 3 }
  const superDreamConfig = config.super_dream || { enabled: false, min_ctc: 20, max_attempts: 2 }

  const counters = (student.policy_counters as Record<string, number> | null) || {}

  // Fetch active and paused jobs with server-side pagination and filtering
  const { data: targetedJobs } = await supabase
    .from('job_target_colleges')
    .select('job_id')
    .eq('college_id', student.college_id)

  const targetedJobIds = targetedJobs?.map((t) => t.job_id) || []
  let orQuery = `college_id.eq.${student.college_id},is_all_colleges.eq.true`
  if (targetedJobIds.length > 0) {
    orQuery += `,id.in.(${targetedJobIds.join(',')})`
  }

  let queryBuilder = supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      company_name,
      description,
      college_id,
      created_at,
      compensation_ctc,
      compensation_fixed,
      compensation_variable,
      application_deadline,
      status,
      workplace_mode,
      job_location,
      employment_type,
      internship_stipend,
      internship_duration,
      has_bond,
      bond_duration,
      bond_penalty_amount,
      job_domain,
      skills_required,
      drive_mode,
      jd_attachment_url,
      jd_attachment_name,
      eligibility_criteria,
      custom_stages,
      ideal_for
    `,
      { count: 'exact' }
    )
    .in('status', ['active', 'paused'])
    .or(orQuery)

  if (q) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${q}%,company_name.ilike.%${q}%,job_location.ilike.%${q}%,skills_required.ilike.%${q}%,job_domain.ilike.%${q}%`
    )
  }

  if (workplace !== 'all') {
    queryBuilder = queryBuilder.eq('workplace_mode', workplace)
  }

  if (employment !== 'all') {
    queryBuilder = queryBuilder.eq('employment_type', employment)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: jobs, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  const upgradeMultiplier = upgradeConfig.min_increment_pct
    ? 1 + upgradeConfig.min_increment_pct / 100
    : upgradeConfig.min_multiplier || 1.5

  return (
    <div className="min-h-full w-full min-w-0 bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6]">
      <div className="max-w-7xl mx-auto w-full min-w-0 px-6 py-7 md:px-8 md:py-8 space-y-6">
        {/* ── 1. Page Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-medium tracking-[-0.02em] leading-[1.15] text-[#1C1917] dark:text-[#EFECE6]">
                Campus Jobs
              </h1>
              <span className="font-mono text-[12px] tabular-nums px-2.5 py-0.5 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                {totalItems} open
              </span>
            </div>
            <p className="text-[14px] text-[#57534E] dark:text-[#ACA59A] mt-1">
              Review verified campus and partner drives, check policy eligibility, and apply directly
            </p>
          </div>

          <div className="shrink-0">
            <DeclareHiredModal
              appliedJobs={appliedJobsSummary}
              hasPendingOffer={Boolean(pendingOffer)}
              pendingOfferDetails={
                pendingOffer
                  ? {
                      company_name: pendingOffer.company_name,
                      job_role: pendingOffer.job_role,
                      compensation_ctc: pendingOffer.compensation_ctc,
                      offer_type: pendingOffer.offer_type,
                      offer_letter_url: pendingOffer.offer_letter_url,
                      created_at: pendingOffer.created_at,
                    }
                  : null
              }
              approvedOfferDetails={
                approvedOffer
                  ? {
                      company_name: approvedOffer.company_name,
                      job_role: approvedOffer.job_role,
                      compensation_ctc: Number(approvedOffer.compensation_ctc),
                    }
                  : null
              }
            />
          </div>
        </header>

        {/* ── 2. Standing Banner (Suspended or Placed Upgrade Gate) ── */}
        {student.is_blacklisted ? (
          <section className="rounded-[14px] border border-[#DC2626]/25 bg-gradient-to-br from-[#DC2626]/[0.06] via-transparent to-white dark:from-[#DC2626]/[0.14] dark:to-[#191816] px-5 py-4 flex items-start gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="w-10 h-10 rounded-[10px] bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#DC2626]/20 text-[#DC2626] dark:text-[#F87171] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                Placement access paused
              </h2>
              <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                Your profile is currently restricted from submitting new drive applications. Contact your college placement cell for review.
              </p>
            </div>
          </section>
        ) : isPlaced ? (
          <section className="rounded-[14px] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-gradient-to-br from-[#0F766E]/[0.07] via-[#10B981]/[0.03] to-white dark:from-[#0F766E]/[0.18] dark:via-[#10B981]/[0.06] dark:to-[#191816] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF8] dark:bg-[#0F766E]/25 border border-[#0F766E]/20 dark:border-[#14B8A6]/30 text-[#115E59] dark:text-[#5EEAD4] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Placed candidate · {latestOffer?.company_name}
                  </span>
                  <span className="font-mono text-[12px] font-medium tabular-nums px-2 py-0.5 rounded-md bg-[#ECFEFF] dark:bg-[#0F766E]/30 text-[#0F766E] dark:text-[#5EEAD4] border border-[#0F766E]/20 dark:border-[#14B8A6]/30">
                    ₹{maxCurrentCtc.toFixed(1)} LPA
                  </span>
                </div>
                <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                  Standard drives are locked under your 1-offer policy — eligible dream and upgrade roles remain open
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:pl-5 md:border-l border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] font-mono text-[12px] tabular-nums text-[#57534E] dark:text-[#ACA59A] shrink-0">
              {superDreamConfig.enabled && (
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block">
                    Super Dream (≥ ₹{superDreamConfig.min_ctc} LPA)
                  </span>
                  <span className="text-[#115E59] dark:text-[#5EEAD4] font-medium">
                    {counters.super_dream_attempts || 0} / {superDreamConfig.max_attempts || 2} used
                  </span>
                </div>
              )}
              {dreamConfig.enabled && (
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block">
                    Dream (≥ ₹{dreamConfig.min_ctc} LPA)
                  </span>
                  <span className="text-[#115E59] dark:text-[#5EEAD4] font-medium">
                    {counters.dream_attempts || 0} / {dreamConfig.max_dream_attempts || 3} used
                  </span>
                </div>
              )}
              {upgradeConfig.enabled && (
                <div>
                  <span className="text-[#78716C] dark:text-[#8A847A] block">Upgrade floor</span>
                  <span className="text-[#115E59] dark:text-[#5EEAD4] font-medium">
                    ≥ ₹{(maxCurrentCtc * upgradeMultiplier).toFixed(1)} LPA
                  </span>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {/* ── 3. Interactive Jobs Directory & Slide-Over Flow ── */}
        <StudentJobsDirectory
          jobs={(jobs || []) as JobDetailsData[]}
          appliedJobIds={appliedJobIds}
          isBlacklisted={Boolean(student.is_blacklisted)}
          isPlaced={isPlaced}
          maxCurrentCtc={maxCurrentCtc}
          activeAppsCount={activeAppsCount}
          totalAppsCount={totalAppsCount}
          config={config}
          counters={counters}
          accessStatus={accessStatus}
          totalItems={totalItems}
          totalPages={totalPages}
          currentPage={page}
          pageSize={pageSize}
          searchQuery={q}
          activeWorkplace={workplace}
          activeEmployment={employment}
          initialJobId={initialJobId}
        />
      </div>
    </div>
  )
}
