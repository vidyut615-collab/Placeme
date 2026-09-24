import { createClient } from '@/utils/supabase/server'
import { CreateJobModal } from '@/components/CreateJobModal'
import { createLocalJob } from '@/app/(dashboards)/college/actions'
import { CollegeJobsTable } from '@/components/CollegeJobsTable'

export default async function CollegeJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const collegeId = user?.app_metadata?.college_id

  // Fetch jobs, counts, classifications, and college academic fields
  const [
    { data: jobs },
    { data: appCounts },
    { data: collegeData },
    { data: jobTypes },
    { data: placementLevels },
    { data: placementCategories },
    { data: placementCycles },
  ] = await Promise.all([
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('applications').select('job_id'),
    collegeId ? supabase.from('colleges').select('onboarding_fields').eq('id', collegeId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('job_types').select('id, name').order('name'),
    supabase.from('placement_levels').select('id, name, is_dream, is_super_dream').order('rank'),
    supabase.from('placement_categories').select('id, name').order('name'),
    supabase.from('placement_cycles').select('id, name, is_active').order('start_date', { ascending: false }),
  ])

  // Build a count map
  const countMap: Record<string, number> = {}
  appCounts?.forEach((app: any) => {
    countMap[app.job_id] = (countMap[app.job_id] || 0) + 1
  })

  const jobsWithCounts = (jobs || []).map((job) => ({
    ...job,
    application_count: countMap[job.id] || 0,
  }))

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Manage local campus drives and monitor global placement opportunities.
          </p>
        </div>
        <CreateJobModal
          action={createLocalJob}
          title="Post Local Job"
          description="Create a job that will only be visible to students enrolled in your college."
          jobTypes={jobTypes || []}
          placementLevels={placementLevels || []}
          placementCategories={placementCategories || []}
          placementCycles={placementCycles || []}
          academicFields={collegeData?.onboarding_fields || { departments: [], types: [], years: [] }}
        />
      </div>

      <CollegeJobsTable jobs={jobsWithCounts} />
    </div>
  )
}

