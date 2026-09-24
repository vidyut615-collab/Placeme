'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
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

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Administrators can edit college profile details.' }
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

  revalidatePath('/college/profile')
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
  const rawDeadline = (formData.get('application_deadline') as string)?.trim() || null
  const application_deadline = rawDeadline
    ? (rawDeadline.includes('T') ? rawDeadline : `${rawDeadline}T23:59:59.999Z`)
    : null

  const rawJobType = formData.get('job_type_id') as string
  const job_type_id = rawJobType && rawJobType !== 'none' ? rawJobType : null

  const rawLevel = formData.get('placement_level_id') as string
  const placement_level_id = rawLevel && rawLevel !== 'none' ? rawLevel : null

  const rawCategory = formData.get('placement_category_id') as string
  const placement_category_id = rawCategory && rawCategory !== 'none' ? rawCategory : null

  const rawCycle = formData.get('cycle_id') as string
  const cycle_id = rawCycle && rawCycle !== 'none' ? rawCycle : null

  const eligibility_min_cgpa = formData.get('eligibility_min_cgpa') ? Number(formData.get('eligibility_min_cgpa')) : null
  const eligibility_min_10th = formData.get('eligibility_min_10th') ? Number(formData.get('eligibility_min_10th')) : null
  const eligibility_min_12th = formData.get('eligibility_min_12th') ? Number(formData.get('eligibility_min_12th')) : null
  const eligibility_max_active_backlogs = formData.get('eligibility_max_active_backlogs') ? Number(formData.get('eligibility_max_active_backlogs')) : null
  const eligibility_max_historical_backlogs = formData.get('eligibility_max_historical_backlogs') ? Number(formData.get('eligibility_max_historical_backlogs')) : null
  
  const rawDepartments = formData.get('eligibility_allowed_departments') as string
  const eligibility_allowed_departments = rawDepartments ? rawDepartments.split(',').map(s => s.trim()).filter(Boolean) : []

  const rawDegrees = formData.get('eligibility_allowed_degrees') as string
  const eligibility_allowed_degrees = rawDegrees ? rawDegrees.split(',').map(s => s.trim()).filter(Boolean) : []

  const rawYears = formData.get('eligibility_allowed_years') as string
  const eligibility_allowed_years = rawYears ? rawYears.split(',').map(s => s.trim()).filter(Boolean) : []
  
  const eligibility_allowed_genders = formData.get('eligibility_allowed_genders') as string
  
  const eligibility_criteria = {
    min_cgpa: eligibility_min_cgpa,
    min_10th: eligibility_min_10th,
    min_12th: eligibility_min_12th,
    max_active_backlogs: eligibility_max_active_backlogs,
    max_historical_backlogs: eligibility_max_historical_backlogs,
    allowed_departments: eligibility_allowed_departments,
    allowed_degrees: eligibility_allowed_degrees,
    allowed_years: eligibility_allowed_years,
    allowed_genders: eligibility_allowed_genders && eligibility_allowed_genders !== 'any' ? [eligibility_allowed_genders] : []
  }

  const stage_1_label = (formData.get('stage_1_label') as string)?.trim() || null
  const stage_2_label = (formData.get('stage_2_label') as string)?.trim() || null
  const stage_3_label = (formData.get('stage_3_label') as string)?.trim() || null

  const custom_stages: Record<string, string> = {}
  if (stage_1_label) custom_stages.stage_1 = stage_1_label
  if (stage_2_label) custom_stages.stage_2 = stage_2_label
  if (stage_3_label) custom_stages.stage_3 = stage_3_label

  // Extended job fields
  const workplace_mode = (formData.get('workplace_mode') as string) || 'On-Site'
  const job_location = (formData.get('job_location') as string)?.trim() || null
  const employment_type = (formData.get('employment_type') as string) || 'Full-time'

  const isInternshipType = employment_type === 'Internship' || employment_type === 'Intern+PPO'
  const internship_stipend = isInternshipType && formData.get('internship_stipend') ? Number(formData.get('internship_stipend')) : null
  const internship_duration = isInternshipType ? ((formData.get('internship_duration') as string)?.trim() || null) : null

  const has_bond = formData.get('has_bond') === 'true'
  const bond_duration = has_bond ? ((formData.get('bond_duration') as string)?.trim() || null) : null
  const bond_penalty_amount = has_bond && formData.get('bond_penalty_amount') ? Number(formData.get('bond_penalty_amount')) : null

  const job_domain = (formData.get('job_domain') as string)?.trim() || null
  const skills_required = (formData.get('skills_required') as string)?.trim() || null
  const drive_mode = (formData.get('drive_mode') as string) || 'Virtual / Online'
  const jd_attachment_url = (formData.get('jd_attachment_url') as string)?.trim() || null
  const jd_attachment_name = (formData.get('jd_attachment_name') as string)?.trim() || null

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
    job_type_id,
    placement_level_id,
    placement_category_id,
    cycle_id,
    eligibility_criteria,
    custom_stages,
    workplace_mode,
    job_location,
    employment_type,
    internship_stipend,
    internship_duration,
    has_bond,
    bond_duration,
    bond_penalty_amount,
    job_domain,
    skills_required,
    drive_mode,
    jd_attachment_url,
    jd_attachment_name,
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

