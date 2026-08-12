import { createClient } from '@/utils/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default async function AgencyStudentsPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams
  const q = searchParams?.q?.toLowerCase() || ''

  const supabase = await createClient()

  // Fetch pending invitations for students
  const { data: pendingInvites } = await supabase
    .from('invitations')
    .select(`id, email, status, created_at, colleges ( name )`)
    .eq('role', 'student')
    .eq('status', 'pending')

  // Fetch active students — now also pulling profile_data
  const { data: activeStudents } = await supabase
    .from('students')
    .select(`id, onboarding_status, created_at, profile_data, users ( email ), colleges ( name )`)

  // Combine and format
  let combinedList = [
    ...(pendingInvites || []).map((inv: any) => ({
      id: inv.id,
      studentId: null as string | null,
      email: inv.email,
      name: '—',
      gpa: '—',
      status: 'pending',
      college: inv.colleges?.name || 'Unknown',
      date: inv.created_at,
    })),
    ...(activeStudents || []).map((stu: any) => ({
      id: stu.id,
      studentId: stu.id,
      email: stu.users?.email || '—',
      name: stu.profile_data?.full_name || '—',
      gpa: stu.profile_data?.gpa || '—',
      status: 'active',
      college: stu.colleges?.name || 'Unknown',
      date: stu.created_at,
    })),
  ]

  if (q) {
    combinedList = combinedList.filter(item =>
      item.email?.toLowerCase().includes(q) ||
      item.college?.toLowerCase().includes(q) ||
      item.name?.toLowerCase().includes(q)
    )
  }

  combinedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
          <p className="text-zinc-500 mt-2">A global view of all students across the network.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="w-full max-w-sm" action="/agency/students" method="GET">
          <Input
            name="q"
            placeholder="Search by name, email or college..."
            defaultValue={q}
            className="w-full bg-white dark:bg-zinc-900"
          />
        </form>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>College</TableHead>
              <TableHead>GPA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedList.length > 0 ? (
              combinedList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.college}</TableCell>
                  <TableCell>{item.gpa}</TableCell>
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
                    {item.studentId ? (
                      <Link
                        href={`/agency/students/${item.studentId}`}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View Profile
                      </Link>
                    ) : (
                      <span className="text-sm text-zinc-400">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                  No students found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
