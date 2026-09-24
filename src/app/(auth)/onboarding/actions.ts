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

  const firstName = (formData.get('firstName') as string)?.trim()
  const middleName = (formData.get('middleName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()

  if (!firstName || !lastName) {
    return { error: 'First Name and Last Name are required.' }
  }

  const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const department = (formData.get('department') as string)?.trim() || null

  if (role === 'college_admin' || role === 'college_staff') {
    if (!phone) {
      return { error: 'Contact Phone Number is required.' }
    }
    if (!department) {
      return { error: 'Please select your Department or Placement Role.' }
    }
  }

  try {
    // 1. Update auth user metadata with details
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        first_name: firstName,
        middle_name: middleName || '',
        last_name: lastName,
        phone: phone,
        department: department,
      }
    })

    // 2. Just-In-Time Database Insertion into public.users
    const { error: userError } = await adminClient.from('users').upsert({
      id: user.id,
      email: user.email,
      role: role,
      college_id: collegeId,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      department: department,
      is_active: true,
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