export async function updateCollegeAcademicConfig(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized. Only College Admins can update academic configuration.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    return { error: 'No college associated with this account.' }
  }

  let onboarding_fields = { years: [] as string[], types: [] as string[], departments: [] as string[] }
  const fieldsJson = formData.get('onboarding_fields_json') as string
  if (fieldsJson) {
    try {
      onboarding_fields = JSON.parse(fieldsJson)
    } catch (e) {
      return { error: 'Invalid configuration format.' }
    }
  } else {
    const yearsRaw = formData.get('years') as string
    const typesRaw = formData.get('types') as string
    const deptsRaw = formData.get('departments') as string

    onboarding_fields = {
      years: yearsRaw ? yearsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
      types: typesRaw ? typesRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
      departments: deptsRaw ? deptsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    }
  }

  const { error } = await supabase
    .from('colleges')
    .update({ onboarding_fields })
    .eq('id', collegeId)

  if (error) return { error: error.message }

  // Process cascading renames across students, pending requests, and jobs
  const renamesJson = formData.get('renames_json') as string
  let totalStudentsMigrated = 0

  if (renamesJson) {
    try {
      const renames: Array<{ category: string, oldValue: string, newValue: string }> = JSON.parse(renamesJson)
      const fieldMap: Record<string, string> = {
        departments: 'department',
        types: 'type',
        years: 'year'
      }

      for (const rename of renames) {
        const field = fieldMap[rename.category]
        if (field && rename.oldValue && rename.newValue && rename.oldValue !== rename.newValue) {
          const { data: res, error: rpcErr } = await supabase.rpc('cascade_rename_academic_field', {
            p_college_id: collegeId,
            p_field: field,
            p_old_val: rename.oldValue,
            p_new_val: rename.newValue
          })

          if (!rpcErr && res?.students_updated) {
            totalStudentsMigrated += res.students_updated
          }
        }
      }
    } catch (e) {
      console.error('Failed to cascade academic renames:', e)
    }
  }

  revalidatePath('/college/settings')
  revalidatePath('/college/students')

  const successMsg = totalStudentsMigrated > 0
    ? `Academic lists updated! Automatically migrated ${totalStudentsMigrated} student profile(s) to match the new names.`
    : 'Academic lists configuration updated successfully!'

  return { success: successMsg }
}

export async function advanceCandidatesBatch({
  applicationIds,
  targetStage,
  jobId,
}: {
  applicationIds: string[]
  targetStage: string
  jobId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized. Only College Coordinators can advance candidates.' }
  }

  if (!applicationIds || applicationIds.length === 0) {
    return { error: 'No candidates selected.' }
  }

  // Fetch current applications to capture from_status for each
  const { data: applications, error: fetchErr } = await supabase
    .from('applications')
    .select('id, status, student_id')
    .in('id', applicationIds)

  if (fetchErr || !applications || applications.length === 0) {
    return { error: `Failed to find applications: ${fetchErr?.message || 'None found'}` }
  }

  // Update applications in batch
  const { error: updateErr } = await supabase
    .from('applications')
    .update({ 
      status: targetStage,
      updated_at: new Date().toISOString()
    })
    .in('id', applicationIds)

  if (updateErr) {
    return { error: `Failed to advance candidates: ${updateErr.message}` }
  }

  // Insert audit history rows for each candidate
  const historyRows = applications.map(app => ({
    application_id: app.id,
    from_status: app.status,
    to_status: targetStage,
    changed_by: user.id,
    reason: `Advanced to ${targetStage}`,
    created_at: new Date().toISOString()
  }))

  const { error: histErr } = await supabase
    .from('application_stage_history')
    .insert(historyRows)

  if (histErr) {
    console.error('Audit trail insert error in advanceCandidatesBatch:', histErr)
  }

  revalidatePath(`/college/jobs/${jobId}`)
  return { success: `Successfully advanced ${applications.length} candidate(s) to ${targetStage}.` }
}

