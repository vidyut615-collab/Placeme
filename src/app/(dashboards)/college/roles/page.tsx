import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { InviteCollegeMemberModal } from '@/components/InviteCollegeMemberModal'
import { CollegeTeamManager } from '@/components/CollegeTeamManager'
import { ShieldCheck, Users } from 'lucide-react'

export default async function CollegeRolesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guard: Only College Admins can access this management portal
  if (!user || user.app_metadata.role !== 'college_admin') {
    redirect('/college/dashboard')
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    redirect('/login')
  }

  // Fetch college info, active members, and pending invitations in parallel
  const [
    { data: college },
    { data: members },
    { data: invitations },
  ] = await Promise.all([
    supabase
      .from('colleges')
      .select('id, name, onboarding_fields')
      .eq('id', collegeId)
      .single(),

    supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone, department, is_active, created_at')
      .eq('college_id', collegeId)
      .in('role', ['college_admin', 'college_staff'])
      .order('created_at', { ascending: true }),

    supabase
      .from('invitations')
      .select('id, email, role, first_name, last_name, phone, department, status, created_at')
      .eq('college_id', collegeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const collegeName = college?.name || 'Your Institution'
  const academicDepartments = college?.onboarding_fields?.departments || []

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Manage Roles & Team Access
            </h1>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Authorize and manage placement staff members and administrative roles for {collegeName}.
          </p>
        </div>

        <InviteCollegeMemberModal
          collegeName={collegeName}
          academicDepartments={academicDepartments}
        />
      </div>

      {/* Team & Invitations Manager */}
      <CollegeTeamManager
        currentUserId={user.id}
        members={members || []}
        invitations={invitations || []}
      />
    </div>
  )
}
