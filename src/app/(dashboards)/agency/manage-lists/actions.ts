'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addMasterListItem(category: string, value: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff' && user.app_metadata.role !== 'agency_admin')) {
    return { error: 'Unauthorized.' }
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) return { error: 'Value cannot be empty.' }

  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('platform_master_data')
    .insert([{ category, value: trimmedValue, is_active: true }])

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return { error: `"${trimmedValue}" already exists in this list.` }
    }
    return { error: error.message }
  }

  revalidatePath('/agency/manage-lists')
  return { success: true }
}

export async function toggleMasterListItem(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff' && user.app_metadata.role !== 'agency_admin')) {
    return { error: 'Unauthorized.' }
  }

  const adminClient = getAdminClient()
  
  const { error } = await adminClient
    .from('platform_master_data')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/agency/manage-lists')
  return { success: true }
}
