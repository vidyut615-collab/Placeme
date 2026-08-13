import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { WithdrawButton } from '@/components/WithdrawButton'

const statusMap: Record<string, { label: string, color: string }> = {
  'applied': { label: 'Applied', color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300' },
  'shortlisted': { label: 'Shortlisted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'interviewing': { label: 'Interviewing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  'offered': { label: 'Offered', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'hired': { label: 'Hired', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
}

export default async function StudentApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's ID
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading student profile.</div>
  }

  // Fetch applications with joined job details
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      jobs (
        title,
        college_id
      )
    `)
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-zinc-500 mt-2">Track the status of your job applications.</p>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Placement Type</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!applications || applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                  You haven't applied to any jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app: any) => {
                const statusConfig = statusMap[app.status] || { label: app.status, color: 'bg-zinc-100 text-zinc-800' }
                
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.jobs?.title || 'Unknown Job'}
                    </TableCell>
                    <TableCell>
                      {app.jobs?.college_id ? 'College Exclusive' : 'Global Placement'}
                    </TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${statusConfig.color} border-transparent hover:${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <WithdrawButton applicationId={app.id} status={app.status} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
