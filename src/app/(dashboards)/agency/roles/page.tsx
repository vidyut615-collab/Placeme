import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { InviteAgencyMemberModal } from '@/components/InviteAgencyMemberModal'
import { AgencyTeamManager } from '@/components/AgencyTeamManager'
import { ShieldAlert } from 'lucide-react'

export default async function AgencyRolesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Guard: Only Super Admins (Admin Owners) can access this management portal
  if (!user || user.app_metadata.role !== 'superadmin') {
    redirect('/agency/dashboard')
  }

  // Fetch active members and pending invitations in parallel
  const [
    { data: members },
    { data: invitations },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone, department, is_active, created_at')
      .in('role', ['superadmin', 'agency_admin', 'agency_staff'])
      .order('created_at', { ascending: true }),

    supabase
      .from('invitations')
      .select('id, email, role, first_name, last_name, phone, department, status, created_at')
      .in('role', ['superadmin', 'agency_admin', 'agency_staff'])
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

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
            Authorize and manage placement platform owners, admins, and staff.
          </p>
        </div>

        <InviteAgencyMemberModal />
      </div>
      
      <div className="p-4 rounded-xl border border-purple-300 bg-purple-50 dark:border-purple-800/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
        <ShieldAlert className="h-5 w-5 shrink-0 text-purple-600" />
        <div>
          <span className="font-bold block">Owner Only View</span>
          <span className="text-xs text-purple-800/90 dark:text-purple-300/90">
            You are viewing this page because you are an Admin Owner. Regular Admins and Staff cannot view or manage team roles.
          </span>
        </div>
      </div>

      {/* Team & Invitations Manager */}
      <AgencyTeamManager
        currentUserId={user.id}
        members={members || []}
        invitations={invitations || []}
      />
    </div>
  )
}
