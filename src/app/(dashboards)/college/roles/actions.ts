'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendZeptoMail } from '@/utils/zeptomail'

export async function inviteCollegeMember({
  email,
  role,
  firstName,
  lastName,
  phone,
  department,
}: {
  email: string
  role: 'college_admin' | 'college_staff'
  firstName: string
  lastName: string
  phone: string
  department: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Administrators can invite team members.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    return { error: 'College affiliation not found.' }
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanFirst = firstName.trim()
  const cleanLast = lastName.trim()
  const cleanPhone = phone.trim()
  const cleanDept = department.trim()

  if (!cleanEmail || !cleanFirst || !cleanLast || !cleanPhone || !cleanDept || !role) {
    return { error: 'All fields are required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    return { error: 'Please enter a valid email address.' }
  }

  if (role !== 'college_admin' && role !== 'college_staff') {
    return { error: 'Invalid role selected.' }
  }

  const adminClient = getAdminClient()

  // 1. Check if user already exists in public.users
  const { data: existingUser } = await adminClient
    .from('users')
    .select('id, email, role, college_id')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (existingUser) {
    return { error: `A user with email "${cleanEmail}" is already registered in the system.` }
  }

  // 2. Check if there is already a pending invitation for this college
  const { data: existingInvite } = await adminClient
    .from('invitations')
    .select('id, status')
    .eq('email', cleanEmail)
    .eq('college_id', collegeId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInvite) {
    return {
      error: `An active invitation has already been sent to ${cleanEmail}. You can resend the invite from the pending list.`,
    }
  }

  // 3. Fetch college name for email branding
  const { data: college } = await adminClient
    .from('colleges')
    .select('name')
    .eq('id', collegeId)
    .single()

  const collegeName = college?.name || 'Institution'
  const randomPassword = Math.random().toString(36).slice(-10) + 'A1!'

  try {
    // 4. Create user in Supabase auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        role,
        college_id: collegeId,
        first_name: cleanFirst,
        last_name: cleanLast,
        full_name: `${cleanFirst} ${cleanLast}`.trim(),
        phone: cleanPhone,
        department: cleanDept,
      },
      app_metadata: {
        role,
        college_id: collegeId,
        onboarding_complete: false,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.status === 422) {
        return { error: `An account with email "${cleanEmail}" already exists in the system.` }
      }
      return { error: `Failed to create user account: ${authError.message}` }
    }

    // 5. Insert invitation tracking record
    const { error: inviteError } = await adminClient.from('invitations').insert({
      email: cleanEmail,
      role,
      college_id: collegeId,
      invited_by: user.id,
      first_name: cleanFirst,
      last_name: cleanLast,
      phone: cleanPhone,
      department: cleanDept,
      status: 'pending',
    })

    if (inviteError) {
      // rollback auth user if invitation record fails
      if (authData?.user?.id) {
        await adminClient.auth.admin.deleteUser(authData.user.id)
      }
      return { error: `Failed to create invitation record: ${inviteError.message}` }
    }

    // 6. Generate recovery invite token link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return { error: 'Account created, but failed to generate invite link.' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

    // 7. Dispatch custom ZeptoMail
    const roleLabel = role === 'college_admin' ? 'College Administrator' : 'College Placement Staff'
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #111; margin-bottom: 12px;">Welcome to ${collegeName} Placement Portal</h2>
        <p style="color: #444; font-size: 15px; line-height: 1.5;">Hello <strong>${cleanFirst} ${cleanLast}</strong>,</p>
        <p style="color: #444; font-size: 15px; line-height: 1.5;">
          You have been appointed to the placement team of <strong>${collegeName}</strong> as a <strong>${roleLabel}</strong> (${cleanDept}).
        </p>
        <p style="color: #444; font-size: 15px; line-height: 1.5;">
          Please click the button below to set your account password and activate your institutional dashboard access:
        </p>
        <div style="margin: 28px 0;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Set Password & Accept Invitation
          </a>
        </div>
        <p style="color: #777; font-size: 12px; line-height: 1.4;">
          This link is securely issued for your institutional email address. If you did not anticipate this access, please contact your Training & Placement Officer.
        </p>
      </div>
    `

    const mailRes = await sendZeptoMail(
      cleanEmail,
      `Invitation: Join ${collegeName} Placement Team as ${roleLabel}`,
      emailHtml
    )

    if (mailRes.error) {
      console.warn('ZeptoMail dispatch warning:', mailRes.error)
    }

    revalidatePath('/college/roles')
    return { success: `Invitation successfully sent to ${cleanEmail} as ${roleLabel}!` }
  } catch (err: any) {
    return { error: `An unexpected error occurred: ${err.message}` }
  }
}

export async function resendCollegeMemberInvite(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  const adminClient = getAdminClient()

  // Fetch invitation
  const { data: invite, error: fetchErr } = await adminClient
    .from('invitations')
    .select('id, email, role, first_name, last_name, department, college_id')
    .eq('id', invitationId)
    .eq('college_id', collegeId)
    .eq('status', 'pending')
    .single()

  if (fetchErr || !invite) {
    return { error: 'Pending invitation not found.' }
  }

  // Fetch college name
  const { data: college } = await adminClient
    .from('colleges')
    .select('name')
    .eq('id', collegeId)
    .single()

  const collegeName = college?.name || 'Institution'

  // Generate new recovery link
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: invite.email,
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    return { error: 'Failed to generate refreshed invitation link.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

  const roleLabel = invite.role === 'college_admin' ? 'College Administrator' : 'College Placement Staff'
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #111; margin-bottom: 12px;">Reminder: Complete Your Onboarding at ${collegeName}</h2>
      <p style="color: #444; font-size: 15px; line-height: 1.5;">Hello <strong>${invite.first_name || ''} ${invite.last_name || ''}</strong>,</p>
      <p style="color: #444; font-size: 15px; line-height: 1.5;">
        Your invitation to join <strong>${collegeName}</strong> as a <strong>${roleLabel}</strong> is awaiting confirmation.
      </p>
      <div style="margin: 28px 0;">
        <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Activate Account & Complete Onboarding
        </a>
      </div>
      <p style="color: #777; font-size: 12px;">This is a refreshed link. If you already completed onboarding, you may ignore this notice.</p>
    </div>
  `

  await sendZeptoMail(invite.email, `Reminder: ${collegeName} Placement Portal Invitation`, emailHtml)

  // Update created_at timestamp
  await adminClient
    .from('invitations')
    .update({ created_at: new Date().toISOString() })
    .eq('id', invitationId)

  revalidatePath('/college/roles')
  return { success: `Refreshed invitation sent to ${invite.email}.` }
}

export async function revokeCollegeMemberInvite(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  const adminClient = getAdminClient()

  // Fetch invitation
  const { data: invite } = await adminClient
    .from('invitations')
    .select('id, email, status')
    .eq('id', invitationId)
    .eq('college_id', collegeId)
    .single()

  if (!invite) {
    return { error: 'Invitation not found.' }
  }

  // Delete pending invitation
  await adminClient.from('invitations').delete().eq('id', invitationId)

  // Also remove uncompleted auth user if exists
  const { data: userList } = await adminClient.auth.admin.listUsers()
  const authUser = userList?.users?.find(
    (u) => u.email === invite.email && u.app_metadata?.onboarding_complete !== true
  )
  if (authUser) {
    await adminClient.auth.admin.deleteUser(authUser.id)
  }

  revalidatePath('/college/roles')
  return { success: `Invitation for ${invite.email} has been revoked.` }
}

export async function updateCollegeMemberRole({
  targetUserId,
  newRole,
}: {
  targetUserId: string
  newRole: 'college_admin' | 'college_staff'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Administrators can modify team roles.' }
  }

  if (user.id === targetUserId) {
    return { error: 'You cannot change your own administrative role.' }
  }

  if (newRole !== 'college_admin' && newRole !== 'college_staff') {
    return { error: 'Invalid role specified.' }
  }

  const collegeId = user.app_metadata.college_id
  const adminClient = getAdminClient()

  // Target user verification
  const { data: targetUser } = await adminClient
    .from('users')
    .select('id, email, role, college_id')
    .eq('id', targetUserId)
    .eq('college_id', collegeId)
    .single()

  if (!targetUser) {
    return { error: 'Target user not found in your college.' }
  }

  // Safety check: Cannot demote the last remaining admin
  if (targetUser.role === 'college_admin' && newRole === 'college_staff') {
    const { count } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', collegeId)
      .eq('role', 'college_admin')
      .eq('is_active', true)

    if (count !== null && count <= 1) {
      return { error: 'Cannot demote the only remaining active College Administrator.' }
    }
  }

  // 1. Update public.users
  const { error: updateErr } = await adminClient
    .from('users')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (updateErr) {
    return { error: `Failed to update role: ${updateErr.message}` }
  }

  // 2. Update auth user app_metadata and user_metadata
  await adminClient.auth.admin.updateUserById(targetUserId, {
    app_metadata: { role: newRole },
    user_metadata: { role: newRole },
  })

  revalidatePath('/college/roles')
  return {
    success: `User role successfully updated to ${
      newRole === 'college_admin' ? 'College Administrator' : 'College Staff'
    }.`,
  }
}

export async function toggleCollegeMemberStatus({
  targetUserId,
  isActive,
}: {
  targetUserId: string
  isActive: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized.' }
  }

  if (user.id === targetUserId) {
    return { error: 'You cannot deactivate your own account.' }
  }

  const collegeId = user.app_metadata.college_id
  const adminClient = getAdminClient()

  const { data: targetUser } = await adminClient
    .from('users')
    .select('id, role')
    .eq('id', targetUserId)
    .eq('college_id', collegeId)
    .single()

  if (!targetUser) {
    return { error: 'User not found.' }
  }

  if (targetUser.role === 'college_admin' && !isActive) {
    const { count } = await adminClient
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', collegeId)
      .eq('role', 'college_admin')
      .eq('is_active', true)

    if (count !== null && count <= 1) {
      return { error: 'Cannot deactivate the only active College Administrator.' }
    }
  }

  const { error: updateErr } = await adminClient
    .from('users')
    .update({ is_active: isActive })
    .eq('id', targetUserId)

  if (updateErr) {
    return { error: updateErr.message }
  }

  revalidatePath('/college/roles')
  return {
    success: `Member account has been ${isActive ? 'reactivated' : 'deactivated'}.`,
  }
}
