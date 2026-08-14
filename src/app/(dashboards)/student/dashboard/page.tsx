import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, GraduationCap, Building, Briefcase, FileText, TrendingUp } from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  applied:      { label: 'Applied',      className: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300' },
  shortlisted:  { label: 'Shortlisted',  className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  interviewing: { label: 'Interviewing', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  offered:      { label: 'Offered',      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  hired:        { label: 'Hired',        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
}

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Fetch student profile and college
  const { data: student } = await supabase
    .from('students')
    .select(`id, profile_data, college_id, colleges ( name )`)
    .eq('user_id', user.id)
    .single()

  const profile = student?.profile_data || {}
  const collegeName = (student?.colleges as any)?.name || 'Unknown College'

  // Fetch stats + data in parallel
  const [
    { data: recentJobs },
    { data: recentApplications },
    { count: totalJobsCount },
    { count: totalAppsCount },
    { count: progressCount },
  ] = await Promise.all([
    // 3 most recent active, eligible jobs
    supabase
      .from('jobs')
      .select('id, title, college_id, created_at')
      .eq('status', 'active')
      .or(`college_id.is.null,college_id.eq.${student?.college_id}`)
      .order('created_at', { ascending: false })
      .limit(3),

    // 3 most recent applications
    supabase
      .from('applications')
      .select(`id, status, created_at, jobs ( title )`)
      .eq('student_id', student?.id)
      .order('created_at', { ascending: false })
      .limit(3),

    // Count eligible active jobs
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .or(`college_id.is.null,college_id.eq.${student?.college_id}`),

    // Count total applications
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student?.id),

    // Count shortlisted + interviewing + offered
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student?.id)
      .in('status', ['shortlisted', 'interviewing', 'offered', 'hired']),
  ])

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile.full_name || 'Student'}!
        </h1>
        <p className="text-zinc-500 mt-2">Here's what's happening with your placement journey.</p>
      </div>

      {/* Profile stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full Name</CardTitle>
            <User className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{profile.full_name || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">College</CardTitle>
            <Building className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate" title={collegeName}>{collegeName}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Info</CardTitle>
            <GraduationCap className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{profile.type || 'N/A'} – {profile.year || 'N/A'}</div>
            <p className="text-xs text-zinc-500">{profile.department || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <Briefcase className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{profile.gpa || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Available</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalJobsCount || 0}</div>
            <p className="text-xs text-zinc-500">Active openings for you</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Sent</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalAppsCount || 0}</div>
            <p className="text-xs text-zinc-500">Total submitted</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{progressCount || 0}</div>
            <p className="text-xs text-zinc-500">Shortlisted / Interviewing / Offered</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent jobs + recent applications */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Job Postings</CardTitle>
              <CardDescription>Latest openings available for you</CardDescription>
            </div>
            <Link href="/student/jobs" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentJobs || recentJobs.length === 0 ? (
              <p className="text-sm text-zinc-500">No active jobs available right now.</p>
            ) : (
              recentJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{job.title}</span>
                    <span className="text-xs text-zinc-500">
                      {job.college_id ? 'College Exclusive' : 'Global Placement'}
                    </span>
                  </div>
                  <Link
                    href="/student/jobs"
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400 shrink-0"
                  >
                    Apply
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>Track your recent submissions</CardDescription>
            </div>
            <Link href="/student/applications" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentApplications || recentApplications.length === 0 ? (
              <p className="text-sm text-zinc-500">You haven't applied to any jobs yet.</p>
            ) : (
              recentApplications.map((app: any) => {
                const config = statusConfig[app.status] || { label: app.status, className: 'bg-zinc-100 text-zinc-800' }
                return (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium truncate max-w-[60%]">
                      {app.jobs?.title || 'Unknown Job'}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`${config.className} border-transparent text-xs`}
                    >
                      {config.label}
                    </Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
