'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateStudentProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    return { error: 'Unauthorized.' }
  }

  const full_name = (formData.get('full_name') as string)?.trim()
  const first_name = (formData.get('first_name') as string)?.trim()
  const last_name = (formData.get('last_name') as string)?.trim()
  if (!first_name || !last_name) return { error: 'First and Last name are required.' }

  let profile_data: any = {}
  
  const rawJson = formData.get('profile_data_json') as string
  if (rawJson) {
    try {
      profile_data = JSON.parse(rawJson)
    } catch (e) {
      return { error: 'Invalid profile data format.' }
    }
  } else {
    profile_data = {
      full_name,
      first_name,
      last_name,
      middle_name: (formData.get('middle_name') as string)?.trim() || '',
      phone: (formData.get('phone') as string)?.trim() || '',
      gpa: (formData.get('gpa') as string)?.trim() || '',
      year: (formData.get('year') as string)?.trim() || '',
      type: (formData.get('type') as string)?.trim() || '',
      department: (formData.get('department') as string)?.trim() || '',
      academic_10th: (formData.get('academic_10th') as string)?.trim() || '',
      academic_12th: (formData.get('academic_12th') as string)?.trim() || '',
      diploma_percentage: (formData.get('diploma_percentage') as string)?.trim() || '',
      graduation_percentage: (formData.get('graduation_percentage') as string)?.trim() || '',
      active_backlogs: (formData.get('active_backlogs') as string)?.trim() || '',
      historical_backlogs: (formData.get('historical_backlogs') as string)?.trim() || '',
      academic_gap_years: (formData.get('academic_gap_years') as string)?.trim() || '',
    }
  }

  const { data: studentDoc } = await supabase
    .from('students')
    .select('id, college_id, policy_counters, profile_data')
    .eq('user_id', user.id)
    .single()

  if (!studentDoc) return { error: 'Student not found.' }

  const { data: policy } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', studentDoc.college_id)
    .maybeSingle()

  const auditEnabled = policy?.config?.profile_audit_enabled !== false

  if (auditEnabled) {
    // Check if there's already a pending request
    const { data: existingReq } = await supabase
      .from('profile_update_requests')
      .select('id')
      .eq('student_id', studentDoc.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingReq) {
      return { error: 'You already have a pending profile update request.' }
    }

    // Insert pending request
    const { error: reqError } = await supabase
      .from('profile_update_requests')
      .insert({
        student_id: studentDoc.id,
        college_id: studentDoc.college_id,
        proposed_profile_data: profile_data,
        status: 'pending'
      })
      
    if (reqError) return { error: reqError.message }
  } else {
    // Audit disabled, direct update
    const counters = studentDoc.policy_counters || {}
    counters.profile_updates = (counters.profile_updates || 0) + 1

    const { error: updateError } = await supabase
      .from('students')
      .update({ profile_data, policy_counters: counters })
      .eq('id', studentDoc.id)

    if (updateError) return { error: updateError.message }
  }

  revalidatePath('/student/profile')
  revalidatePath('/student/dashboard')

  return { success: true }
}
