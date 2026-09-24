'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { sendZeptoMail } from '@/utils/zeptomail'

export async function addCollege(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized. Only Agency staff can create colleges.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const adminEmail = (formData.get('adminEmail') as string)?.trim()
  const website = (formData.get('website') as string)?.trim() || null
  const location = (formData.get('location') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const contact_email = (formData.get('contact_email') as string)?.trim() || null
  const contact_phone = (formData.get('contact_phone') as string)?.trim() || null

  if (!name || !adminEmail) {
    return { error: 'College Name and Admin Email are required.' }
  }

  const adminClient = getAdminClient()

  let onboarding_fields = { years: [] as string[], types: [] as string[], departments: [] as string[] }
  const fieldsJson = formData.get('onboarding_fields_json') as string
  if (fieldsJson) {
    try {
      onboarding_fields = JSON.parse(fieldsJson)
    } catch (e) {}
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

  try {
    const { data: college, error: collegeError } = await adminClient
      .from('colleges')
      .insert({
        name,
        website,
        location,
        description,
        contact_email,
        contact_phone,
        onboarding_fields
      })
      .select()
      .single()

    if (collegeError) {
      return { error: `Failed to create college: ${collegeError.message}` }
    }

    const collegeId = college.id
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!' 
    const role = 'college_admin'

    let isResend = false;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { role, college_id: collegeId },
      app_metadata: { role, college_id: collegeId, onboarding_complete: false }
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        const { data: existingInvite } = await adminClient.from('invitations').select('status').eq('email', adminEmail).maybeSingle()
        if (existingInvite?.status === 'accepted') {
          await adminClient.from('colleges').delete().eq('id', collegeId)
          return { error: 'Admin email is already registered in the system.' }
        }
        isResend = true;
      } else {
        await adminClient.from('colleges').delete().eq('id', collegeId)
        return { error: `Failed to create admin account: ${authError.message}` }
      }
    }

    if (!isResend) {
      const { error: inviteError } = await adminClient.from('invitations').insert({
        email: adminEmail,
        role: 'college_admin',
        college_id: college.id,
        invited_by: user.id, // The SuperAdmin who created it
        status: 'pending'
      })

      if (inviteError) {
        console.error("Failed to create invitation record", inviteError)
        return { error: 'College created, but failed to track invitation.' }
      }
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery', // Recovery link logs them in and lets them reset password
      email: adminEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Failed to generate link", linkError)
      return { error: 'College created, but failed to generate invite link.' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

    // Send the custom email
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Placeme!</h2>
        <p>You have been added as the College Administrator for <strong>${name}</strong>.</p>
        <p>Please click the button below to set your password and complete your onboarding:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Complete Onboarding</a>
      </div>
    `
    const mailRes = await sendZeptoMail(adminEmail, 'Complete Your College Admin Onboarding', emailHtml)
    
    if (mailRes.error) {
      console.error('ZeptoMail Error:', mailRes.error)
      return { error: 'College created, but failed to send invite email.' }
    }

    revalidatePath('/agency/colleges')
    return { success: 'College created successfully and admin invited via ZeptoMail!' }
  } catch (err: any) {
    return { error: `An unexpected error occurred: ${err.message}` }
  }
}

export async function updateCollege(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized.' }
  }

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  const website = (formData.get('website') as string)?.trim() || null
  const location = (formData.get('location') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const contact_email = (formData.get('contact_email') as string)?.trim() || null
  const contact_phone = (formData.get('contact_phone') as string)?.trim() || null

  if (!id || !name) return { error: 'College Name is required.' }

  const adminClient = getAdminClient()
  const { error } = await adminClient.from('colleges').update({
    name,
    website,
    location,
    description,
    contact_email,
    contact_phone
  }).eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/agency/colleges')
  revalidatePath(`/agency/colleges/${id}`)
  return { success: 'College details updated successfully!' }
}

export async function addCollegeAdmin(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = formData.get('collegeId') as string
  const adminEmail = formData.get('adminEmail') as string

  if (!collegeId || !adminEmail) return { error: 'Missing fields.' }

  const adminClient = getAdminClient()
  const randomPassword = Math.random().toString(36).slice(-10) + 'A1!' 
  const role = 'college_admin'

  try {
    let isResend = false;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { role, college_id: collegeId },
      app_metadata: { role, college_id: collegeId, onboarding_complete: false }
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        const { data: existingInvite } = await adminClient.from('invitations').select('status').eq('email', adminEmail).maybeSingle()
        if (existingInvite?.status === 'accepted') {
          return { error: 'Admin email is already registered and onboarded.' }
        }
        isResend = true;
      } else {
        return { error: authError.message }
      }
    }

    if (!isResend) {
      const { error: inviteError } = await adminClient.from('invitations').insert({
        email: adminEmail,
        role,
        college_id: collegeId,
        invited_by: user.id,
        status: 'pending'
      })

      if (inviteError) return { error: inviteError.message }
    }

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: adminEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return { error: 'Admin created but failed to generate invite link.' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Placeme!</h2>
        <p>You have been added as a College Administrator.</p>
        <p>Please click the button below to set your password and complete your onboarding:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Complete Onboarding</a>
      </div>
    `
    const mailRes = await sendZeptoMail(adminEmail, 'Complete Your College Admin Onboarding', emailHtml)
    
    if (mailRes.error) {
      return { error: 'Admin created but failed to send invite email.' }
    }

    revalidatePath('/agency/colleges')
    return { success: 'New admin invited successfully via ZeptoMail!' }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteCollege(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'superadmin') {
    return { error: 'Unauthorized. Only SuperAdmins can delete colleges.' }
  }

  const collegeId = formData.get('collegeId') as string
  const password = formData.get('password') as string

  if (!collegeId || !password) return { error: 'Missing fields.' }

  // Ephemeral standard client to test password without mutating server cookies
  const anonClient = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email: user.email!,
    password: password
  })

  if (signInError) {
    return { error: 'Invalid password. Deletion aborted.' }
  }

  // Password verified, execute deletion using Admin client
  const adminClient = getAdminClient()
  const { error } = await adminClient.from('colleges').delete().eq('id', collegeId)

  if (error) return { error: error.message }

  revalidatePath('/agency/colleges')
  return { success: 'College and all associated data permanently deleted.' }
}

export async function createGlobalJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized.' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string
  const company_name = formData.get('company_name') as string
  const compensation_ctc = formData.get('compensation_ctc') ? Number(formData.get('compensation_ctc')) : null
  const compensation_fixed = formData.get('compensation_fixed') ? Number(formData.get('compensation_fixed')) : null
  const compensation_variable = formData.get('compensation_variable') ? Number(formData.get('compensation_variable')) : null
  const application_deadline = formData.get('application_deadline') as string || null

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

  const adminClient = getAdminClient()
  const { error } = await adminClient.from('jobs').insert({
    title,
    description,
    status,
    company_name,
    compensation_ctc,
    compensation_fixed,
    compensation_variable,
    application_deadline: application_deadline ? new Date(application_deadline).toISOString() : null,
    college_id: null,
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

  revalidatePath('/agency/jobs')
  return { success: 'Global job created successfully!' }
}

export async function inviteStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized. Only Agency staff can invite students.' }
  }

  const collegeId = formData.get('collegeId') as string
  const studentEmail = formData.get('studentEmail') as string

  if (!collegeId || !studentEmail) return { error: 'Missing fields.' }

  const adminClient = getAdminClient()
  const randomPassword = Math.random().toString(36).slice(-10) + 'S1!' 
  const role = 'student'

  try {
    let isResend = false;
    // 1. Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: studentEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { role, college_id: collegeId },
      app_metadata: { role, college_id: collegeId, onboarding_complete: false }
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        // Check if they are fully onboarded or still pending
        const { data: existingInvite } = await adminClient
          .from('invitations')
          .select('status')
          .eq('email', studentEmail)
          .maybeSingle()
          
        if (existingInvite?.status === 'accepted') {
          return { error: 'User is already fully registered and onboarded.' }
        }
        
        // It's pending (or doesn't exist in tracking yet), we can resend the invite
        isResend = true
      } else {
        return { error: authError.message }
      }
    }

    if (!isResend) {
      // 2. Add to invitations table
      const { error: inviteError } = await adminClient.from('invitations').insert({
        email: studentEmail,
        role,
        college_id: collegeId,
        invited_by: user.id,
        status: 'pending'
      })

      if (inviteError) return { error: inviteError.message }
    }

    // 3. Generate secure link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: studentEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return { error: 'Student created but failed to generate invite link.' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Placeme!</h2>
        <p>You have been invited to join the platform as a Student.</p>
        <p>Please click the button below to set your password and complete your profile:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Complete Onboarding</a>
      </div>
    `
    const mailRes = await sendZeptoMail(studentEmail, 'Complete Your Student Onboarding', emailHtml)
    
    if (mailRes.error) {
      return { error: 'Student created but failed to send invite email.' }
    }

    revalidatePath(`/agency/colleges/${collegeId}`)
    revalidatePath('/agency/students')
    return { success: 'Student invited successfully via ZeptoMail!' }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateCollegeOnboardingFields(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = formData.get('collegeId') as string
  if (!collegeId) return { error: 'Missing college ID.' }

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

  const adminClient = getAdminClient()
  const { error } = await adminClient
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
          const { data: res, error: rpcErr } = await adminClient.rpc('cascade_rename_academic_field', {
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

  revalidatePath(`/agency/colleges/${collegeId}`)
  revalidatePath('/agency/students')

  const successMsg = totalStudentsMigrated > 0
    ? `Academic lists updated! Automatically migrated ${totalStudentsMigrated} student profile(s) to match the new names.`
    : 'Academic lists configuration updated successfully!'

  return { success: successMsg }
}

export async function checkExistingStudentEmails(emails: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized.' }
  }

  if (!emails || emails.length === 0) {
    return { registered: [], pending: [] }
  }

  const adminClient = getAdminClient()
  const lowerEmails = emails.map(e => e.trim().toLowerCase())

  try {
    // 1. Check registered users in users table
    const { data: existingUsers } = await adminClient
      .from('users')
      .select('email')
      .in('email', lowerEmails)

    const registeredSet = new Set<string>(
      (existingUsers || []).map(u => (u.email || '').toLowerCase())
    )

    // 2. Check invitations table
    const { data: existingInvites } = await adminClient
      .from('invitations')
      .select('email, status')
      .in('email', lowerEmails)

    const pendingSet = new Set<string>()
    for (const inv of existingInvites || []) {
      const email = (inv.email || '').toLowerCase()
      if (inv.status === 'accepted') {
        registeredSet.add(email)
      } else if (inv.status === 'pending') {
        pendingSet.add(email)
      }
    }

    return {
      registered: Array.from(registeredSet),
      pending: Array.from(pendingSet).filter(e => !registeredSet.has(e))
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to verify existing emails.' }
  }
}

export async function bulkInviteStudents({
  collegeId,
  emails
}: {
  collegeId: string
  emails: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff')) {
    return { error: 'Unauthorized. Only Agency staff can invite students.' }
  }

  if (!collegeId || !emails || emails.length === 0) {
    return { error: 'Missing collegeId or emails list.' }
  }

  const adminClient = getAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const role = 'student'

  let successCount = 0
  const failedList: Array<{ email: string; reason: string }> = []

  for (const rawEmail of emails) {
    const studentEmail = rawEmail.trim().toLowerCase()
    const randomPassword = Math.random().toString(36).slice(-10) + 'S1!'

    try {
      let isResend = false
      // 1. Create auth user
      const { error: authError } = await adminClient.auth.admin.createUser({
        email: studentEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { role, college_id: collegeId },
        app_metadata: { role, college_id: collegeId, onboarding_complete: false }
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.status === 422) {
          const { data: existingInvite } = await adminClient
            .from('invitations')
            .select('status')
            .eq('email', studentEmail)
            .maybeSingle()

          if (existingInvite?.status === 'accepted') {
            failedList.push({ email: studentEmail, reason: 'Already registered and onboarded' })
            continue
          }
          isResend = true
        } else {
          failedList.push({ email: studentEmail, reason: authError.message })
          continue
        }
      }

      // 2. Insert to invitations table if not a resend
      if (!isResend) {
        const { error: inviteError } = await adminClient.from('invitations').insert({
          email: studentEmail,
          role,
          college_id: collegeId,
          invited_by: user.id,
          status: 'pending'
        })

        if (inviteError) {
          failedList.push({ email: studentEmail, reason: inviteError.message })
          continue
        }
      }

      // 3. Generate secure link
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: studentEmail,
      })

      if (linkError || !linkData?.properties?.hashed_token) {
        failedList.push({ email: studentEmail, reason: 'Failed to generate invite token' })
        continue
      }

      const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Placeme!</h2>
          <p>You have been invited to join the platform as a Student.</p>
          <p>Please click the button below to set your password and complete your profile:</p>
          <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Complete Onboarding</a>
        </div>
      `
      const mailRes = await sendZeptoMail(studentEmail, 'Complete Your Student Onboarding', emailHtml)

      if (mailRes.error) {
        failedList.push({ email: studentEmail, reason: 'Email delivery failed' })
        continue
      }

      successCount++
    } catch (itemErr: any) {
      failedList.push({ email: studentEmail, reason: itemErr.message || 'Unexpected error' })
    }
  }

  revalidatePath(`/agency/colleges/${collegeId}`)
  revalidatePath('/agency/students')

  return {
    totalSuccess: successCount,
    totalFailed: failedList.length,
    failedList,
    success: `Successfully invited ${successCount} student(s)!`
  }
}