export async function closeCandidatesBatch({
  applicationIds,
  reason,
  notes,
  jobId,
}: {
  applicationIds: string[]
  reason: string
  notes?: string
  jobId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized. Only College Coordinators can close candidates.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!applicationIds || applicationIds.length === 0) {
    return { error: 'No candidates selected.' }
  }

  // Fetch applications with their student policy counters
  const { data: applications, error: fetchErr } = await supabase
    .from('applications')
    .select('id, status, student_id, students(id, policy_counters, is_blacklisted)')
    .in('id', applicationIds)

  if (fetchErr || !applications || applications.length === 0) {
    return { error: `Failed to find applications: ${fetchErr?.message || 'None found'}` }
  }

  // Fetch college policy config
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', collegeId)
    .single()

  const config = policyDoc?.config || {}

  const fullReasonText = notes?.trim() ? `${reason} — ${notes.trim()}` : reason

  // Update applications in batch to dropped
  const { error: updateErr } = await supabase
    .from('applications')
    .update({
      status: 'dropped',
      dropped_reason: fullReasonText,
      updated_at: new Date().toISOString()
    })
    .in('id', applicationIds)

  if (updateErr) {
    return { error: `Failed to close candidates: ${updateErr.message}` }
  }

  // Create audit records for every closed student
  const historyRows = applications.map(app => ({
    application_id: app.id,
    from_status: app.status,
    to_status: 'dropped',
    changed_by: user.id,
    reason: fullReasonText,
    created_at: new Date().toISOString()
  }))

  const { error: histErr } = await supabase
    .from('application_stage_history')
    .insert(historyRows)

  if (histErr) {
    console.error('Audit trail insert error in closeCandidatesBatch:', histErr)
  }

  // Process strike penalties if this reason is an infraction
  const isWithdrawalInfraction = reason.toLowerCase().includes('voluntarily backed out') || reason.toLowerCase().includes('withdrew')
  const isNoShowInfraction = reason.toLowerCase().includes('absent') || reason.toLowerCase().includes('no-show')
  const isDisciplinaryInfraction = reason.toLowerCase().includes('disciplinary') || reason.toLowerCase().includes('unprofessional')
  const isFraudInfraction = reason.toLowerCase().includes('fraud') || reason.toLowerCase().includes('forgery')
  const isOfferRevoked = reason.toLowerCase().includes('revoked by company')

  for (const app of applications) {
    const student = app.students as any
    if (!student) continue

    let counters = student.policy_counters || {}
    let autoBlacklistReason: string | null = null

    if (isNoShowInfraction) {
      counters.no_shows = (counters.no_shows || 0) + 1
      if (config.no_show?.enabled && counters.no_shows >= (config.no_show.max_allowed || 3)) {
        autoBlacklistReason = 'Auto-Blacklist: Exceeded No-Show Limit'
      }
    } else if (isWithdrawalInfraction) {
      if (app.status === 'shortlisted' || app.status === 'hired') {
        counters.post_shortlist_withdrawals = (counters.post_shortlist_withdrawals || 0) + 1
        if (config.post_shortlist_withdrawal?.enabled && counters.post_shortlist_withdrawals >= (config.post_shortlist_withdrawal.max_allowed || 1)) {
          autoBlacklistReason = 'Auto-Blacklist: Exceeded Post-Shortlist Withdrawal Limit'
        }
      } else {
        counters.withdrawals = (counters.withdrawals || 0) + 1
        if (config.withdrawal?.enabled && counters.withdrawals >= (config.withdrawal.max_allowed || 2)) {
          autoBlacklistReason = 'Auto-Blacklist: Exceeded Application Withdrawal Limit'
        }
      }
    } else if (isDisciplinaryInfraction) {
      counters.disciplinary = (counters.disciplinary || 0) + 1
      if (config.disciplinary?.enabled && counters.disciplinary >= (config.disciplinary.max_allowed || 1)) {
        autoBlacklistReason = 'Auto-Blacklist: Disciplinary Strike Limit Reached'
      }
    } else if (isFraudInfraction) {
      counters.integrity = (counters.integrity || 0) + 1
      autoBlacklistReason = 'Auto-Blacklist: Resume / Credential Fraud'
    } else if (isOfferRevoked) {
      if (counters.upgrades_used > 0) {
        counters.upgrades_used -= 1
      }
    }

    // Only update student if counters changed or blacklisted
    if (isNoShowInfraction || isWithdrawalInfraction || isDisciplinaryInfraction || isFraudInfraction || isOfferRevoked) {
      const studentUpdatePayload: any = { policy_counters: counters }
      if (autoBlacklistReason) {
        studentUpdatePayload.is_blacklisted = true
        studentUpdatePayload.blacklist_reason = autoBlacklistReason
      }
      await supabase
        .from('students')
        .update(studentUpdatePayload)
        .eq('id', student.id)
    }
  }

  revalidatePath(`/college/jobs/${jobId}`)
  revalidatePath('/college/students')
  return { success: `Successfully closed ${applications.length} candidate(s).` }
}

