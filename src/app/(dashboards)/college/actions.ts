'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { PolicyConfig } from '@/lib/policy-engine'

export async function savePlacementPolicies(config: PolicyConfig) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Admins can configure placement policies.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  // Upsert: insert if no row exists, update if it does
  const { error } = await supabase
    .from('placement_policies')
    .upsert(
      { college_id: collegeId, config },
      { onConflict: 'college_id' }
    )

  if (error) return { error: `Failed to save policies: ${error.message}` }

  revalidatePath('/college/policies')
  return { success: 'Placement policies saved successfully!' }
}


export async function updateCollegeProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    return { error: 'No college associated with this account.' }
  }

  // Extract all fields
  const name = formData.get('name') as string
  const website = formData.get('website') as string
  const location = formData.get('location') as string
  const description = formData.get('description') as string
  const contact_email = formData.get('contact_email') as string
  const contact_phone = formData.get('contact_phone') as string

  // We use the standard supabase client. The RLS policy we just added 
  // explicitly allows them to UPDATE where id = auth_college_id()
  const { error } = await supabase
    .from('colleges')
    .update({
      name,
      website,
      location,
      description,
      contact_email,
      contact_phone
    })
    .eq('id', collegeId)

  if (error) {
    return { error: `Failed to update college details: ${error.message}` }
  }

  revalidatePath('/college/settings')
  return { success: 'College details updated successfully!' }
}

export async function createLocalJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string
  const company_name = formData.get('company_name') as string
  const compensation_ctc = formData.get('compensation_ctc') ? Number(formData.get('compensation_ctc')) : null
  const compensation_fixed = formData.get('compensation_fixed') ? Number(formData.get('compensation_fixed')) : null
  const compensation_variable = formData.get('compensation_variable') ? Number(formData.get('compensation_variable')) : null
  const application_deadline = formData.get('application_deadline') as string || null

  const eligibility_min_cgpa = formData.get('eligibility_min_cgpa') ? Number(formData.get('eligibility_min_cgpa')) : null
  const eligibility_min_10th = formData.get('eligibility_min_10th') ? Number(formData.get('eligibility_min_10th')) : null
  const eligibility_min_12th = formData.get('eligibility_min_12th') ? Number(formData.get('eligibility_min_12th')) : null
  const eligibility_max_active_backlogs = formData.get('eligibility_max_active_backlogs') ? Number(formData.get('eligibility_max_active_backlogs')) : null
  const eligibility_max_historical_backlogs = formData.get('eligibility_max_historical_backlogs') ? Number(formData.get('eligibility_max_historical_backlogs')) : null
  
  const rawDepartments = formData.get('eligibility_allowed_departments') as string
  const eligibility_allowed_departments = rawDepartments ? rawDepartments.split(',').map(s => s.trim()).filter(Boolean) : []
  
  const eligibility_allowed_genders = formData.get('eligibility_allowed_genders') as string
  
  const eligibility_criteria = {
    min_cgpa: eligibility_min_cgpa,
    min_10th: eligibility_min_10th,
    min_12th: eligibility_min_12th,
    max_active_backlogs: eligibility_max_active_backlogs,
    max_historical_backlogs: eligibility_max_historical_backlogs,
    allowed_departments: eligibility_allowed_departments,
    allowed_genders: eligibility_allowed_genders && eligibility_allowed_genders !== 'any' ? [eligibility_allowed_genders] : []
  }

  if (!title || !description || !status || !company_name) return { error: 'Missing required fields.' }

  // Uses standard RLS. The policy enforces that college_id must match auth_college_id()
  const { error } = await supabase.from('jobs').insert({
    title,
    description,
    status,
    company_name,
    compensation_ctc,
    compensation_fixed,
    compensation_variable,
    application_deadline: application_deadline ? new Date(application_deadline).toISOString() : null,
    college_id: collegeId,
    eligibility_criteria,
    created_by: user.id
  })

  if (error) return { error: error.message }

  revalidatePath('/college/jobs')
  return { success: 'Local job created successfully!' }
}

export async function blacklistStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'superadmin')) {
    return { error: 'Unauthorized. Only Admins can blacklist students.' }
  }

  const studentId = formData.get('studentId') as string
  const reason = formData.get('reason') as string

  if (!studentId || !reason) return { error: 'Student ID and Reason are required.' }

  const { error } = await supabase
    .from('students')
    .update({ is_blacklisted: true, blacklist_reason: reason })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/college/students')
  return { success: 'Student has been blacklisted.' }
}

