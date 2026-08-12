import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Users, Briefcase, FileText } from 'lucide-react'

const statusConfig: Record<string, { label: string; className: string }> = {
  applied:      { label: 'Applied',      className: 'bg-zinc-100 text-zinc-800' },
  shortlisted:  { label: 'Shortlisted',  className: 'bg-blue-100 text-blue-800' },
  interviewing: { label: 'Interviewing', className: 'bg-purple-100 text-purple-800' },
  offered:      { label: 'Offered',      className: 'bg-yellow-100 text-yellow-800' },
  hired:        { label: 'Hired',        className: 'bg-green-100 text-green-800' },
}

export default async function AgencyOverview() {
  const supabase = await createClient()

  // All stats fetched in parallel
  const [
    { count: collegesCount },
    { count: studentsCount },
    { count: pendingCount },
    { count: jobsCount },
    { count: applicationsCount },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('colleges').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('onboarding_status', 'completed'),
    supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'pending'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        students ( profile_data ),
        jobs ( title )
      `)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-zinc-500 mt-2">Real-time metrics across your entire placement network.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Colleges</CardTitle>
            <GraduationCap className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collegesCount || 0}</div>
            <p className="text-xs text-zinc-500">Registered partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsCount || 0}</div>
            <p className="text-xs text-zinc-500">{pendingCount || 0} pending invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsCount || 0}</div>
            <p className="text-xs text-zinc-500">Open positions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsCount || 0}</div>
            <p className="text-xs text-zinc-500">Total all-time</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Application Activity</CardTitle>
          <CardDescription>The latest student applications across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-500">No application activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((app: any) => {
                const config = statusConfig[app.status] || { label: app.status, className: 'bg-zinc-100 text-zinc-800' }
                const studentName = (app.students as any)?.profile_data?.full_name || 'Unknown Student'
                const jobTitle = (app.jobs as any)?.title || 'Unknown Job'
                return (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{studentName}</span>
                      <span className="text-xs text-zinc-500">applied to <span className="font-medium">{jobTitle}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">{new Date(app.created_at).toLocaleDateString()}</span>
                      <Badge variant="secondary" className={`${config.className} border-transparent text-xs`}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
