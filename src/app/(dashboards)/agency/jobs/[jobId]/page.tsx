import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Globe2, MapPin, Briefcase, IndianRupee, ShieldCheck, FileText } from 'lucide-react'
import { JobApplicationsManager } from '@/components/JobApplicationsManager'
import { getJobDisplayStatus } from '@/lib/job-status-helper'

export default async function AgencyJobDetailsPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    redirect('/login')
  }

  // Fetch the job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*, colleges(name)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Job Not Found</h1>
        <Link href="/agency/jobs" className="text-blue-600 hover:underline mt-4 inline-block">
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

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6">
      <div>
        <Link 
          href="/agency/jobs" 
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to all jobs
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-zinc-500 text-sm">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {job.company_name || 'Employer Confidential'}
              </span>
              {job.job_domain && (
                <>
                  <span>&bull;</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">{job.job_domain}</span>
                </>
              )}
              <span>&bull;</span>
              {job.college_id ? (
                <>
                  <Building2 className="h-4 w-4" />
                  <span>College Exclusive ({job.colleges?.name})</span>
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
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-md border p-6 shadow-sm">
        <h3 className="text-lg font-medium mb-2">Job Description</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
          {job.description}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Applications ({applications?.length || 0})</h2>
          <p className="text-sm text-zinc-500">Review and update the status of students who applied to this job.</p>
        </div>
        <JobApplicationsManager applications={(applications as any) || []} />
      </div>
    </div>
  )
}
