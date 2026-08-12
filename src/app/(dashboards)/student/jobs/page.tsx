import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentJobCard } from '@/components/StudentJobCard'

export default async function StudentJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's college_id
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading student profile.</div>
  }

  // Fetch active jobs (both global and college-specific)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, description, college_id, created_at')
    .eq('status', 'active')
    .or(`college_id.is.null,college_id.eq.${student.college_id}`)
    .order('created_at', { ascending: false })

  // Fetch student's applications to see what they have already applied to
  const { data: applications } = await supabase
    .from('applications')
    .select('job_id')
    .eq('student_id', student.id)

  const appliedJobIds = new Set(applications?.map(app => app.job_id) || [])

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobs Board</h1>
        <p className="text-zinc-500 mt-2">Discover and apply to open positions.</p>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center text-sm text-zinc-500">
          No active jobs are currently available. Check back later!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <StudentJobCard 
              key={job.id} 
              job={job} 
              hasApplied={appliedJobIds.has(job.id)} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
