'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateApplicationStatus(applicationId: string, newStatus: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const role = user.app_metadata.role

    if (!['superadmin', 'agency_staff', 'college_admin', 'college_staff'].includes(role)) {
      return { error: 'Unauthorized to manage applications.' }
    }

    // Because we have RLS on applications:
    // "College Staff can view and manage applications for own college jobs"
    // "Agency can do all on applications"
    // The database itself will strictly reject the update if a college admin tries to update an application for a job outside their college.
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', applicationId)

    if (error) {
      console.error(error)
      return { error: 'Failed to update application status. You may not have permission.' }
    }

    // Revalidate paths that might show this application
    // We can't know the exact job ID easily without querying it first, but we can revalidate the general paths
    revalidatePath('/agency/jobs/[jobId]', 'page')
    revalidatePath('/college/jobs/[jobId]', 'page')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}
