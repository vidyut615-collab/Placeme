import { createClient } from '@/utils/supabase/server'
import { Input } from '@/components/ui/input'
import { AgencyStudentsDirectoryTable } from '@/components/AgencyStudentsDirectoryTable'

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
      degree: '—',
      department: '—',
      passingYear: '—',
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
      degree: stu.profile_data?.type || '—',
      department: stu.profile_data?.department || '—',
      passingYear: stu.profile_data?.year || '—',
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
      item.name?.toLowerCase().includes(q) ||
      item.degree?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q) ||
      item.passingYear?.toLowerCase().includes(q)
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

      <AgencyStudentsDirectoryTable
        students={combinedList}
        query={q}
      />
    </div>
  )
}
