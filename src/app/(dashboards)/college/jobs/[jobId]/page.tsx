import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Globe2, Ban, CheckCircle2, MapPin, Briefcase, IndianRupee, ShieldCheck, FileText } from 'lucide-react'
import { JobPipelineManager } from '@/components/JobPipelineManager'
import { EditJobModal } from '@/components/EditJobModal'
import { CancelJobModal } from '@/components/CancelJobModal'
import { CompleteJobModal } from '@/components/CompleteJobModal'
import { PauseResumeJobButton } from '@/components/PauseResumeJobButton'
import { getJobDisplayStatus } from '@/lib/job-status-helper'
import { fetchEligibleNonApplicants } from '@/lib/non-applicants-helper'
import { EligibleNonApplicantsManager } from '@/components/EligibleNonApplicantsManager'
import { formatDate } from '@/lib/utils'

export default async function CollegeJobDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ jobId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { jobId } = await params
  const resolvedSearchParams = await searchParams
  const activeTab = typeof resolvedSearchParams.tab === 'string' ? resolvedSearchParams.tab : 'overview'
  const subView = typeof resolvedSearchParams.subview === 'string' ? resolvedSearchParams.subview : 'applicants'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    redirect('/login')
  }

  // Fetch the job details, classifications, and applications in parallel
  const [
    { data: job, error: jobError },
    { data: jobTypes },
    { data: placementLevels },
    { data: placementCategories },
    { data: placementCycles },
    { data: collegeData },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select(`
        *,
        colleges(name),
        job_types(name),
        placement_levels(name),
        placement_categories(name),
        placement_cycles(name)
      `)
      .eq('id', jobId)
      .single(),
    supabase.from('job_types').select('id, name').order('name'),
    supabase.from('placement_levels').select('id, name, is_dream, is_super_dream').order('rank'),
    supabase.from('placement_categories').select('id, name').order('name'),
    supabase.from('placement_cycles').select('id, name, is_active').order('start_date', { ascending: false }),
    user.app_metadata.college_id
      ? supabase.from('colleges').select('onboarding_fields').eq('id', user.app_metadata.college_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (jobError || !job) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Job Not Found</h1>
        <p className="text-zinc-500 mt-2">The job may not exist or you do not have permission to view it.</p>
        <Link href="/college/jobs" className="text-blue-600 hover:underline mt-4 inline-block">
          &larr; Back to Jobs
        </Link>
      </div>
    )
  }

  // Fetch eligible non-applicants for this job (only for college-posted jobs)
  const collegeId = user.app_metadata.college_id
  const isCollegeJob = Boolean(job.college_id && collegeId && job.college_id === collegeId)
  const nonApplicants = collegeId && isCollegeJob ? await fetchEligibleNonApplicants(supabase, jobId, collegeId) : []

  // Fetch all applications for this job including student profile and auth email
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      updated_at,
      is_withdrawn,
      withdrawal_reason,
      dropped_reason,
      students (
        id,
        user_id,
        profile_data,
        users (
          email
        )
      )
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  // Custom stage labels from job config
  const customStages = (job.custom_stages || {}) as Record<string, string>
  const stage1Name = customStages.stage_1 || customStages.stage_1_label || 'Stage 1'
  const stage2Name = customStages.stage_2 || customStages.stage_2_label || 'Stage 2'
  const stage3Name = customStages.stage_3 || customStages.stage_3_label || 'Stage 3'

  // Map database status to tab IDs
  const tabToDbStatuses: Record<string, string[]> = {
    application: ['applied'],
    screened: ['screened'],
    ppt: ['ppt'],
    stage1: ['stage1'],
    stage2: ['stage2'],
    stage3: ['stage3'],
    shortlisted: ['shortlisted'],
    hired: ['hired'],
    closed: ['dropped', 'rejected', 'withdrawn', 'forfeited'],
  }

  const stageToDbStatus: Record<string, string> = {
    application: 'applied',
    screened: 'screened',
    ppt: 'ppt',
    stage1: 'stage1',
    stage2: 'stage2',
    stage3: 'stage3',
    shortlisted: 'shortlisted',
    hired: 'hired',
    closed: 'dropped',
  }

  // Format applications with clean email access
  const formattedApplications = (applications || []).map(app => {
    const rawStudent = Array.isArray(app.students) ? app.students[0] : app.students
    const student = rawStudent as any
    const rawUsers = student?.users
    const userEmail = Array.isArray(rawUsers) ? rawUsers[0]?.email : rawUsers?.email

    return {
      id: app.id,
      status: app.status,
      created_at: app.created_at,
      updated_at: app.updated_at,
      is_withdrawn: app.is_withdrawn,
      withdrawal_reason: app.withdrawal_reason,
      dropped_reason: app.dropped_reason,
      students: student ? {
        id: student.id,
        user_id: student.user_id,
        profile_data: student.profile_data,
        user_email: userEmail || 
          student.profile_data?.personal?.email || 
          student.profile_data?.email || 
          ''
      } : null
    }
  })

  // Compute live counts per pipeline stage
  const counts: Record<string, number> = {
    application: 0,
    screened: 0,
    ppt: 0,
    stage1: 0,
    stage2: 0,
    stage3: 0,
    shortlisted: 0,
    hired: 0,
    closed: 0,
  }

  formattedApplications.forEach(app => {
    if (app.status === 'applied') counts.application++
    else if (app.status === 'screened') counts.screened++
    else if (app.status === 'ppt') counts.ppt++
    else if (app.status === 'stage1') counts.stage1++
    else if (app.status === 'stage2') counts.stage2++
    else if (app.status === 'stage3') counts.stage3++
    else if (app.status === 'shortlisted') counts.shortlisted++
    else if (app.status === 'hired') counts.hired++
    else if (['dropped', 'rejected', 'withdrawn', 'forfeited'].includes(app.status)) counts.closed++
  })

  // Full tabs list with dynamic round names and live counts
  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'application', label: 'Application', count: counts.application },
    { id: 'screened', label: 'Screened', count: counts.screened },
    { id: 'ppt', label: 'PPT', count: counts.ppt },
    { id: 'stage1', label: stage1Name, count: counts.stage1 },
    { id: 'stage2', label: stage2Name, count: counts.stage2 },
    { id: 'stage3', label: stage3Name, count: counts.stage3 },
    { id: 'shortlisted', label: 'Shortlisted', count: counts.shortlisted },
    { id: 'hired', label: 'Hired', count: counts.hired },
    { id: 'closed', label: 'Closed', count: counts.closed }
  ]

  // Stage options for target advancement dropdowns
  const stageOptions = [
    { id: 'applied', label: 'Application' },
    { id: 'screened', label: 'Screened' },
    { id: 'ppt', label: 'PPT' },
    { id: 'stage1', label: stage1Name },
    { id: 'stage2', label: stage2Name },
    { id: 'stage3', label: stage3Name },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'hired', label: 'Hired' },
    { id: 'dropped', label: 'Closed' }
  ]

  // Candidates belonging to the currently active tab
  const currentStageApps = formattedApplications.filter(app => {
    const allowedStatuses = tabToDbStatuses[activeTab] || []
    return allowedStatuses.includes(app.status)
  })

  const currentTabObj = tabs.find(t => t.id === activeTab)

  return (
    <div className="flex flex-1 flex-col relative h-full">
      {/* Header Area */}
      <div className="p-8 pb-4">
        <Link 
          href="/college/jobs" 
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to all jobs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              {job.status === 'cancelled' && (
                <span className="inline-flex items-center rounded-md bg-red-100 dark:bg-red-950/50 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300 border border-red-300 dark:border-red-900">
                  Drive Cancelled
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-zinc-500">
              {job.company_name && (
                <>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{job.company_name}</span>
                  <span>&bull;</span>
                </>
              )}
              {job.college_id ? (
                <>
                  <Building2 className="h-4 w-4" />
                  <span>Local Placement (Your College)</span>
                </>
              ) : (
                <>
                  <Globe2 className="h-4 w-4" />
                  <span>Global Placement (Agency)</span>
                </>
              )}
              <span>&bull;</span>
              {(() => {
                const displayStatus = getJobDisplayStatus(job)
                return (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${displayStatus.badgeColor}`}>
                    {displayStatus.label}
                  </span>
                )
              })()}
            </div>

            {/* Extended Job Board Info Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                <MapPin className="h-3 w-3 text-red-500" />
                {job.job_location || 'Pan-India'} ({job.workplace_mode || 'On-Site'})
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-medium">
                <Briefcase className="h-3 w-3" />
                {job.employment_type || 'Full-time'}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900 font-semibold">
                <IndianRupee className="h-3 w-3" />
                {job.employment_type === 'Internship' ? (
                  job.internship_stipend ? `₹${Number(job.internship_stipend).toLocaleString('en-IN')}/mo Stipend` : 'Stipend in JD'
                ) : job.employment_type === 'Intern+PPO' ? (
                  `₹${job.internship_stipend ? Number(job.internship_stipend).toLocaleString('en-IN') : 0}/mo → ₹${job.compensation_ctc || 0} LPA (PPO)`
                ) : (
                  job.compensation_ctc ? `₹${job.compensation_ctc} LPA` : 'CTC in JD'
                )}
              </span>

              {job.has_bond ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-medium">
                  <ShieldCheck className="h-3 w-3 text-amber-600" />
                  Bond: {job.bond_duration || 'Yes'} {job.bond_penalty_amount ? `(₹${Number(job.bond_penalty_amount).toLocaleString('en-IN')})` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-medium">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  No Bond
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900 font-medium">
                {job.drive_mode || 'Virtual / Online'}
              </span>

              {job.jd_attachment_url && (
                <a
                  href={job.jd_attachment_url}
                  download={job.jd_attachment_name || 'Official_JD.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium hover:opacity-90 transition-opacity"
                >
                  <FileText className="h-3 w-3" />
                  Download JD (PDF)
                </a>
              )}
            </div>
          </div>

          {/* Action buttons: Pause/Resume, Edit, Complete, Cancel (ONLY for college-posted jobs) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isCollegeJob ? (
              job.status !== 'cancelled' && job.status !== 'completed' && (
                <>
                  <PauseResumeJobButton
                    jobId={job.id}
                    isPaused={job.status === 'paused'}
                  />
                  <EditJobModal
                    job={job}
                    applicantCount={formattedApplications.length}
                    jobTypes={jobTypes || []}
                    placementLevels={placementLevels || []}
                    placementCategories={placementCategories || []}
                    placementCycles={placementCycles || []}
                    academicFields={collegeData?.onboarding_fields || { departments: [], types: [], years: [] }}
                  />
                  <CompleteJobModal
                    jobId={job.id}
                    jobTitle={job.title}
                  />
                  <CancelJobModal
                    jobId={job.id}
                    jobTitle={job.title}
                    companyName={job.company_name}
                    applicantCount={formattedApplications.length}
                  />
                </>
              )
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold shadow-xs">
                <Globe2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>Global Opportunity (Managed by Platform Agency)</span>
              </div>
            )}
          </div>
        </div>

        {/* Completed Notice Banner */}
        {job.status === 'completed' && (
          <div className="mt-4 p-4 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Recruitment Drive Completed &amp; Finalized</div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5" suppressHydrationWarning>
                  Concluded on: {formatDate(job.completed_at)}. 
                  All hiring outcomes have been locked in and finalized.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Notice Banner */}
        {job.status === 'cancelled' && (
          <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/60 text-red-900 dark:text-red-200">
            <div className="flex items-start gap-2.5">
              <Ban className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Recruitment Drive Cancelled / Scrapped</div>
                <p className="text-xs text-red-800 dark:text-red-300 mt-0.5">
                  Reason: {job.cancellation_reason || 'Drive was cancelled by college administration.'}
                </p>
                <p className="text-[11px] text-zinc-500 mt-1" suppressHydrationWarning>
                  Cancelled on: {formatDate(job.cancelled_at)}. All candidate applications have been marked as cancelled with zero penalty strikes, and candidate application quotas have been refunded.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Tabs with Live Count Badges */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 lg:px-8 pt-2">
        <nav className="flex w-full items-center overflow-x-auto no-scrollbar" aria-label="Pipeline Stages">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                href={`/college/jobs/${jobId}?tab=${tab.id}`}
                title={tab.label}
                className={`flex-1 min-w-[75px] sm:min-w-[85px] max-w-full py-3 px-1.5 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 overflow-hidden ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-300'
                }`}
              >
                <span className="truncate min-w-0">{tab.label}</span>
                {tab.count !== null && (
                  <span className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Tab Content Area */}
      <div className="p-8 flex-1">
        {activeTab === 'overview' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Job Description</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {job.description || "No description provided."}
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Drive Details</h3>
                <dl className="space-y-4 text-sm">
                  {job.company_name && (
                    <div>
                      <dt className="text-zinc-500">Company</dt>
                      <dd className="font-medium text-base">{job.company_name}</dd>
                    </div>
                  )}
                  {job.application_deadline && (
                    <div>
                      <dt className="text-zinc-500">Application Deadline</dt>
                      <dd className="font-medium text-red-600 dark:text-red-400" suppressHydrationWarning>
                        {formatDate(job.application_deadline)}
                      </dd>
                    </div>
                  )}
                  {job.compensation_ctc && (
                    <div>
                      <dt className="text-zinc-500">Total CTC</dt>
                      <dd className="font-medium text-base">₹{job.compensation_ctc.toLocaleString()} LPA</dd>
                    </div>
                  )}
                  {(job.compensation_fixed || job.compensation_variable) && (
                    <div className="flex gap-6">
                      {job.compensation_fixed && (
                        <div>
                          <dt className="text-zinc-500 text-xs uppercase tracking-wider">Fixed Base</dt>
                          <dd className="font-medium">₹{job.compensation_fixed.toLocaleString()} LPA</dd>
                        </div>
                      )}
                      {job.compensation_variable && (
                        <div>
                          <dt className="text-zinc-500 text-xs uppercase tracking-wider">Variable</dt>
                          <dd className="font-medium">₹{job.compensation_variable.toLocaleString()} LPA</dd>
                        </div>
                      )}
                    </div>
                  )}
                </dl>
                {(!job.company_name && !job.application_deadline && !job.compensation_ctc) && (
                  <p className="text-sm text-zinc-500 italic">No additional details provided.</p>
                )}
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Placement Classification</h3>
                <div className="flex flex-wrap gap-2">
                  {job.job_types?.name && (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      Type: {job.job_types.name}
                    </span>
                  )}
                  {job.placement_levels?.name && (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      Tier: {job.placement_levels.name}
                    </span>
                  )}
                  {job.placement_categories?.name && (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      Category: {job.placement_categories.name}
                    </span>
                  )}
                  {job.placement_cycles?.name && (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      Cycle: {job.placement_cycles.name}
                    </span>
                  )}
                  {(!job.job_types && !job.placement_levels && !job.placement_categories && !job.placement_cycles) && (
                    <span className="text-sm text-zinc-500 italic">No classifications assigned.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {currentTabObj?.label} ({activeTab === 'application' && subView === 'non_applicants' ? nonApplicants.length : currentStageApps.length})
              </h2>
              <p className="text-sm text-zinc-500">
                {activeTab === 'application' && (subView === 'non_applicants' ? 'Academically eligible students who have not applied for this drive.' : 'Eligible students who applied for this drive.')}
                {activeTab === 'screened' && 'Candidates screened and cleared by college for the recruitment drive.'}
                {activeTab === 'ppt' && 'Candidates participating in the Pre-Placement Talk / Company Briefing.'}
                {activeTab === 'stage1' && `Candidates participating in ${stage1Name}.`}
                {activeTab === 'stage2' && `Candidates who progressed to ${stage2Name}.`}
                {activeTab === 'stage3' && `Candidates who advanced to ${stage3Name}.`}
                {activeTab === 'shortlisted' && 'Candidates selected by the recruiter for final hiring.'}
                {activeTab === 'hired' && 'Candidates recorded as hired for this drive.'}
                {activeTab === 'closed' && 'Students who self-withdrew or were dropped during this drive.'}
              </p>
            </div>

            {/* Secondary Sub-tab Bar inside Application stage (only for college local jobs) */}
            {activeTab === 'application' && isCollegeJob && (
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-2">
                <Link
                  href={`/college/jobs/${jobId}?tab=application&subview=applicants`}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    subView !== 'non_applicants'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Applied Candidates</span>
                  <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-1.5 py-0.2 text-[10px] font-bold">
                    {counts.application}
                  </span>
                </Link>

                <Link
                  href={`/college/jobs/${jobId}?tab=application&subview=non_applicants`}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    subView === 'non_applicants'
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Eligible Non-Applicants</span>
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
                    {nonApplicants.length}
                  </span>
                </Link>
              </div>
            )}

            {activeTab === 'application' && subView === 'non_applicants' ? (
              <EligibleNonApplicantsManager
                jobId={jobId}
                jobTitle={job.title}
                isDeadlinePassed={Boolean(job.application_deadline && new Date().getTime() > new Date(job.application_deadline).getTime())}
                nonApplicants={nonApplicants}
              />
            ) : (
              <JobPipelineManager
                jobId={jobId}
                jobTitle={job.title}
                currentStageId={activeTab === 'closed' ? 'dropped' : (stageToDbStatus[activeTab] || activeTab)}
                currentStageLabel={currentTabObj?.label || 'Stage'}
                applications={currentStageApps as any}
                stageOptions={stageOptions}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
