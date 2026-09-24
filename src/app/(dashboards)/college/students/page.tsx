import { createClient } from '@/utils/supabase/server'
import { SearchInput } from '@/components/SearchInput'
import { CollegeStudentDirectoryTable } from '@/components/CollegeStudentDirectoryTable'

export default async function CollegeStudentsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const collegeId = user?.app_metadata?.college_id || user?.user_metadata?.college_id || ''
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.toLowerCase() : '';
  
  // Fetch pending invitations for students
  let invitesQuery = supabase
    .from('invitations')
    .select(`
      id,
      email,
      status,
      created_at
    `)
    .eq('role', 'student')
    .eq('status', 'pending');

  if (query) {
    invitesQuery = invitesQuery.ilike('email', `%${query}%`);
  }
  const { data: pendingInvites } = await invitesQuery;

  // Fetch active students
  let studentsQuery = supabase
    .from('students')
    .select(`
      id,
      onboarding_status,
      created_at,
      is_blacklisted,
      blacklist_reason,
      policy_counters,
      users!inner ( email ),
      profile_data
    `);

  if (query) {
    studentsQuery = studentsQuery.ilike('users.email', `%${query}%`);
  }
  
  const { data: activeStudents } = await studentsQuery;

  // Combine and format the list
  const combinedList = [
    ...(pendingInvites || []).map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      name: '—',
      degree: '—',
      department: '—',
      passingYear: '—',
      status: 'pending',
      date: inv.created_at,
      isInvite: true,
      isBlacklisted: false,
      blacklistReason: null,
      counters: null
    })),
    ...(activeStudents || []).map((stu: any) => ({
      id: stu.id,
      email: stu.users?.email,
      name: stu.profile_data?.full_name || '—',
      degree: stu.profile_data?.type || '—',
      department: stu.profile_data?.department || '—',
      passingYear: stu.profile_data?.year || '—',
      status: 'active',
      date: stu.created_at,
      isInvite: false,
      isBlacklisted: stu.is_blacklisted || false,
      blacklistReason: stu.blacklist_reason || null,
      counters: stu.policy_counters || {}
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredList = query 
    ? combinedList.filter(item => 
        item.email?.toLowerCase().includes(query) || 
        item.name?.toLowerCase().includes(query) ||
        item.degree?.toLowerCase().includes(query) ||
        item.department?.toLowerCase().includes(query) ||
        item.passingYear?.toLowerCase().includes(query)
      )
    : combinedList;

  const activeAndPendingList = filteredList.filter(item => !item.isBlacklisted)
  const blacklistedList = filteredList.filter(item => item.isBlacklisted)

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Directory & Invitations</h1>
          <p className="text-zinc-500 mt-2">View active students, pending invitations, and blacklisted accounts.</p>
        </div>
        <div className="w-full sm:w-auto">
           <SearchInput placeholder="Search students by name or email..." />
        </div>
      </div>

      <CollegeStudentDirectoryTable
        activeAndPendingList={activeAndPendingList}
        blacklistedList={blacklistedList}
        query={query}
        collegeId={collegeId}
      />
    </div>
  )
}
