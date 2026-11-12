'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface PolicyConfigRecord {
  profile_audit_enabled?: boolean
  [key: string]: unknown
}

interface PlacementPolicyDoc {
  config?: PolicyConfigRecord | null
}

export async function updateStudentProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    return { error: 'Unauthorized.' }
  }

  let profile_data: Record<string, unknown> = {}
  
  const rawJson = formData.get('profile_data_json') as string
  if (rawJson) {
    try {
      profile_data = JSON.parse(rawJson) as Record<string, unknown>
    } catch {
      return { error: 'Invalid profile data format.' }
    }
  } else {
    const first_name = (formData.get('first_name') as string)?.trim() || ''
    const last_name = (formData.get('last_name') as string)?.trim() || ''
    const middle_name = (formData.get('middle_name') as string)?.trim() || ''
    const full_name = (formData.get('full_name') as string)?.trim() || `${first_name} ${middle_name ? middle_name + ' ' : ''}${last_name}`.trim()

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

  const firstName = typeof profile_data.first_name === 'string' ? profile_data.first_name.trim() : ''
  const lastName = typeof profile_data.last_name === 'string' ? profile_data.last_name.trim() : ''

  if (!firstName || !lastName) {
    return { error: 'First and Last name are required.' }
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

  const policyDoc = policy as PlacementPolicyDoc | null
  const policyAuditEnabled = policyDoc?.config?.profile_audit_enabled !== false

  const CRITICAL_KEYS = [
    'first_name', 'last_name', 'middle_name', 'phone', 
    'gpa', 'year', 'type', 'department', 
    'active_backlogs', 'historical_backlogs', 'academic_gap_years',
    'academic_10th', 'academic_12th', 'diploma_percentage', 'graduation_percentage',
    'education'
  ]

  const currentProfile = (studentDoc.profile_data as Record<string, unknown>) || {}
  const hasCriticalChanges = CRITICAL_KEYS.some(key => {
    const oldVal = currentProfile[key]
    const newVal = profile_data[key]
    return JSON.stringify(oldVal !== undefined ? oldVal : '') !== JSON.stringify(newVal !== undefined ? newVal : '')
  })

  const auditEnabled = policyAuditEnabled && hasCriticalChanges

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
    const counters = (studentDoc.policy_counters as Record<string, unknown>) || {}
    counters.profile_updates = (Number(counters.profile_updates) || 0) + 1

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