export async function reinstateCandidate({
  applicationId,
  jobId,
}: {
  applicationId: string
  jobId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized. Only College Coordinators can reinstate candidates.' }
  }

  // Find the most recent history entry where to_status was 'dropped'
  const { data: history } = await supabase
    .from('application_stage_history')
    .select('from_status')
    .eq('application_id', applicationId)
    .eq('to_status', 'dropped')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // The exit stage to restore to; default to 'applied' if no history found
  const restoreToStage = history?.from_status || 'applied'

  const { error: updateErr } = await supabase
    .from('applications')
    .update({
      status: restoreToStage,
      dropped_reason: null,
      is_withdrawn: false,
      withdrawn_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)

  if (updateErr) {
    return { error: `Failed to reinstate candidate: ${updateErr.message}` }
  }

  // Log reinstatement to audit trail
  await supabase
    .from('application_stage_history')
    .insert({
      application_id: applicationId,
      from_status: 'dropped',
      to_status: restoreToStage,
      changed_by: user.id,
      reason: `Reinstated back to ${restoreToStage} by coordinator`,
      created_at: new Date().toISOString()
    })

  revalidatePath(`/college/jobs/${jobId}`)
  return { success: `Candidate successfully reinstated back to ${restoreToStage}.` }
}

export async function approveStudentOffer(offerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  // Fetch offer details
  const { data: offer, error: fetchErr } = await supabase
    .from('student_offers')
    .select('*, students(id, user_id, college_id)')
    .eq('id', offerId)
    .single()

  if (fetchErr || !offer) {
    return { error: 'Offer declaration not found.' }
  }

  // 1. Mark offer as approved
  const { error: updateErr } = await supabase
    .from('student_offers')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)

  if (updateErr) {
    return { error: `Failed to approve offer: ${updateErr.message}` }
  }

  // 1.5 Log the approval in approval_logs
  await supabase.from('approval_logs').insert({
    college_id: offer.college_id,
    entity_type: 'placement_offer',
    entity_id: offerId,
    student_id: offer.student_id,
    action_by: user.id,
    status: 'approved',
    snapshot_data: {
      company_name: offer.company_name,
      job_role: offer.job_role,
      compensation_ctc: offer.compensation_ctc,
      offer_type: offer.offer_type,
      offer_letter_url: offer.offer_letter_url,
    }
  })

  // 2. If tied to an on-campus job, update application to 'hired'
  if (offer.job_id && offer.student_id) {
    const { data: appRow } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', offer.job_id)
      .eq('student_id', offer.student_id)
      .maybeSingle()

    if (appRow) {
      await supabase
        .from('applications')
        .update({
          status: 'hired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appRow.id)

      await supabase
        .from('application_stage_history')
        .insert({
          application_id: appRow.id,
          from_status: appRow.status,
          to_status: 'hired',
          changed_by: user.id,
          reason: `Offer officially verified & approved by college coordinator (${offer.company_name} — ₹${offer.compensation_ctc} LPA)`,
          created_at: new Date().toISOString(),
        })
    }
  }

  revalidatePath('/college/approvals')
  revalidatePath('/college/placed-students')
  revalidatePath('/college/students')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/profile')
  revalidatePath('/student/applications')
  if (offer.job_id) {
    revalidatePath(`/college/jobs/${offer.job_id}`)
  }

  return { success: `Offer for ${offer.company_name} successfully verified and approved! Student is now officially registered as Placed.` }
}

export async function rejectStudentOffer({
  offerId,
  reason,
}: {
  offerId: string
  reason: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  if (!reason.trim()) {
    return { error: 'Rejection reason is required.' }
  }

  // Fetch offer details to log them
  const { data: offer, error: fetchErr } = await supabase
    .from('student_offers')
    .select('*')
    .eq('id', offerId)
    .single()

  if (fetchErr || !offer) {
    return { error: 'Offer declaration not found.' }
  }

  const { error } = await supabase
    .from('student_offers')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)

  if (error) {
    return { error: `Failed to reject offer: ${error.message}` }
  }

  // Log the rejection in approval_logs
  await supabase.from('approval_logs').insert({
    college_id: offer.college_id,
    entity_type: 'placement_offer',
    entity_id: offerId,
    student_id: offer.student_id,
    action_by: user.id,
    status: 'rejected',
    reason: reason.trim(),
    snapshot_data: {
      company_name: offer.company_name,
      job_role: offer.job_role,
      compensation_ctc: offer.compensation_ctc,
      offer_type: offer.offer_type,
      offer_letter_url: offer.offer_letter_url,
    }
  })

  revalidatePath('/college/approvals')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/profile')
  revalidatePath('/student/applications')
  return { success: 'Offer declaration rejected.' }
}

export async function createPlacementCycle({
  name,
  startDate,
  endDate,
  isActive = true,
}: {
  name: string
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Administrators can create placement cycles.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    return { error: 'College ID not found.' }
  }

  if (!name.trim()) {
    return { error: 'Placement cycle name is required.' }
  }

  // If new cycle is set as active, deactivate other cycles for this college
  if (isActive) {
    await supabase
      .from('placement_cycles')
      .update({ is_active: false })
      .eq('college_id', collegeId)
  }

  const { data: cycle, error } = await supabase
    .from('placement_cycles')
    .insert({
      college_id: collegeId,
      name: name.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: isActive,
    })
    .select()
    .single()

  if (error) {
    return { error: `Failed to create placement cycle: ${error.message}` }
  }

  revalidatePath('/college/placement-cycles')
  revalidatePath('/college/settings')
  revalidatePath('/college/jobs')
  revalidatePath('/college/policies')
  return { success: 'Placement cycle created successfully!', cycle }
}

export async function togglePlacementCycleActive(cycleId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Administrators can manage placement cycle status.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    return { error: 'College ID not found.' }
  }

  // If activating this cycle, deactivate others
  if (isActive) {
    await supabase
      .from('placement_cycles')
      .update({ is_active: false })
      .eq('college_id', collegeId)
  }

  const { error } = await supabase
    .from('placement_cycles')
    .update({ is_active: isActive })
    .eq('id', cycleId)
    .eq('college_id', collegeId)

  if (error) {
    return { error: `Failed to update cycle status: ${error.message}` }
  }

  revalidatePath('/college/placement-cycles')
  revalidatePath('/college/settings')
  revalidatePath('/college/jobs')
  return { success: isActive ? 'Cycle set as active season.' : 'Cycle marked as inactive.' }
}

export async function deletePlacementCycle(cycleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Administrators can delete placement cycles.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    return { error: 'College ID not found.' }
  }

  const { error } = await supabase
    .from('placement_cycles')
    .delete()
    .eq('id', cycleId)
    .eq('college_id', collegeId)

  if (error) {
    return { error: `Failed to delete cycle: ${error.message}` }
  }

  revalidatePath('/college/placement-cycles')
  revalidatePath('/college/settings')
  revalidatePath('/college/jobs')
  return { success: 'Placement cycle deleted.' }
}

