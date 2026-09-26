import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { ManageListsClient } from './ManageListsClient'

export const metadata = {
  title: 'Manage Master Lists | Agency Dashboard',
}

export default async function ManageListsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff' && user.app_metadata.role !== 'agency_admin')) {
    redirect('/auth/login')
  }

  const adminClient = getAdminClient()
  
  const { data: masterData, error } = await adminClient
    .from('platform_master_data')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load master lists: {error.message}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Master Lists</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage the standard drop-down options used across all colleges, students, and job postings.
          To protect historical data, items can only be added or archived, never deleted.
        </p>
      </div>
      
      <ManageListsClient initialData={masterData || []} />
    </div>
  )
}
