import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InviteStudentModal } from '@/components/InviteStudentModal'
import { AcademicConfigManager } from '@/components/AcademicConfigManager'
import { EditCollegeDetailsModal } from '@/components/EditCollegeDetailsModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2, Globe, MapPin, Mail, Phone, ArrowLeft, Users, Calendar } from 'lucide-react'

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
      profile_data,
      users ( email )
    `)
    .eq('college_id', college.id)
    .order('created_at', { ascending: false })

  // Combine and format the list
  const combinedList = [
    ...(pendingInvites || []).map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      name: '—',
      status: 'pending',
      date: inv.created_at,
      isInvite: true
    })),
    ...(activeStudents || []).map((stu: any) => ({
      id: stu.id,
      email: stu.users?.email,
      name: stu.profile_data?.full_name || '—',
      status: 'active',
      date: stu.created_at,
      isInvite: false
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Navigation & Header */}
      <div>
        <Link 
          href="/agency/colleges" 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Colleges
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600 shrink-0" />
              {college.name}
            </h1>
            <p className="text-zinc-500 mt-1">Manage college profile details, academic lists, and student invitations.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <EditCollegeDetailsModal college={college} />
            <InviteStudentModal collegeId={college.id} />
          </div>
        </div>
      </div>

      {/* College Profile Summary Card */}
      <Card className="shadow-sm border">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-500" />
            College Information & Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Official Website
              </div>
              <div>
                {college.website ? (
                  <a 
                    href={college.website.startsWith('http') ? college.website : `https://${college.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline font-medium truncate block"
                  >
                    {college.website}
                  </a>
                ) : (
                  <span className="text-zinc-400 italic">Not provided</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Location
              </div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                {college.location || <span className="text-zinc-400 italic font-normal">Not provided</span>}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Contact Email
              </div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {college.contact_email ? (
                  <a href={`mailto:${college.contact_email}`} className="text-zinc-700 hover:text-blue-600 dark:text-zinc-300">
                    {college.contact_email}
                  </a>
                ) : (
                  <span className="text-zinc-400 italic font-normal">Not provided</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Contact Phone
              </div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200">
                {college.contact_phone || <span className="text-zinc-400 italic font-normal">Not provided</span>}
              </div>
            </div>
          </div>

          {college.description && (
            <div className="mt-4 pt-4 border-t text-sm">
              <div className="text-xs font-medium text-zinc-500 mb-1">About the Institution</div>
              <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {college.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Lists Configuration (Years, Degrees, Departments with Add/Edit/Delete modals) */}
      <AcademicConfigManager 
        collegeId={college.id} 
        initialFields={college.onboarding_fields} 
        role="agency" 
      />

      {/* Student Directory & Invitations */}
      <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Student Directory & Invitations
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Students invited or actively registered under {college.name}.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {combinedList.length} Total
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedList.length > 0 ? (
              combinedList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">{item.email}</TableCell>
                  <TableCell>
                    {item.status === 'active' ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
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
