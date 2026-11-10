import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentJobsDirectory } from '@/components/StudentJobsDirectory'
import { JobDetailsData } from '@/components/JobDetailsModal'
import { CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react'

export default async function StudentJobsPage(props: {
  searchParams?: Promise<{
    page?: string
    q?: string
    workplace?: string
    employment?: string
  }>
}) {
  const searchParams = (await props.searchParams) || {}
  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 25
  const q = searchParams.q?.toLowerCase() || ''
  const workplace = searchParams.workplace || 'all'
  const employment = searchParams.employment || 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
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
    return <div className="p-8 text-zinc-400 font-mono text-sm">Error loading candidate profile.</div>
  }

  let accessStatus: 'active' | 'expired' | 'unpaid' = 'active'
  if (!student.access_end_date) {
    accessStatus = 'unpaid'
  } else if (new Date(student.access_end_date) < new Date()) {
    accessStatus = 'expired'
  }

  // Check if student has officially approved offers
  const { data: approvedOffers } = await supabase
    .from('student_offers')
    .select('compensation_ctc, company_name, job_role')
    .eq('student_id', student.id)
    .eq('status', 'approved')

  const isPlaced = (approvedOffers && approvedOffers.length > 0)
  const maxCurrentCtc = isPlaced ? Math.max(...approvedOffers.map(o => o.compensation_ctc || 0)) : 0
  const latestOffer = isPlaced ? approvedOffers[0] : null

  // Fetch applications for application limit checks
  const { data: applications } = await supabase
    .from('applications')
    .select('job_id, status')
    .eq('student_id', student.id)

  const appliedJobIds = applications?.map(app => app.job_id) || []
  const activeAppsCount = applications?.filter(a => !['rejected', 'withdrawn', 'closed', 'dropped'].includes(a.status)).length || 0
  const totalAppsCount = applications?.length || 0

  // Fetch policies
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', student.college_id)
    .maybeSingle()
    
  const config = policyDoc?.config || {}
  const upgradeConfig = config.upgrade || { enabled: false, min_multiplier: 1, max_allowed: 1 }
  const dreamConfig = config.dream || { enabled: false, min_ctc: 10, max_dream_attempts: 3 }
  const superDreamConfig = config.super_dream || { enabled: false, min_ctc: 20, max_attempts: 2 }

  const counters = student.policy_counters || {}

  // Fetch active and paused jobs with server-side pagination and filtering
  const { data: targetedJobs } = await supabase
    .from('job_target_colleges')
    .select('job_id')
    .eq('college_id', student.college_id)
  
  const targetedJobIds = targetedJobs?.map(t => t.job_id) || []
  let orQuery = `college_id.eq.${student.college_id},is_all_colleges.eq.true`
  if (targetedJobIds.length > 0) {
    orQuery += `,id.in.(${targetedJobIds.join(',')})`
  }

  let queryBuilder = supabase
    .from('jobs')
    .select(`
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
    `, { count: 'exact' })
    .in('status', ['active', 'paused'])
    .or(orQuery)

  if (q) {
    queryBuilder = queryBuilder.or(`title.ilike.%${q}%,company_name.ilike.%${q}%,job_location.ilike.%${q}%,skills_required.ilike.%${q}%,job_domain.ilike.%${q}%`)
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

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Placement Drives & Opportunities</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {totalItems} Available
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Discover verified campus and partner drives, inspect recruitment criteria, and submit direct applications.
          </p>
        </div>
      </div>

      {student.is_blacklisted && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0 stroke-[1.5]" />
          <div className="space-y-1 text-xs">
            <h3 className="font-semibold text-rose-900 dark:text-rose-200">Account Under Placement Suspension</h3>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your profile is currently restricted from submitting new drive applications. Please contact your college placement administrator for review.
            </p>
          </div>
        </div>
      )}

      {isPlaced && !student.is_blacklisted && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0 stroke-[1.5]" />
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-300">
              <span>1-Offer Policy Active — Officially Placed Candidate</span>
              <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                Upgrade Path Unlocked
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You hold an approved placement offer at <strong className="text-zinc-900 dark:text-zinc-200">{latestOffer?.company_name}</strong> (₹{maxCurrentCtc} LPA). Standard tier drives are locked. You may apply only for configured Dream or Super Dream tier upgrades.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              {superDreamConfig.enabled && (
                <span>Super Dream (&ge; ₹{superDreamConfig.min_ctc} LPA): <strong className="text-zinc-900 dark:text-zinc-200">{counters.super_dream_attempts || 0} / {superDreamConfig.max_attempts || 2}</strong> used</span>
              )}
              {dreamConfig.enabled && (
                <span>Dream (&ge; ₹{dreamConfig.min_ctc} LPA): <strong className="text-zinc-900 dark:text-zinc-200">{counters.dream_attempts || 0} / {dreamConfig.max_dream_attempts || 3}</strong> used</span>
              )}
              {upgradeConfig.enabled && (
                <span>Multiplier: <strong className="text-zinc-900 dark:text-zinc-200">{upgradeConfig.min_multiplier}×</strong> minimum CTC required</span>
              )}
            </div>
          </div>
        </div>
      )}

      <StudentJobsDirectory
        jobs={(jobs || []) as JobDetailsData[]}
        appliedJobIds={appliedJobIds}
        isBlacklisted={Boolean(student.is_blacklisted)}
        isPlaced={Boolean(isPlaced)}
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
      />
    </div>
  )
}
