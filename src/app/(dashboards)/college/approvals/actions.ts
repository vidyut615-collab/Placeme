'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processApprovalRequest(requestId: string, action: 'approve' | 'reject', reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const { data: request, error: fetchErr } = await supabase
    .from('profile_update_requests')
    .select('*, students(id, policy_counters, profile_data)')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: 'Request not found.' }
  
  const student = request.students as any

  if (action === 'approve') {
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

  // Log in approval_logs
  await supabase.from('approval_logs').insert({
    college_id: request.college_id,
    entity_type: 'profile_audit',
    entity_id: requestId,
    student_id: request.student_id,
    action_by: user.id,
    status: action === 'approve' ? 'approved' : 'rejected',
    reason: action === 'reject' ? reason || 'No reason provided' : null,
    snapshot_data: {
      old_data: student.profile_data || {},
      new_data: request.proposed_profile_data || {}
    }
  })

  revalidatePath('/college/approvals')
  
  return { success: `Profile update request has been ${action}d.` }
}

export async function revokeApproval(logId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  // 1. Fetch the log
  const { data: log, error: logErr } = await supabase
    .from('approval_logs')
    .select('*')
    .eq('id', logId)
    .single()

  if (logErr || !log) return { error: 'Approval log not found.' }
  if (log.status !== 'approved') return { error: 'Can only revoke approved items.' }

  if (log.entity_type === 'placement_offer') {
    // 2. Set offer back to pending
    const { error: offerErr } = await supabase
      .from('student_offers')
      .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
      .eq('id', log.entity_id)

    if (offerErr) return { error: `Failed to revert offer: ${offerErr.message}` }
    
    // Also change applications status from hired to interviewing? 
    // Usually revoking means it's pending review again. So we just reset the offer, we might need to reset application if it was hired.
    // For now, resetting the offer is the main requirement.
  } else if (log.entity_type === 'profile_audit') {
    // 2. Set profile update request back to pending
    const { error: reqErr } = await supabase
      .from('profile_update_requests')
      .update({ status: 'pending' })
      .eq('id', log.entity_id)

    if (reqErr) return { error: `Failed to revert profile request: ${reqErr.message}` }

    // Revert the student's profile_data to old_data
    if (log.snapshot_data && log.snapshot_data.old_data) {
      await supabase
        .from('students')
        .update({ profile_data: log.snapshot_data.old_data })
        .eq('id', log.student_id)
    }
  }

  // 3. Remove the log entry so it resets cleanly back to pending
  await supabase.from('approval_logs').delete().eq('id', logId)

  revalidatePath('/college/approvals')
  return { success: 'Approval successfully revoked.' }
}
