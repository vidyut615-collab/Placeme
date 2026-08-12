import { createClient } from '@/utils/supabase/server'
import { CreateJobModal } from '@/components/CreateJobModal'
import { createGlobalJob } from '@/app/(dashboards)/agency/actions'
import { AgencyJobsTable } from '@/components/AgencyJobsTable'

export default async function AgencyJobsPage() {
  const supabase = await createClient()

  // Fetch all jobs and application counts in parallel
  const [
    { data: jobs },
    { data: appCounts },
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, colleges(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('applications')
      .select('job_id'),
  ])

  // Build a count map: { job_id -> count }
  const countMap: Record<string, number> = {}
  appCounts?.forEach((app: any) => {
    countMap[app.job_id] = (countMap[app.job_id] || 0) + 1
  })

  // Inject application_count into each job
  const jobsWithCounts = (jobs || []).map(job => ({
    ...job,
    application_count: countMap[job.id] || 0,
  }))

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Job Board</h1>
          <p className="text-zinc-500 mt-2">Manage global agency jobs and oversee all local college postings.</p>
        </div>
        <CreateJobModal
          action={createGlobalJob}
          title="Post Global Job"
          description="Create a job that will be visible to every student on the platform."
        />
      </div>

      <AgencyJobsTable jobs={jobsWithCounts} />
    </div>
  )
}
