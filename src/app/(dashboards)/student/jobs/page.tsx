import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentJobsDirectory } from '@/components/StudentJobsDirectory'
import { JobDetailsData } from '@/components/JobDetailsModal'

export default async function StudentJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's college_id and blacklist status
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id, is_blacklisted, policy_counters')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading student profile.</div>
  }

  // Check if student has officially approved offers in student_offers
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

  // Fetch active and paused jobs with extended job board fields
  const { data: jobs } = await supabase
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
      custom_stages
    `)
    .in('status', ['active', 'paused'])
    .or(`college_id.is.null,college_id.eq.${student.college_id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Placement Drives &amp; Opportunities</h1>
        <p className="text-zinc-500 mt-1">Discover campus and global placement opportunities, explore job details, and track application windows.</p>
      </div>

      {student.is_blacklisted && (
        <div className="bg-red-50 text-red-900 border border-red-200 p-4 rounded-md">
          <h3 className="font-semibold">Account Suspended</h3>
          <p className="text-sm mt-1">You are currently blacklisted from applying to jobs. Please contact your college administrator.</p>
        </div>
      )}

      {isPlaced && !student.is_blacklisted && (
        <div className="bg-emerald-50 text-emerald-950 border border-emerald-200 p-4 rounded-md">
          <h3 className="font-semibold text-emerald-900">1-Offer Policy Active — Officially Placed</h3>
          <p className="text-sm mt-1 text-emerald-800">
            You hold an approved placement offer at <strong>{latestOffer?.company_name}</strong> (₹{maxCurrentCtc} LPA). 
            Regular campus placement drives are locked.
          </p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-emerald-800">
            {superDreamConfig.enabled && (
              <span>• Super Dream (&ge; ₹{superDreamConfig.min_ctc} LPA): {counters.super_dream_attempts || 0} / {superDreamConfig.max_attempts || 2} attempts used</span>
            )}
            {dreamConfig.enabled && (
              <span>• Dream (&ge; ₹{dreamConfig.min_ctc} LPA): {counters.dream_attempts || 0} / {dreamConfig.max_dream_attempts || 3} attempts used</span>
            )}
            {upgradeConfig.enabled && (
              <span>• Upgrades: {counters.upgrades_used || 0} / {upgradeConfig.max_allowed || 1} used (Min: {upgradeConfig.min_multiplier}x)</span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Directory with Search, Filters, and Widescreen Cards */}
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
      />
    </div>
  )
}
