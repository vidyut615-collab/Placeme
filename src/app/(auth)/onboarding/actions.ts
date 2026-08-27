'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

export async function setupPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const role = user.app_metadata?.role
  const collegeId = user.app_metadata?.college_id
  const adminClient = getAdminClient()

  const firstName = formData.get('firstName') as string
  const middleName = formData.get('middleName') as string
  const lastName = formData.get('lastName') as string

  if (!firstName || !lastName) {
    return { error: 'First Name and Last Name are required.' }
  }

  const fullName = `${firstName.trim()} ${middleName ? middleName.trim() + ' ' : ''}${lastName.trim()}`.trim()

  try {
    // 1. Update auth user metadata with basic details
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        first_name: firstName.trim(),
        middle_name: middleName?.trim() || '',
        last_name: lastName.trim(),
      }
    })

    // 2. Just-In-Time Database Insertion
    const { error: userError } = await adminClient.from('users').upsert({
      id: user.id,
      email: user.email,
      role: role,
      college_id: collegeId
    }, { onConflict: 'id' })

    if (userError) {
      return { error: `Failed to initialize user record: ${userError.message}` }
    }

    // 3. Mark the pending invitation as accepted
    await adminClient.from('invitations')
      .update({ status: 'accepted' })
      .eq('email', user.email)
      .eq('status', 'pending')

    // 4. Role-specific database updates
    if (role === 'student') {
      const year = formData.get('year') as string
      const type = formData.get('type') as string
      const department = formData.get('department') as string
      
      // Upsert student record
      const { error: studentError } = await adminClient.from('students').upsert({
        user_id: user.id,
        college_id: collegeId,
        onboarding_status: 'completed',
        profile_data: {
          full_name: fullName,
          first_name: firstName.trim(),
          middle_name: middleName?.trim() || null,
          last_name: lastName.trim(),
          year: year || null,
          type: type || null,
          department: department || null
        }
      }, { onConflict: 'user_id' })

      if (studentError) {
        return { error: `Failed to create student profile: ${studentError.message}` }
      }
    }

    // 3. Mark onboarding as complete in app_metadata to pass Middleware
    const { error: metaError } = await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        onboarding_complete: true
      }
    })

    if (metaError) {
      return { error: `Failed to finalize onboarding: ${metaError.message}` }
    }

    // We must refresh the session to get the new app_metadata in the JWT
    await supabase.auth.refreshSession()
    
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
