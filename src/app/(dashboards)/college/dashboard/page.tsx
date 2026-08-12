import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, Globe } from 'lucide-react'

export default async function CollegeOverview() {
  const supabase = await createClient()

  // Thanks to RLS and the college_id in the JWT, this automatically 
  // only counts students that belong to THIS college.
  const { count: studentsCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  // This counts jobs where college_id = JWT college_id
  const { count: localJobsCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .not('college_id', 'is', null)

  // This counts jobs posted globally (college_id IS NULL)
  // RLS rule: "College Staff can view agency jobs"
  const { count: globalJobsCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .is('college_id', null)

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">College Dashboard</h1>
        <p className="text-zinc-500 mt-2">Manage your students, internal jobs, and placement policies.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsCount || 0}</div>
            <p className="text-xs text-zinc-500">In your college</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localJobsCount || 0}</div>
            <p className="text-xs text-zinc-500">Posted by your team</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Global Jobs</CardTitle>
            <Globe className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalJobsCount || 0}</div>
            <p className="text-xs text-zinc-500">Available from Agency</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
