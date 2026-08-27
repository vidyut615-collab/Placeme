import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ApprovalsList } from './ApprovalsList'

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    redirect('/login')
  }

  const { data: requests, error } = await supabase
    .from('profile_update_requests')
    .select(`
      id,
      proposed_profile_data,
      created_at,
      status,
      students (
        id,
        profile_data,
        users (email)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Supabase Error in Approvals:", error)
  }

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Approvals Queue</h1>
        <p className="text-zinc-500 mt-2">
          Review and approve changes made by students to their resumes and academic profiles.
        </p>
      </div>

      <ApprovalsList requests={(requests as any[]) || []} />
    </div>
  )
}