export async function updateJobDetails(jobId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  // Check if job exists and belongs to this college
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, college_id, status, compensation_ctc')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) {
    return { error: 'Job not found.' }
  }

  if (job.college_id !== collegeId) {
    return { error: 'You do not have permission to edit this job.' }
  }

  // Count existing applications
  const { count: applicantCount } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', jobId)

  const hasApplicants = (applicantCount || 0) > 0

  // Category 1 fields (Always editable):
  const description = formData.get('description') as string
  const rawDeadline = (formData.get('application_deadline') as string)?.trim() || null
  const application_deadline = rawDeadline
    ? (rawDeadline.includes('T') ? rawDeadline : `${rawDeadline}T23:59:59.999Z`)
    : null
  const status = (formData.get('status') as string) || 'active'
  const rawCycle = formData.get('cycle_id') as string
  const cycle_id = rawCycle && rawCycle !== 'none' ? rawCycle : null

  const stage_1_label = (formData.get('stage_1_label') as string)?.trim() || null
  const stage_2_label = (formData.get('stage_2_label') as string)?.trim() || null
  const stage_3_label = (formData.get('stage_3_label') as string)?.trim() || null

  const custom_stages: Record<string, string | null> = {
    stage_1: stage_1_label,
    stage_2: stage_2_label,
    stage_3: stage_3_label,
  }

  // Extended operational fields (always editable)
  const workplace_mode = (formData.get('workplace_mode') as string) || 'On-Site'
  const job_location = (formData.get('job_location') as string)?.trim() || null
  const job_domain = (formData.get('job_domain') as string)?.trim() || null
  const skills_required = (formData.get('skills_required') as string)?.trim() || null
  const drive_mode = (formData.get('drive_mode') as string) || 'Virtual / Online'

  const hasAttachmentField = formData.has('jd_attachment_url')
  const jd_attachment_url = hasAttachmentField ? ((formData.get('jd_attachment_url') as string)?.trim() || null) : undefined
  const jd_attachment_name = hasAttachmentField ? ((formData.get('jd_attachment_name') as string)?.trim() || null) : undefined

  let updatePayload: any = {
    description,
    application_deadline,
    status,
    cycle_id,
    custom_stages,
    workplace_mode,
    job_location,
    job_domain,
    skills_required,
    drive_mode,
    ...(hasAttachmentField ? { jd_attachment_url, jd_attachment_name } : {}),
  }

  // If 0 applicants, allow editing Title, Company, CTC, and Eligibility
  if (!hasApplicants) {
    const title = formData.get('title') as string
    const company_name = formData.get('company_name') as string
    const compensation_ctc = formData.get('compensation_ctc') ? Number(formData.get('compensation_ctc')) : null
    const compensation_fixed = formData.get('compensation_fixed') ? Number(formData.get('compensation_fixed')) : null
    const compensation_variable = formData.get('compensation_variable') ? Number(formData.get('compensation_variable')) : null

    const rawJobType = formData.get('job_type_id') as string
    const job_type_id = rawJobType && rawJobType !== 'none' ? rawJobType : null

    const rawLevel = formData.get('placement_level_id') as string
    const placement_level_id = rawLevel && rawLevel !== 'none' ? rawLevel : null

    const rawCategory = formData.get('placement_category_id') as string
    const placement_category_id = rawCategory && rawCategory !== 'none' ? rawCategory : null

    const eligibility_min_cgpa = formData.get('eligibility_min_cgpa') ? Number(formData.get('eligibility_min_cgpa')) : null
    const eligibility_min_10th = formData.get('eligibility_min_10th') ? Number(formData.get('eligibility_min_10th')) : null
    const eligibility_min_12th = formData.get('eligibility_min_12th') ? Number(formData.get('eligibility_min_12th')) : null
    const eligibility_max_active_backlogs = formData.get('eligibility_max_active_backlogs') ? Number(formData.get('eligibility_max_active_backlogs')) : null
    const eligibility_max_historical_backlogs = formData.get('eligibility_max_historical_backlogs') ? Number(formData.get('eligibility_max_historical_backlogs')) : null

    const rawDepartments = formData.get('eligibility_allowed_departments') as string
    const eligibility_allowed_departments = rawDepartments ? rawDepartments.split(',').map(s => s.trim()).filter(Boolean) : []

    const rawDegrees = formData.get('eligibility_allowed_degrees') as string
    const eligibility_allowed_degrees = rawDegrees ? rawDegrees.split(',').map(s => s.trim()).filter(Boolean) : []

    const rawYears = formData.get('eligibility_allowed_years') as string
    const eligibility_allowed_years = rawYears ? rawYears.split(',').map(s => s.trim()).filter(Boolean) : []

    const eligibility_allowed_genders = formData.get('eligibility_allowed_genders') as string

    const eligibility_criteria = {
      min_cgpa: eligibility_min_cgpa,
      min_10th: eligibility_min_10th,
      min_12th: eligibility_min_12th,
      max_active_backlogs: eligibility_max_active_backlogs,
      max_historical_backlogs: eligibility_max_historical_backlogs,
      allowed_departments: eligibility_allowed_departments,
      allowed_degrees: eligibility_allowed_degrees,
      allowed_years: eligibility_allowed_years,
      allowed_genders: eligibility_allowed_genders && eligibility_allowed_genders !== 'any' ? [eligibility_allowed_genders] : []
    }

    const employment_type = (formData.get('employment_type') as string) || 'Full-time'
    const isInternshipType = employment_type === 'Internship' || employment_type === 'Intern+PPO'
    const internship_stipend = isInternshipType && formData.get('internship_stipend') ? Number(formData.get('internship_stipend')) : null
    const internship_duration = isInternshipType ? ((formData.get('internship_duration') as string)?.trim() || null) : null

    const has_bond = formData.get('has_bond') === 'true'
    const bond_duration = has_bond ? ((formData.get('bond_duration') as string)?.trim() || null) : null
    const bond_penalty_amount = has_bond && formData.get('bond_penalty_amount') ? Number(formData.get('bond_penalty_amount')) : null

    updatePayload = {
      ...updatePayload,
      title,
      company_name,
      compensation_ctc,
      compensation_fixed,
      compensation_variable,
      job_type_id,
      placement_level_id,
      placement_category_id,
      eligibility_criteria,
      employment_type,
      internship_stipend,
      internship_duration,
      has_bond,
      bond_duration,
      bond_penalty_amount,
    }
  }

  const { error: updateErr } = await supabase
    .from('jobs')
    .update(updatePayload)
    .eq('id', jobId)

  if (updateErr) {
    return { error: `Failed to update job: ${updateErr.message}` }
  }

  revalidatePath('/college/jobs')
  revalidatePath(`/college/jobs/${jobId}`)
  revalidatePath('/student/jobs')
  return { success: 'Job details updated successfully.' }
}

