import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { AddCollegeModal } from '@/components/AddCollegeModal'
import { CollegeActionsMenu } from '@/components/CollegeActionsMenu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function AgencyColleges() {
  const supabase = await createClient()

  // Fetch colleges and their associated admins
  const { data: colleges, error } = await supabase
    .from('colleges')
    .select(`
      id, 
      name, 
      created_at,
      users!users_college_id_fkey(email, role)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Colleges fetch error:", error)
  }

  return (
    <div className="flex flex-1 flex-col p-8 bg-zinc-50 dark:bg-zinc-950 min-h-screen">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Registered Colleges</h1>
            <p className="text-zinc-500 mt-2">Manage your network of partner colleges.</p>
          </div>
          <AddCollegeModal />
        </div>

        <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College Name</TableHead>
                <TableHead>Primary Admin</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges && colleges.length > 0 ? (
                colleges.map((college) => {
                  // Find the college_admin from the joined users array
                  const adminUser = college.users?.find((u: any) => u.role === 'college_admin')
                  
                  return (
                    <TableRow key={college.id}>
                      <TableCell className="font-medium">
                        <Link href={`/agency/colleges/${college.id}`} className="text-blue-600 hover:underline">
                          {college.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {adminUser ? adminUser.email : 'No admin assigned'}
                      </TableCell>
                      <TableCell>{new Date(college.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <CollegeActionsMenu collegeId={college.id} collegeName={college.name} />
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                    No colleges have been registered yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
