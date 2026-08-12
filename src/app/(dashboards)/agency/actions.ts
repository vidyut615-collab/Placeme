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

  const name = formData.get('name') as string
  const adminEmail = formData.get('adminEmail') as string

  if (!name || !adminEmail) {
    return { error: 'College Name and Admin Email are required.' }
  }

  const adminClient = getAdminClient()

  const yearsRaw = formData.get('years') as string
  const typesRaw = formData.get('types') as string
  const deptsRaw = formData.get('departments') as string

  const onboarding_fields = {
    years: yearsRaw ? yearsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    types: typesRaw ? typesRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    departments: deptsRaw ? deptsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  }

  try {
    const { data: college, error: collegeError } = await adminClient
      .from('colleges')
      .insert({ name, onboarding_fields })
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
  const name = formData.get('name') as string

  if (!id || !name) return { error: 'Missing fields.' }

  const adminClient = getAdminClient()
  const { error } = await adminClient.from('colleges').update({ name }).eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/agency/colleges')
  return { success: 'College updated successfully!' }
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
  const yearsRaw = formData.get('years') as string
  const typesRaw = formData.get('types') as string
  const deptsRaw = formData.get('departments') as string

  if (!collegeId) return { error: 'Missing college ID.' }

  const onboarding_fields = {
    years: yearsRaw ? yearsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    types: typesRaw ? typesRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
    departments: deptsRaw ? deptsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  }

  const adminClient = getAdminClient()
  const { error } = await adminClient
    .from('colleges')
    .update({ onboarding_fields })
    .eq('id', collegeId)

  if (error) return { error: error.message }

  revalidatePath(`/agency/colleges/${collegeId}`)
  return { success: 'Onboarding fields updated successfully!' }
}


