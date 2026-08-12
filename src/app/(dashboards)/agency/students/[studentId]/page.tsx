import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusConfig: Record<string, { label: string; className: string }> = {
  applied:      { label: 'Applied',      className: 'bg-zinc-100 text-zinc-800' },
  shortlisted:  { label: 'Shortlisted',  className: 'bg-blue-100 text-blue-800' },
  interviewing: { label: 'Interviewing', className: 'bg-purple-100 text-purple-800' },
  offered:      { label: 'Offered',      className: 'bg-yellow-100 text-yellow-800' },
  hired:        { label: 'Hired',        className: 'bg-green-100 text-green-800' },
}

export default async function AgencyStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !['superadmin', 'agency_staff'].includes(user.app_metadata.role)) {
    redirect('/login')
  }

  // Fetch the student profile, linked user email, and college name
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      onboarding_status,
      created_at,
      profile_data,
      users ( email ),
      colleges ( name )
    `)
    .eq('id', studentId)
    .single()

  if (error || !student) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Student Not Found</h1>
        <Link href="/agency/students" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Directory
        </Link>
      </div>
    )
  }

  // Fetch application history with job details
  const { data: applications } = await supabase
    .from('applications')
    .select(`id, status, created_at, updated_at, jobs ( title, college_id )`)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  const profile = student.profile_data || {}
  const email = (student.users as any)?.email || '—'
  const collegeName = (student.colleges as any)?.name || 'Unknown College'

  const profileFields = [
    { label: 'Full Name', value: profile.full_name },
    { label: 'Email', value: email },
    { label: 'Phone', value: profile.phone },
    { label: 'College', value: collegeName },
    { label: 'Degree Type', value: profile.type },
    { label: 'Year', value: profile.year },
    { label: 'Department', value: profile.department },
    { label: 'GPA / CGPA', value: profile.gpa },
  ]

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6">
      <div>
        <Link
          href="/agency/students"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Student Directory
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xl font-bold text-blue-600 dark:text-blue-300">
            {(profile.full_name?.[0] || email?.[0] || 'S').toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{profile.full_name || email}</h1>
            <p className="text-zinc-500 mt-1">{collegeName}</p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {profileFields.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value || '—'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application History */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Application History ({applications?.length || 0})</h2>
          <p className="text-sm text-zinc-500">All jobs this student has applied to.</p>
        </div>
        <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!applications || applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-zinc-500">
                    This student has not applied to any jobs yet.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app: any) => {
                  const config = statusConfig[app.status] || { label: app.status, className: 'bg-zinc-100 text-zinc-800' }
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.jobs?.title || 'Unknown Job'}</TableCell>
                      <TableCell>{app.jobs?.college_id ? 'College' : 'Global'}</TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(app.updated_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${config.className} border-transparent`}>
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
