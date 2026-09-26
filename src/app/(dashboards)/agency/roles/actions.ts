'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendZeptoMail } from '@/utils/zeptomail'

export async function inviteAgencyMember({
  email,
  role,
  firstName,
  lastName,
  phone,
  department,
}: {
  email: string
  role: 'agency_admin' | 'agency_staff'
  firstName: string
  lastName: string
  phone: string
  department: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'superadmin') {
    return { error: 'Unauthorized. Only Admin Owners can invite team members.' }
  }

  const cleanEmail = email.trim().toLowerCase()
  const adminClient = getAdminClient()

  // 1. Check if user already exists
  const { data: existingUser } = await adminClient
    .from('users')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (existingUser) {
    return {
      error: `An account with ${cleanEmail} already exists.`,
    }
  }

  // 2. Check for active pending invitation
  const { data: existingInvite } = await adminClient
    .from('invitations')
    .select('*')
    .eq('email', cleanEmail)
    .in('role', ['superadmin', 'agency_admin', 'agency_staff'])
    .maybeSingle()

  if (existingInvite) {
    if (existingInvite.status === 'accepted') {
      return { error: 'This user has already accepted an invitation.' }
    }
    return {
      error: `An active invitation has already been sent to ${cleanEmail}. You can resend the invite from the pending list.`,
    }
  }

  try {
    // 3. Create Auth User
    const randomPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { role, is_agency: true },
      app_metadata: { role, is_agency: true, onboarding_complete: false },
    })

    if (authError) return { error: authError.message }

    // 4. Create Invitation Record
    const { data: inviteRecord, error: inviteError } = await adminClient
      .from('invitations')
      .insert({
        email: cleanEmail,
        role: role,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        department: department,
        status: 'pending',
        invited_by: user.id,
      })
      .select()
      .single()

    if (inviteError) {
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: inviteError.message }
    }

    // 5. Generate Invite Link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
    })

    if (linkError) {
      return { error: 'Account created but failed to generate invite link.' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

    // 6. Send Email
    const roleLabel = role === 'agency_admin' ? 'Agency Administrator' : 'Agency Staff'
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Placeme!</h2>
        <p>Hello ${firstName},</p>
        <p>You have been invited to join the platform as a <strong>${roleLabel}</strong>.</p>
        <p>Please click the button below to set your password and complete your onboarding:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Complete Onboarding</a>
      </div>
    `
    const mailRes = await sendZeptoMail(cleanEmail, `Invitation: Join as ${roleLabel}`, emailHtml)
    
    if (mailRes.error) {
      console.error('ZeptoMail Error:', mailRes.error)
      return { error: 'Account created, but failed to send invite email. You can resend it from the pending list.' }
    }

    revalidatePath('/agency/roles')
    return { success: `Successfully sent invitation to ${cleanEmail}` }

  } catch (err: any) {
    return { error: `An unexpected error occurred: ${err.message}` }
  }
}

export async function resendAgencyMemberInvite(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'superadmin') {
    return { error: 'Unauthorized.' }
  }

  const adminClient = getAdminClient()

  const { data: invite, error: fetchErr } = await adminClient
    .from('invitations')
    .select('id, email, role, first_name, last_name')
    .eq('id', invitationId)
    .eq('status', 'pending')
    .single()

  if (fetchErr || !invite) {
    return { error: 'Invitation not found or no longer pending.' }
  }

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: invite.email,
  })

  if (linkError) return { error: 'Failed to generate new invite link.' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/api/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=/onboarding`

  const roleLabel = invite.role === 'agency_admin' ? 'Agency Administrator' : 'Agency Staff'
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Placeme! (Reminder)</h2>
      <p>Hello ${invite.first_name || 'Team Member'},</p>
      <p>This is a reminder that you have been invited to join the platform as a <strong>${roleLabel}</strong>.</p>
      <p>Please click the button below to complete your onboarding:</p>
      <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">Complete Onboarding</a>
    </div>
  `

  const mailRes = await sendZeptoMail(invite.email, `Reminder: Join as ${roleLabel}`, emailHtml)

  if (mailRes.error) {
    return { error: `Failed to resend email: ${mailRes.error}` }
  }

  revalidatePath('/agency/roles')
  return { success: `Refreshed invitation sent to ${invite.email}.` }
}

export async function revokeAgencyMemberInvite(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'superadmin') {
    return { error: 'Unauthorized.' }
  }

  const adminClient = getAdminClient()

  const { data: invite } = await adminClient
    .from('invitations')
    .select('id, email, status')
    .eq('id', invitationId)
    .single()

  if (!invite) return { error: 'Invitation not found.' }
  if (invite.status !== 'pending') return { error: 'Only pending invitations can be revoked.' }

  const { error: deleteInviteErr } = await adminClient
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (deleteInviteErr) return { error: deleteInviteErr.message }

  const { data: authUsers } = await adminClient.auth.admin.listUsers()
  const authUser = authUsers.users.find((u) => u.email === invite.email)
  if (authUser) {
    await adminClient.auth.admin.deleteUser(authUser.id)
  }

  revalidatePath('/agency/roles')
  return { success: `Invitation for ${invite.email} has been revoked.` }
}

export async function updateAgencyMemberRole({
  targetUserId,
  newRole,
}: {
  targetUserId: string
  newRole: 'agency_admin' | 'agency_staff'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'superadmin') {
    return { error: 'Unauthorized. Only Admin Owners can modify team roles.' }
  }

  if (user.id === targetUserId) {
    return { error: 'You cannot change your own administrative role.' }
  }

  if (newRole !== 'agency_admin' && newRole !== 'agency_staff') {
    return { error: 'Invalid role specified.' }
  }

  const adminClient = getAdminClient()

  const { data: targetUser } = await adminClient
    .from('users')
    .select('id, role')
    .eq('id', targetUserId)
    .single()

  if (!targetUser) return { error: 'Target user not found in agency.' }
  if (targetUser.role === 'superadmin') return { error: 'Cannot downgrade an Admin Owner.' }

  const { error: updateErr } = await adminClient
    .from('users')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (updateErr) return { error: updateErr.message }

  await adminClient.auth.admin.updateUserById(targetUserId, {
    app_metadata: { role: newRole, is_agency: true },
    user_metadata: { role: newRole, is_agency: true },
  })

  revalidatePath('/agency/roles')
  return {
    success: `Successfully updated role to ${
      newRole === 'agency_admin' ? 'Admin' : 'Staff'
    }.`,
  }
}

export async function toggleAgencyMemberStatus({
  targetUserId,
  isActive,
}: {
  targetUserId: string
  isActive: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'superadmin') {
    return { error: 'Unauthorized.' }
  }

  if (user.id === targetUserId) {
    return { error: 'You cannot deactivate your own account.' }
  }

  const adminClient = getAdminClient()

  const { data: targetUser } = await adminClient
    .from('users')
    .select('id, role')
    .eq('id', targetUserId)
    .single()

  if (!targetUser) return { error: 'User not found in agency.' }
  if (targetUser.role === 'superadmin') return { error: 'Cannot deactivate an Admin Owner.' }

  const { error: updateErr } = await adminClient
    .from('users')
    .update({ is_active: isActive })
    .eq('id', targetUserId)

  if (updateErr) return { error: updateErr.message }

  revalidatePath('/agency/roles')
  return {
    success: `User account has been ${isActive ? 'reactivated' : 'deactivated'}.`,
  }
}
