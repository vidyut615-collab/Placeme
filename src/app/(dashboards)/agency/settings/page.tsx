import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, Briefcase, FileText, Shield } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function AgencySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !['superadmin', 'agency_staff'].includes(user.app_metadata.role)) {
    redirect('/login')
  }

  // Platform-wide stats
  const [
    { count: collegesCount },
    { count: activeStudentsCount },
    { count: pendingInvitesCount },
    { count: activeJobsCount },
    { count: totalApplicationsCount },
  ] = await Promise.all([
    supabase.from('colleges').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('onboarding_status', 'completed'),
    supabase.from('invitations').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'pending'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
  ])

  // Agency staff members
  const { data: agencyUsers } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .in('role', ['superadmin', 'agency_staff'])
    .order('created_at', { ascending: true })

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Admin',
    agency_staff: 'Agency Staff',
  }

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-zinc-500 mt-2">Overview of the entire Placeme network.</p>
      </div>

      {/* Platform Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colleges</CardTitle>
            <GraduationCap className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collegesCount || 0}</div>
            <p className="text-xs text-zinc-500">Registered partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudentsCount || 0}</div>
            <p className="text-xs text-zinc-500">{pendingInvitesCount || 0} pending invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobsCount || 0}</div>
            <p className="text-xs text-zinc-500">Across all colleges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApplicationsCount || 0}</div>
            <p className="text-xs text-zinc-500">Total all-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agency Team</CardTitle>
            <Shield className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencyUsers?.length || 0}</div>
            <p className="text-xs text-zinc-500">Admins & Staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Agency Team Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Agency Team</h2>
          <p className="text-sm text-zinc-500">All users with agency-level access to the platform.</p>
        </div>
        <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Member Since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!agencyUsers || agencyUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                    No agency users found.
                  </TableCell>
                </TableRow>
              ) : (
                agencyUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        u.role === 'superadmin'
                          ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                          : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                      }`}>
                        {roleLabel[u.role] || u.role}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
