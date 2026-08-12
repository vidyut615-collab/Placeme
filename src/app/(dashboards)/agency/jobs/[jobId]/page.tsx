import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, Globe2 } from 'lucide-react'
import { JobApplicationsManager } from '@/components/JobApplicationsManager'

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
            <div className="flex items-center gap-2 mt-2 text-zinc-500">
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
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {job.status}
              </span>
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
