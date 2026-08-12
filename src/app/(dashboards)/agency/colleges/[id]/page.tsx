import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { InviteStudentModal } from '@/components/InviteStudentModal'
import { OnboardingFieldsEditor } from '@/components/OnboardingFieldsEditor'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function CollegeProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  const { data: college } = await supabase
    .from('colleges')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!college) {
    notFound()
  }

  // Fetch pending invitations for students
  const { data: pendingInvites } = await supabase
    .from('invitations')
    .select('*')
    .eq('college_id', college.id)
    .eq('role', 'student')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Fetch active students
  const { data: activeStudents } = await supabase
    .from('students')
    .select(`
      id,
      onboarding_status,
      created_at,
      users ( email )
    `)
    .eq('college_id', college.id)
    .order('created_at', { ascending: false })

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
          <h1 className="text-3xl font-bold tracking-tight">{college.name} - Profile</h1>
          <p className="text-zinc-500 mt-2">Manage college details and invite students.</p>
        </div>
        <InviteStudentModal collegeId={college.id} />
      </div>

      <OnboardingFieldsEditor collegeId={college.id} initialFields={college.onboarding_fields} />

      <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-medium">Student Directory & Invitations</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                  No students or invitations found for this college.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
