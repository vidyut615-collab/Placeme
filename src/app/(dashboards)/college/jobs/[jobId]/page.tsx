import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Globe2 } from 'lucide-react'
import { JobApplicationsManager } from '@/components/JobApplicationsManager'

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
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    redirect('/login')
  }

  // Fetch the job details
  const { data: job, error: jobError } = await supabase
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
    .single()

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

  // Fetch all applications for this job
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      students (
        id,
        user_id,
        profile_data
      )
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'application', label: 'Application' },
    { id: 'screened', label: 'Screened' },
    { id: 'ppt', label: 'PPT' },
    { id: 'stage1', label: 'Stage 1' },
    { id: 'stage2', label: 'Stage 2' },
    { id: 'stage3', label: 'Stage 3' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'hired', label: 'Hired' },
    { id: 'dropped', label: 'Dropped' }
  ]

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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-zinc-500">
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
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {job.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-paper dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-8 pt-2">
        <nav className="flex w-full" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Link
                key={tab.id}
                href={`/college/jobs/${jobId}?tab=${tab.id}`}
                className={`flex-1 text-center py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                  isActive 
                    ? 'border-ink text-ink dark:border-white dark:text-white' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-8 flex-1">
        {activeTab === 'overview' && (
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
                <h3 className="text-lg font-medium mb-4">Details</h3>
                <dl className="space-y-4 text-sm">
                  {job.company_name && (
                    <div>
                      <dt className="text-zinc-500">Company</dt>
                      <dd className="font-medium text-base">{job.company_name}</dd>
                    </div>
                  )}
                  {job.application_deadline && (
                    <div>
                      <dt className="text-zinc-500">Deadline</dt>
                      <dd className="font-medium text-red-600 dark:text-red-400">
                        {new Date(job.application_deadline).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </dd>
                    </div>
                  )}
                  {job.compensation_ctc && (
                    <div>
                      <dt className="text-zinc-500">CTC</dt>
                      <dd className="font-medium text-base">₹{job.compensation_ctc.toLocaleString()}</dd>
                    </div>
                  )}
                  {(job.compensation_fixed || job.compensation_variable) && (
                    <div className="flex gap-6">
                      {job.compensation_fixed && (
                        <div>
                          <dt className="text-zinc-500 text-xs uppercase tracking-wider">Fixed</dt>
                          <dd className="font-medium">₹{job.compensation_fixed.toLocaleString()}</dd>
                        </div>
                      )}
                      {job.compensation_variable && (
                        <div>
                          <dt className="text-zinc-500 text-xs uppercase tracking-wider">Variable</dt>
                          <dd className="font-medium">₹{job.compensation_variable.toLocaleString()}</dd>
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
                <h3 className="text-lg font-medium mb-4">Classification</h3>
                <div className="flex flex-wrap gap-2">
                  {job.job_types?.name && (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      Type: {job.job_types.name}
                    </span>
                  )}
                  {job.placement_levels?.name && (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      Level: {job.placement_levels.name}
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
        )}

        {activeTab === 'application' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Applications ({applications?.length || 0})</h2>
              <p className="text-sm text-zinc-500">Students who have applied to this job.</p>
            </div>
            {/* Show all for now until we filter by specific status */}
            <JobApplicationsManager applications={(applications as any) || []} />
          </div>
        )}

        {/* Placeholders for other tabs */}
        {['screened', 'ppt', 'stage1', 'stage2', 'stage3', 'shortlisted', 'hired', 'dropped'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="bg-zinc-100 dark:bg-zinc-800 h-12 w-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-zinc-500 dark:text-zinc-400 text-lg font-bold">{tabs.find(t => t.id === activeTab)?.label.charAt(0)}</span>
            </div>
            <h3 className="text-lg font-medium">No candidates in {tabs.find(t => t.id === activeTab)?.label}</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm">
              We are waiting for the specific design and data implementation for this stage.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
