'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processApprovalRequest(requestId: string, action: 'approve' | 'reject') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const { data: request, error: fetchErr } = await supabase
    .from('profile_update_requests')
    .select('*, students(id, policy_counters)')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: 'Request not found.' }

  if (action === 'approve') {
    const student = request.students as any
    const counters = student.policy_counters || {}
    counters.profile_updates = (counters.profile_updates || 0) + 1

    // Update student's profile data
    const { error: studentErr } = await supabase
      .from('students')
      .update({ 
        profile_data: request.proposed_profile_data,
        policy_counters: counters
      })
      .eq('id', request.student_id)

    if (studentErr) return { error: studentErr.message }
  }

  // Update request status
  const { error: updateErr } = await supabase
    .from('profile_update_requests')
    .update({ status: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', requestId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/college/approvals')
  
  return { success: `Profile update request has been ${action}d.` }
}
