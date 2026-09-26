import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InviteStudentModal } from '@/components/InviteStudentModal'
import { BulkUploadStudentsModal } from '@/components/BulkUploadStudentsModal'
import { AcademicConfigManager } from '@/components/AcademicConfigManager'
import { AgencyCollegeInformationTab } from '@/components/AgencyCollegeInformationTab'
import { AgencyCollegeStudentsTable, type CollegeStudentItem } from '@/components/AgencyCollegeStudentsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, ArrowLeft, Users, GraduationCap } from 'lucide-react'

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
          <AgencyCollegeInformationTab college={college} />
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