export async function cancelOrDeleteJob({
  jobId,
  reason,
}: {
  jobId: string
  reason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  // Check job ownership
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, college_id, title, company_name, compensation_ctc')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) {
    return { error: 'Job not found.' }
  }

  if (job.college_id !== collegeId) {
    return { error: 'You do not have permission to modify this job.' }
  }

  // Fetch all applications
  const { data: apps } = await supabase
    .from('applications')
    .select('id, student_id, status')
    .eq('job_id', jobId)

  const applicantCount = apps?.length || 0

  if (applicantCount === 0) {
    // 0 applicants: Safe to hard delete permanently
    const { error: deleteErr } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (deleteErr) {
      return { error: `Failed to delete job: ${deleteErr.message}` }
    }

    revalidatePath('/college/jobs')
    return { success: 'Job deleted permanently.', action: 'deleted' }
  }

  // Has applicants: CANCEL / SCRAP DRIVE
  const cancellationReason = reason?.trim() || 'Drive cancelled by college administration'
  const now = new Date().toISOString()

  // 1. Mark job as cancelled
  const { error: cancelJobErr } = await supabase
    .from('jobs')
    .update({
      status: 'cancelled',
      cancellation_reason: cancellationReason,
      cancelled_at: now,
    })
    .eq('id', jobId)

  if (cancelJobErr) {
    return { error: `Failed to cancel drive: ${cancelJobErr.message}` }
  }

  // 2. Mark all applications as cancelled
  await supabase
    .from('applications')
    .update({
      status: 'cancelled',
    })
    .eq('job_id', jobId)

  // 3. Log audit history for all candidates
  const historyEntries = (apps || []).map(a => ({
    application_id: a.id,
    from_status: a.status,
    to_status: 'cancelled',
    changed_by: user.id,
    reason: `Drive scrapped by college: ${cancellationReason}`,
    created_at: now,
  }))

  if (historyEntries.length > 0) {
    await supabase
      .from('application_stage_history')
      .insert(historyEntries)
  }

  // 4. Refund policy counters for students who applied (if any had used upgrades or dream attempts)
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', collegeId)
    .maybeSingle()

  const config = policyDoc?.config || {}
  const jobCtc = job.compensation_ctc || 0
  const isSuperDream = config.super_dream?.enabled && jobCtc >= (config.super_dream?.min_ctc || 20)
  const isDream = config.dream?.enabled && jobCtc >= (config.dream?.min_ctc || 10)

  // Refund affected students
  const studentIds = Array.from(new Set((apps || []).map(a => a.student_id)))
  for (const sId of studentIds) {
    const { data: stu } = await supabase
      .from('students')
      .select('id, policy_counters')
      .eq('id', sId)
      .single()

    if (stu?.policy_counters) {
      const counters = { ...stu.policy_counters }
      let changed = false
      if (isSuperDream && (counters.super_dream_attempts || 0) > 0) {
        counters.super_dream_attempts = Math.max(0, counters.super_dream_attempts - 1)
        changed = true
      } else if (isDream && (counters.dream_attempts || 0) > 0) {
        counters.dream_attempts = Math.max(0, counters.dream_attempts - 1)
        changed = true
      }
      if (changed) {
        await supabase
          .from('students')
          .update({ policy_counters: counters })
          .eq('id', sId)
      }
    }
  }

  revalidatePath('/college/jobs')
  revalidatePath(`/college/jobs/${jobId}`)
  revalidatePath('/student/jobs')
  revalidatePath('/student/applications')
  revalidatePath('/student/dashboard')

  return {
    success: `Recruitment drive scrapped successfully. All ${applicantCount} candidate quotas have been restored with 0 penalties.`,
    action: 'cancelled'
  }
}

