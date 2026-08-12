'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Determine where to route them based on their role
  const role = data.user?.app_metadata?.role
  
  if (role === 'superadmin' || role === 'agency_staff') {
    redirect('/agency/dashboard')
  } else if (role === 'college_admin' || role === 'college_staff') {
    redirect('/college/dashboard')
  } else if (role === 'student') {
    // Check onboarding status in the database to see if we need to redirect to onboarding
    const { data: student } = await supabase
      .from('students')
      .select('onboarding_status')
      .eq('user_id', data.user.id)
      .single()

    if (student?.onboarding_status === 'invited') {
      redirect('/onboarding')
    } else {
      redirect('/student/dashboard')
    }
  } else {
    // Fallback if no role is found (e.g., incomplete setup)
    return { error: 'No active role found for this account' }
  }
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email for the reset link' }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Password is required' }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/login')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
