import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreateJobModal } from '@/components/CreateJobModal'
import { createLocalJob } from '@/app/(dashboards)/college/actions'

export default async function CollegeJobsPage() {
  const supabase = await createClient()

  // RLS will automatically only return:
  // 1. Jobs where college_id = JWT college_id
  // 2. Jobs where college_id IS NULL (Agency global jobs)
  const [
    { data: jobs },
    { data: appCounts },
  ] = await Promise.all([
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('applications').select('job_id'),
  ])

  // Build a count map
  const countMap: Record<string, number> = {}
  appCounts?.forEach((app: any) => {
    countMap[app.job_id] = (countMap[app.job_id] || 0) + 1
  })

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Board</h1>
          <p className="text-zinc-500 mt-2">Manage your local job postings and view global opportunities.</p>
        </div>
        <CreateJobModal
          action={createLocalJob}
          title="Post Local Job"
          description="Create a job that will only be visible to students enrolled in your college."
        />
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead>Posted On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs && jobs.length > 0 ? (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    {job.college_id ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        Local
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                        Global (Agency)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {countMap[job.id] || 0}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/college/jobs/${job.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                      View Details
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                  No jobs available yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
