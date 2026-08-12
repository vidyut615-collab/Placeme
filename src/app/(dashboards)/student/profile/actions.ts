'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateStudentProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    return { error: 'Unauthorized.' }
  }

  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'Full name is required.' }

  const profile_data = {
    full_name,
    phone: (formData.get('phone') as string)?.trim() || '',
    gpa: (formData.get('gpa') as string)?.trim() || '',
    year: (formData.get('year') as string)?.trim() || '',
    type: (formData.get('type') as string)?.trim() || '',
    department: (formData.get('department') as string)?.trim() || '',
  }

  const { error } = await supabase
    .from('students')
    .update({ profile_data })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/student/profile')
  revalidatePath('/student/dashboard')

  return { success: true }
}