export async function removeBlacklist(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'superadmin')) {
    return { error: 'Unauthorized. Only Admins can remove blacklist.' }
  }

  const studentId = formData.get('studentId') as string
  const collegeId = user.app_metadata.college_id

  if (!studentId || !collegeId) return { error: 'Student ID and College ID are required.' }

  // Smart Auto-Resolve: fetch current counters and college policies
  const { data: student } = await supabase
    .from('students')
    .select('policy_counters')
    .eq('id', studentId)
    .single()

  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', collegeId)
    .single()

  let updatedCounters = student?.policy_counters || {}
  
  if (policyDoc && policyDoc.config) {
    const c = policyDoc.config

    // Evaluate each counter against its limit and subtract its specific reinstatement_chances if >= limit
    if (c.non_participation?.enabled && updatedCounters.non_participation >= (c.non_participation.max_allowed ?? Infinity)) {
      updatedCounters.non_participation = Math.max(0, updatedCounters.non_participation - (c.non_participation.reinstatement_chances ?? 1))
    }
    if (c.no_show?.enabled && updatedCounters.no_shows >= (c.no_show.max_allowed ?? Infinity)) {
      updatedCounters.no_shows = Math.max(0, updatedCounters.no_shows - (c.no_show.reinstatement_chances ?? 1))
    }
    if (c.withdrawal?.enabled && updatedCounters.withdrawals >= (c.withdrawal.max_allowed ?? Infinity)) {
      updatedCounters.withdrawals = Math.max(0, updatedCounters.withdrawals - (c.withdrawal.reinstatement_chances ?? 1))
    }
    if (c.post_shortlist_withdrawal?.enabled && updatedCounters.post_shortlist_withdrawals >= (c.post_shortlist_withdrawal.max_allowed ?? Infinity)) {
      updatedCounters.post_shortlist_withdrawals = Math.max(0, updatedCounters.post_shortlist_withdrawals - (c.post_shortlist_withdrawal.reinstatement_chances ?? 1))
    }
    if (c.disciplinary?.enabled && updatedCounters.disciplinary >= (c.disciplinary.max_allowed ?? Infinity)) {
      updatedCounters.disciplinary = Math.max(0, updatedCounters.disciplinary - (c.disciplinary.reinstatement_chances ?? 1))
    }
    if (c.integrity?.enabled && updatedCounters.integrity >= (c.integrity.max_allowed ?? Infinity)) {
      updatedCounters.integrity = Math.max(0, updatedCounters.integrity - (c.integrity.reinstatement_chances ?? 1))
    }
  }

  const { error } = await supabase
    .from('students')
    .update({ 
      is_blacklisted: false, 
      blacklist_reason: null,
      policy_counters: updatedCounters
    })
    .eq('id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/college/students')
  return { success: 'Blacklist removed and counters auto-resolved.' }
}

export async function updateApplicationStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  const applicationId = formData.get('applicationId') as string
  const newStatus = formData.get('status') as string // e.g. 'dropped', 'hired'
  const droppedReason = formData.get('dropped_reason') as string | null

  if (!applicationId || !newStatus) return { error: 'Missing required fields.' }

  // Fetch application, student, and policies
  const { data: application } = await supabase
    .from('applications')
    .select('student_id, status, job_id, students(policy_counters)')
    .eq('id', applicationId)
    .single()

  if (!application) return { error: 'Application not found.' }

  const studentId = application.student_id
  let counters = (application.students as any)?.policy_counters || {}
  
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', collegeId)
    .single()

  const config = policyDoc?.config || {}
  let autoBlacklistReason = null

  // Process dropped reasons and increment counters
  if (newStatus === 'dropped' && droppedReason) {
    if (droppedReason === 'no_show') {
      counters.no_shows = (counters.no_shows || 0) + 1
      if (config.no_show?.enabled && counters.no_shows >= config.no_show.max_allowed) {
        autoBlacklistReason = 'Auto-Blacklist: Exceeded No-Show Limit'
      }
    } else if (droppedReason === 'student_withdrew') {
      counters.withdrawals = (counters.withdrawals || 0) + 1
      if (config.withdrawal?.enabled && counters.withdrawals >= config.withdrawal.max_allowed) {
        autoBlacklistReason = 'Auto-Blacklist: Exceeded Withdrawal Limit'
      }
    } else if (droppedReason === 'student_withdrew_post_shortlist') {
      counters.post_shortlist_withdrawals = (counters.post_shortlist_withdrawals || 0) + 1
      if (config.post_shortlist_withdrawal?.enabled && counters.post_shortlist_withdrawals >= config.post_shortlist_withdrawal.max_allowed) {
        autoBlacklistReason = 'Auto-Blacklist: Exceeded Post-Shortlist Withdrawal Limit'
      }
    } else if (droppedReason === 'unprofessional_conduct') {
      counters.disciplinary = (counters.disciplinary || 0) + 1
      if (config.disciplinary?.enabled && counters.disciplinary >= config.disciplinary.max_allowed) {
        autoBlacklistReason = 'Auto-Blacklist: Exceeded Disciplinary Limit'
      }
    } else if (droppedReason === 'data_fraud') {
      counters.integrity = (counters.integrity || 0) + 1
      if (config.integrity?.enabled && counters.integrity >= config.integrity.max_allowed) {
        autoBlacklistReason = 'Auto-Blacklist: Integrity/Fraud Violation'
      }
    } else if (droppedReason === 'revoked_by_company') {
      // Refund upgrade attempt if used for this job
      if (counters.upgrades_used > 0) {
        counters.upgrades_used -= 1
      }
      // "Placed" block is automatically removed because status changes to 'dropped' instead of 'hired'
    }
  } else if (newStatus === 'offer_declined') { // Note: offer_declined or similar terminal state
    counters.offer_rejections = (counters.offer_rejections || 0) + 1
    if (config.offer_rejection?.enabled && counters.offer_rejections >= config.offer_rejection.max_allowed) {
      autoBlacklistReason = 'Auto-Blacklist: Offer Rejection Limit Reached'
    }
  }

  // Transaction-like update
  await supabase
    .from('applications')
    .update({ status: newStatus, dropped_reason: droppedReason })
    .eq('id', applicationId)

  const studentUpdatePayload: any = { policy_counters: counters }
  if (autoBlacklistReason) {
    studentUpdatePayload.is_blacklisted = true
    studentUpdatePayload.blacklist_reason = autoBlacklistReason
  }

  await supabase
    .from('students')
    .update(studentUpdatePayload)
    .eq('id', studentId)

  revalidatePath('/college/students')
  revalidatePath(`/college/jobs/${application.job_id}`)
  
  return { success: 'Application status updated.' }
}


