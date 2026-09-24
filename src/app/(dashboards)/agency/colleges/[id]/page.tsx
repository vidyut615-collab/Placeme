import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InviteStudentModal } from '@/components/InviteStudentModal'
import { BulkUploadStudentsModal } from '@/components/BulkUploadStudentsModal'
import { AcademicConfigManager } from '@/components/AcademicConfigManager'
import { EditCollegeDetailsModal } from '@/components/EditCollegeDetailsModal'
import { AgencyCollegeStudentsTable, type CollegeStudentItem } from '@/components/AgencyCollegeStudentsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Globe, MapPin, Mail, Phone, ArrowLeft, Users, GraduationCap, Info } from 'lucide-react'

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
  const combinedList: CollegeStudentItem[] = [
    ...(pendingInvites || []).map((inv: any) => ({
      id: inv.id,
      studentId: null,
      email: inv.email,
      name: '—',
      degree: '—',
      department: '—',
      passingYear: '—',
      status: 'pending' as const,
      date: inv.created_at,
      isInvite: true
    })),
    ...(activeStudents || []).map((stu: any) => ({
      id: stu.id,
      studentId: stu.id,
      email: stu.users?.email || '—',
      name: stu.profile_data?.full_name || '—',
      degree: stu.profile_data?.type || '—',
      department: stu.profile_data?.department || '—',
      passingYear: stu.profile_data?.year || '—',
      status: 'active' as const,
      date: stu.created_at,
      isInvite: false
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Navigation & Header */}
      <div>
        <Link 
          href="/agency/colleges" 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Colleges
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600 shrink-0" />
            {college.name}
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage institution details, academic lists, and student roster.
          </p>
        </div>
      </div>

      {/* 3 DISTINCT TABS FOR CLEAR ORGANIZATION */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-2xl mb-6">
          <TabsTrigger value="details" className="flex items-center gap-2 py-2.5">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">College Information</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2 py-2.5">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Academic Configuration</span>
            <span className="sm:hidden">Academics</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2 py-2.5">
            <Users className="h-4 w-4" />
            <span>Students ({combinedList.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: COLLEGE INFORMATION & CONTACTS */}
        <TabsContent value="details" className="space-y-6">
          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  College Profile & Public Contacts
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">
                  General and contact information visible to students and placement coordinators.
                </p>
              </div>
              <EditCollegeDetailsModal college={college} />
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs font-medium text-zinc-500 mb-1.5 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-blue-600" /> Official Website
                  </div>
                  <div>
                    {college.website ? (
                      <a 
                        href={college.website.startsWith('http') ? college.website : `https://${college.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline font-medium break-all block"
                      >
                        {college.website}
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic">Not provided</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs font-medium text-zinc-500 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-600" /> Location / Campus
                  </div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {college.location || <span className="text-zinc-400 italic font-normal">Not provided</span>}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs font-medium text-zinc-500 mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-blue-600" /> Placement Email
                  </div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200 break-all">
                    {college.contact_email ? (
                      <a href={`mailto:${college.contact_email}`} className="text-zinc-700 hover:text-blue-600 dark:text-zinc-300">
                        {college.contact_email}
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic font-normal">Not provided</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                  <div className="text-xs font-medium text-zinc-500 mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-blue-600" /> Contact Phone
                  </div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {college.contact_phone || <span className="text-zinc-400 italic font-normal">Not provided</span>}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border">
                <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-600" /> About the Institution
                </div>
                {college.description ? (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                    {college.description}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400 italic">
                    No description provided yet. Click &quot;Edit Details&quot; to add institutional highlights.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: ACADEMIC CONFIGURATION (Batches, Degrees, Departments) */}
        <TabsContent value="academic" className="space-y-6">
          <AcademicConfigManager 
            collegeId={college.id} 
            initialFields={college.onboarding_fields} 
            role="agency" 
          />
        </TabsContent>

        {/* TAB 3: STUDENT DIRECTORY & INVITATIONS (Paginated at 25 per page) */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-end gap-3">
            <BulkUploadStudentsModal collegeId={college.id} collegeName={college.name} />
            <InviteStudentModal collegeId={college.id} />
          </div>
          <AgencyCollegeStudentsTable 
            students={combinedList} 
            collegeName={college.name} 
            collegeId={college.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