export async function toggleJobPause(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, college_id, status')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) return { error: 'Job not found.' }
  if (job.college_id !== collegeId) return { error: 'You do not have permission to modify this job.' }

  if (job.status === 'completed' || job.status === 'cancelled') {
    return { error: `Cannot pause or resume a drive that is already ${job.status}.` }
  }

  const newStatus = job.status === 'paused' ? 'active' : 'paused'

  const { error: updateErr } = await supabase
    .from('jobs')
    .update({ status: newStatus })
    .eq('id', jobId)

  if (updateErr) return { error: `Failed to update status: ${updateErr.message}` }

  revalidatePath('/college/jobs')
  revalidatePath(`/college/jobs/${jobId}`)
  revalidatePath('/student/jobs')

  return {
    success: newStatus === 'paused'
      ? 'Applications paused. Students can view the job posting, but new applications are frozen.'
      : 'Applications resumed. Students can now submit applications.',
    status: newStatus,
  }
}

export async function checkJobCompletionReadiness(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, college_id, title, status')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) return { error: 'Job not found.' }
  if (job.college_id !== collegeId) return { error: 'You do not have permission to modify this job.' }

  const { data: apps, error: appsErr } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      students (
        id,
        profile_data,
        users (
          email
        )
      )
    `)
    .eq('job_id', jobId)

  if (appsErr) return { error: appsErr.message }

  const closedStatuses = ['dropped', 'rejected', 'withdrawn', 'forfeited', 'cancelled']
  const inProgressStatuses = ['applied', 'screened', 'ppt', 'stage1', 'stage2', 'stage3', 'shortlisted']

  const allApps = apps || []
  const hiredCount = allApps.filter(a => a.status === 'hired' || a.status === 'offer_accepted').length
  const closedCount = allApps.filter(a => closedStatuses.includes(a.status)).length
  const inProgressApps = allApps.filter(a => inProgressStatuses.includes(a.status))

  return {
    jobTitle: job.title,
    currentJobStatus: job.status,
    totalApplicants: allApps.length,
    hiredCount,
    closedCount,
    inProgressCount: inProgressApps.length,
    inProgressApplicants: inProgressApps.map(a => {
      const student = a.students as any
      const rawUsers = student?.users
      const userEmail = Array.isArray(rawUsers) ? rawUsers[0]?.email : rawUsers?.email
      
      const profileName = student?.profile_data?.personal?.full_name || 
                          student?.profile_data?.full_name || 
                          'Unnamed Candidate'
                          
      const email = userEmail || 
                    student?.profile_data?.personal?.email || 
                    student?.profile_data?.email || 
                    ''
                    
      return {
        id: a.id,
        status: a.status,
        name: profileName,
        email: email,
        rollNumber: student?.profile_data?.roll_number || student?.profile_data?.personal?.roll_number || 'N/A',
      }
    }),
  }
}

export async function completeJob({
  jobId,
  bulkDropRemaining = false,
  massDropReason = 'Not Selected (Drive Concluded)',
}: {
  jobId: string
  bulkDropRemaining?: boolean
  massDropReason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, college_id, title, status')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) return { error: 'Job not found.' }
  if (job.college_id !== collegeId) return { error: 'You do not have permission to modify this job.' }

  if (job.status === 'completed') {
    return { error: 'This recruitment drive is already marked as completed.' }
  }
  if (job.status === 'cancelled') {
    return { error: 'Cannot complete a recruitment drive that has been cancelled/scrapped.' }
  }

  // Fetch all applications
  const { data: apps, error: appsErr } = await supabase
    .from('applications')
    .select('id, status')
    .eq('job_id', jobId)

  if (appsErr) return { error: appsErr.message }

  const inProgressStatuses = ['applied', 'screened', 'ppt', 'stage1', 'stage2', 'stage3', 'shortlisted']
  const inProgressApps = (apps || []).filter(a => inProgressStatuses.includes(a.status))

  if (inProgressApps.length > 0 && !bulkDropRemaining) {
    return {
      error: `There are still ${inProgressApps.length} candidates in progress. Please review them or choose the bulk closure option.`,
      hasRemaining: true,
      remainingCount: inProgressApps.length,
    }
  }

  const now = new Date().toISOString()

  // If bulk dropping remaining candidates, update them to 'dropped'
  if (inProgressApps.length > 0 && bulkDropRemaining) {
    const inProgressIds = inProgressApps.map(a => a.id)

    const { error: dropErr } = await supabase
      .from('applications')
      .update({
        status: 'dropped',
        dropped_reason: massDropReason,
        updated_at: now,
      })
      .in('id', inProgressIds)

    if (dropErr) {
      return { error: `Failed to update remaining candidates: ${dropErr.message}` }
    }

    // Insert audit history for each dropped candidate
    const historyEntries = inProgressApps.map(a => ({
      application_id: a.id,
      from_status: a.status,
      to_status: 'dropped',
      changed_by: user.id,
      reason: massDropReason,
      created_at: now,
    }))

    await supabase.from('application_stage_history').insert(historyEntries)
  }

  // Mark job as completed
  const { error: completeErr } = await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: now,
    })
    .eq('id', jobId)

  if (completeErr) {
    return { error: `Failed to complete drive: ${completeErr.message}` }
  }

  revalidatePath('/college/jobs')
  revalidatePath(`/college/jobs/${jobId}`)
  revalidatePath('/student/jobs')
  revalidatePath('/student/applications')

  return {
    success: `Recruitment drive for "${job.title}" marked as Completed successfully!`,
  }
}

export async function recordNonApplicantResolution({
  jobId,
  studentId,
  action,
  customReason,
}: {
  jobId: string
  studentId: string
  action: 'excuse' | 'penalize'
  customReason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  // 1. Verify job ownership
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, college_id, title')
    .eq('id', jobId)
    .single()

  if (jobErr || !job || job.college_id !== collegeId) {
    return { error: 'Job not found or permission denied.' }
  }

  // 2. Check if student already has an application
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existingApp) {
    return { error: 'This student already has an application record for this drive.' }
  }

  // 3. Fetch student & college placement policy
  const [
    { data: student },
    { data: policyDoc }
  ] = await Promise.all([
    supabase.from('students').select('id, policy_counters, is_blacklisted').eq('id', studentId).single(),
    supabase.from('placement_policies').select('config').eq('college_id', collegeId).maybeSingle()
  ])

  if (!student) return { error: 'Student not found.' }

  const now = new Date().toISOString()
  const droppedReason = action === 'excuse' ? 'excused_absence' : 'non_participation'
  const reasonText = customReason?.trim() || (action === 'excuse'
    ? 'Excused from recruitment drive by coordinator'
    : 'Non-Participation Strike: Student was eligible but failed to apply without approved leave')

  // 4. Create application row as 'dropped'
  const { data: newApp, error: appInsertErr } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      student_id: studentId,
      status: 'dropped',
      dropped_reason: droppedReason,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (appInsertErr || !newApp) {
    return { error: `Failed to create resolution record: ${appInsertErr?.message}` }
  }

  // 5. Insert audit log in application_stage_history
  await supabase
    .from('application_stage_history')
    .insert({
      application_id: newApp.id,
      from_status: 'applied',
      to_status: 'dropped',
      changed_by: user.id,
      reason: reasonText,
      created_at: now,
    })

  // 6. If action === 'penalize', increment policy_counters.non_participation and check auto-blacklist
  if (action === 'penalize') {
    const config = policyDoc?.config || {}
    const counters = { ...(student.policy_counters || {}) }
    counters.non_participation = (counters.non_participation || 0) + 1

    let autoBlacklist = false
    let blacklistReason = null

    if (config.non_participation?.enabled && config.non_participation.max_allowed !== null) {
      if (counters.non_participation >= config.non_participation.max_allowed) {
        autoBlacklist = true
        blacklistReason = 'Auto-Blacklist: Exceeded Non-Participation Strike Limit'
      }
    }

    const studentUpdate: any = {
      policy_counters: counters,
    }
    if (autoBlacklist) {
      studentUpdate.is_blacklisted = true
      studentUpdate.blacklist_reason = blacklistReason
    }

    await supabase
      .from('students')
      .update(studentUpdate)
      .eq('id', studentId)
  }

  revalidatePath(`/college/jobs/${jobId}`)
  revalidatePath(`/college/students/${studentId}`)
  revalidatePath('/student/applications')

  return {
    success: action === 'excuse'
      ? 'Student excused with 0 penalty.'
      : 'Non-participation strike successfully issued to candidate.',
  }
}

export async function bulkRecordNonApplicantResolution({
  jobId,
  studentIds,
  action,
  customReason,
}: {
  jobId: string
  studentIds: string[]
  action: 'excuse' | 'penalize'
  customReason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  let successCount = 0
  for (const sId of studentIds) {
    const res = await recordNonApplicantResolution({
      jobId,
      studentId: sId,
      action,
      customReason,
    })
    if (!res.error) successCount++
  }

  revalidatePath(`/college/jobs/${jobId}`)
  return {
    success: `Successfully processed ${successCount} candidates (${action === 'excuse' ? 'Excused' : 'Penalized'}).`,
  }
}

export async function updateCollegeUserProfile({
  firstName,
  lastName,
  phone,
  department,
}: {
  firstName: string
  lastName: string
  phone: string
  department: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const cleanFirst = firstName?.trim()
  const cleanLast = lastName?.trim()
  const cleanPhone = phone?.trim()
  const cleanDept = department?.trim()

  if (!cleanFirst || !cleanLast || !cleanPhone || !cleanDept) {
    return { error: 'First name, last name, contact phone, and department are required.' }
  }

  // 1. Update public.users
  const { error: dbError } = await supabase
    .from('users')
    .update({
      first_name: cleanFirst,
      last_name: cleanLast,
      phone: cleanPhone,
      department: cleanDept,
    })
    .eq('id', user.id)

  if (dbError) {
    return { error: `Failed to update profile: ${dbError.message}` }
  }

  // 2. Sync auth metadata
  try {
    const adminClient = getAdminClient()
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        first_name: cleanFirst,
        last_name: cleanLast,
        full_name: `${cleanFirst} ${cleanLast}`,
        phone: cleanPhone,
        department: cleanDept,
      },
    })
  } catch (err: any) {
    console.error('Failed to sync auth user metadata:', err)
  }

  revalidatePath('/college', 'layout')
  return { success: 'Your profile has been updated successfully.' }
}
