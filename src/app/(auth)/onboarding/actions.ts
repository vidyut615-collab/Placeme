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

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  if (!fullName) {
    return { error: 'Full Name is required.' }
  }

  try {
    // 1. Update auth user metadata with basic details
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: fullName,
        phone: phone,
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
      const gpa = formData.get('gpa') as string
      const year = formData.get('year') as string
      const type = formData.get('type') as string
      const department = formData.get('department') as string
      
      const academic_10th = formData.get('academic_10th') as string
      const academic_12th = formData.get('academic_12th') as string
      const diploma_percentage = formData.get('diploma_percentage') as string
      const graduation_percentage = formData.get('graduation_percentage') as string
      const active_backlogs = formData.get('active_backlogs') as string
      const historical_backlogs = formData.get('historical_backlogs') as string
      const academic_gap_years = formData.get('academic_gap_years') as string
      
      // Upsert student record
      const { error: studentError } = await adminClient.from('students').upsert({
        user_id: user.id,
        college_id: collegeId,
        onboarding_status: 'completed',
        profile_data: {
          full_name: fullName,
          phone: phone,
          gpa: gpa || null,
          year: year || null,
          type: type || null,
          department: department || null,
          academic_10th: academic_10th || null,
          academic_12th: academic_12th || null,
          diploma_percentage: diploma_percentage || null,
          graduation_percentage: graduation_percentage || null,
          active_backlogs: active_backlogs || null,
          historical_backlogs: historical_backlogs || null,
          academic_gap_years: academic_gap_years || null
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