export async function resendStudentInvite({
  collegeId,
  oldEmail,
  newEmail,
  invitationId,
}: {
  collegeId: string
  oldEmail: string
  newEmail: string
  invitationId?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized.' }
  }

  const role = user.app_metadata?.role
  const isAgency = role === 'superadmin' || role === 'agency_staff'

  const userCollegeId = user.app_metadata?.college_id || user.user_metadata?.college_id
  const isCollegeStaff = (role === 'college_admin' || role === 'college_staff') && userCollegeId === collegeId

  if (!isAgency && !isCollegeStaff) {
    const adminCheck = getAdminClient()
    const { data: dbUser } = await adminCheck.from('users').select('college_id, role').eq('id', user.id).maybeSingle()
    const isDbCollegeStaff = (dbUser?.role === 'college_admin' || dbUser?.role === 'college_staff') && dbUser?.college_id === collegeId
    if (!isDbCollegeStaff && dbUser?.role !== 'superadmin' && dbUser?.role !== 'agency_staff') {
      return { error: 'Unauthorized to resend student invite for this college.' }
    }
  }

  const cleanedOld = oldEmail.trim().toLowerCase()
  const cleanedNew = newEmail.trim().toLowerCase()

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanedNew)) {
    return { error: 'Please enter a valid email address.' }
  }

  const adminClient = getAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    if (cleanedNew !== cleanedOld) {
      // 1. Check if newEmail is already in users table
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('email', cleanedNew)
        .maybeSingle()

      if (existingUser) {
        return { error: `The email ${cleanedNew} is already registered to an active user.` }
      }

      // 2. Check if newEmail already has an invitation
      const { data: existingInvite } = await adminClient
        .from('invitations')
        .select('id, status')
        .eq('email', cleanedNew)
        .maybeSingle()

      if (existingInvite && (!invitationId || existingInvite.id !== invitationId)) {
        return { error: `The email ${cleanedNew} already has an existing invitation (${existingInvite.status}).` }
      }

      // 3. Find existing auth user ID for oldEmail
      let targetAuthId: string | null = null
      try {
        const { data: oldLink } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: cleanedOld,
        })
        if (oldLink?.user?.id) {
          targetAuthId = oldLink.user.id
        }
      } catch (e) {}

      if (!targetAuthId) {
        const { data: userList } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const found = userList?.users?.find(u => u.email?.toLowerCase() === cleanedOld)
        if (found) {
          targetAuthId = found.id
        }
      }

      if (targetAuthId) {
        const { error: updateAuthErr } = await adminClient.auth.admin.updateUserById(targetAuthId, {
          email: cleanedNew,
          email_confirm: true,
        })
        if (updateAuthErr) {
          return { error: `Failed to update auth email: ${updateAuthErr.message}` }
        }
      } else {
        const randomPassword = Math.random().toString(36).slice(-10) + 'S1!'
        await adminClient.auth.admin.createUser({
          email: cleanedNew,
          password: randomPassword,
          email_confirm: true,
          user_metadata: { role: 'student', college_id: collegeId },
          app_metadata: { role: 'student', college_id: collegeId, onboarding_complete: false }
        })
      }

      // 4. Update invitations table
      if (invitationId) {
        await adminClient.from('invitations').update({ email: cleanedNew }).eq('id', invitationId)
      }
      await adminClient.from('invitations').update({ email: cleanedNew }).eq('email', cleanedOld).eq('college_id', collegeId)

      // 5. Update users table if a record exists
      await adminClient.from('users').update({ email: cleanedNew }).eq('email', cleanedOld)
    }

    // Generate fresh recovery link for target email
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: cleanedNew,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return { error: `Failed to generate invite token: ${linkError?.message || 'Unknown error'}` }
    }

    const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Placeme!</h2>
        <p>You have been invited to join the platform as a Student.</p>
        <p>Please click the button below to set your password and complete your profile:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Complete Onboarding</a>
      </div>
    `
    const mailRes = await sendZeptoMail(cleanedNew, 'Complete Your Student Onboarding', emailHtml)
    if (mailRes.error) {
      return { error: `Email updated, but delivery failed: ${mailRes.error}` }
    }

    revalidatePath(`/agency/colleges/${collegeId}`)
    revalidatePath('/college/students')
    revalidatePath('/agency/students')

    const successMsg = cleanedNew !== cleanedOld
      ? `Email updated to ${cleanedNew} and new invitation link sent!`
      : `Invitation link resent successfully to ${cleanedNew}!`

    return { success: successMsg }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred while resending invite.' }
  }
}

export async function deleteStudentAccount({
  studentId,
  invitationId,
  email,
  collegeId,
}: {
  studentId?: string | null
  invitationId?: string | null
  email: string
  collegeId: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata?.role !== 'superadmin' && user.app_metadata?.role !== 'agency_staff')) {
    return { error: 'Unauthorized. Only Agency SuperAdmins and Staff can delete students.' }
  }

  const cleanedEmail = email.trim().toLowerCase()
  const adminClient = getAdminClient()

  try {
    let authUserId: string | null = null

    // 1. If studentId provided, get user_id from students table
    if (studentId) {
      const { data: student } = await adminClient
        .from('students')
        .select('user_id')
        .eq('id', studentId)
        .maybeSingle()
      if (student?.user_id) {
        authUserId = student.user_id
      }
    }

    // 2. If no authUserId yet, try generateLink or listUsers
    if (!authUserId) {
      try {
        const { data: linkData } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: cleanedEmail,
        })
        if (linkData?.user?.id) {
          authUserId = linkData.user.id
        }
      } catch (e) {}
    }

    if (!authUserId) {
      const { data: dbUser } = await adminClient.from('users').select('id').eq('email', cleanedEmail).maybeSingle()
      if (dbUser?.id) {
        authUserId = dbUser.id
      }
    }

    if (!authUserId) {
      const { data: userList } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const found = userList?.users?.find(u => u.email?.toLowerCase() === cleanedEmail)
      if (found) {
        authUserId = found.id
      }
    }

    // 3. Delete from auth.users (cascades to public.users, students, applications)
    if (authUserId) {
      const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(authUserId)
      if (delAuthErr) {
        console.error('Error deleting auth user:', delAuthErr)
      }
    }

    // 4. Clean up any remaining records across public database tables
    if (studentId) {
      await adminClient.from('applications').delete().eq('student_id', studentId)
      await adminClient.from('profile_update_requests').delete().eq('student_id', studentId)
      await adminClient.from('students').delete().eq('id', studentId)
    }
    if (authUserId) {
      await adminClient.from('students').delete().eq('user_id', authUserId)
      await adminClient.from('users').delete().eq('id', authUserId)
    }
    if (invitationId) {
      await adminClient.from('invitations').delete().eq('id', invitationId)
    }
    await adminClient.from('invitations').delete().ilike('email', cleanedEmail)
    await adminClient.from('users').delete().ilike('email', cleanedEmail)

    revalidatePath(`/agency/colleges/${collegeId}`)
    revalidatePath('/college/students')
    revalidatePath('/agency/students')

    return { success: `Student ${cleanedEmail} deleted successfully.` }
  } catch (err: any) {
    return { error: err.message || 'Failed to delete student account.' }
  }
}



