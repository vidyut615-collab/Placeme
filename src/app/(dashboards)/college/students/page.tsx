import { createClient } from '@/utils/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SearchInput } from '@/components/SearchInput'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentActionsDropdown } from '@/components/StudentActionsDropdown'

export default async function CollegeStudentsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const supabase = await createClient()
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
        item.name?.toLowerCase().includes(query)
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

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active & Pending ({activeAndPendingList.length})</TabsTrigger>
          <TabsTrigger value="blacklisted">Blacklisted ({blacklistedList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm w-full overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAndPendingList.length > 0 ? (
                  activeAndPendingList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        {item.counters && Object.keys(item.counters).length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap max-w-[200px]">
                            {item.counters.no_shows > 0 && <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">{item.counters.no_shows} No-Shows</span>}
                            {item.counters.withdrawals > 0 && <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full">{item.counters.withdrawals} Withdrawals</span>}
                            {item.counters.post_shortlist_withdrawals > 0 && <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">{item.counters.post_shortlist_withdrawals} Late Drops</span>}
                            {item.counters.disciplinary > 0 && <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">{item.counters.disciplinary} Disciplinary</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500">{item.email}</TableCell>
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
                        {!item.isInvite ? (
                          <StudentActionsDropdown studentId={item.id} isBlacklisted={item.isBlacklisted} />
                        ) : (
                          <span className="text-sm text-zinc-400 italic">No profile yet</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      {query ? 'No active students match your search.' : 'No active students found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="blacklisted">
          <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm w-full overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Added On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklistedList.length > 0 ? (
                  blacklistedList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-zinc-500">{item.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 max-w-[250px] truncate" title={item.blacklistReason || ''}>
                          {item.blacklistReason || 'No reason provided'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {!item.isInvite ? (
                          <StudentActionsDropdown studentId={item.id} isBlacklisted={item.isBlacklisted} />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      {query ? 'No blacklisted students match your search.' : 'No students have been blacklisted.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
