import { createClient } from '@/utils/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function CollegeStudentsPage() {
  const supabase = await createClient()
  
  // RLS automatically filters this to ONLY students/invites enrolled in the JWT's college_id

  // Fetch pending invitations for students
  const { data: pendingInvites } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      status,
      created_at
    `)
    .eq('role', 'student')
    .eq('status', 'pending')

  // Fetch active students
  const { data: activeStudents } = await supabase
    .from('students')
    .select(`
      id,
      onboarding_status,
      created_at,
      users ( email )
    `)

  // Combine and format the list
  const combinedList = [
    ...(pendingInvites || []).map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      status: 'pending',
      date: inv.created_at,
      isInvite: true
    })),
    ...(activeStudents || []).map((stu: any) => ({
      id: stu.id,
      email: stu.users?.email,
      status: 'active',
      date: stu.created_at,
      isInvite: false
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Directory & Invitations</h1>
          <p className="text-zinc-500 mt-2">View active students and pending invitations for your college.</p>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedList.length > 0 ? (
              combinedList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.email}</TableCell>
                  <TableCell>
                    {item.status === 'active' ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {item.status === 'active' ? (
                      <button className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        View Profile
                      </button>
                    ) : (
                      <span className="text-sm text-zinc-400 italic">No profile yet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                  No students found in your college.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
