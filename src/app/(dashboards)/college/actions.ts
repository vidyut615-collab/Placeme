'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { PolicyConfig } from '@/lib/policy-engine'

export async function savePlacementPolicies(config: PolicyConfig) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'college_admin') {
    return { error: 'Unauthorized. Only College Admins can configure placement policies.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  // Upsert: insert if no row exists, update if it does
  const { error } = await supabase
    .from('placement_policies')
    .upsert(
      { college_id: collegeId, config },
      { onConflict: 'college_id' }
    )

  if (error) return { error: `Failed to save policies: ${error.message}` }

  revalidatePath('/college/policies')
  return { success: 'Placement policies saved successfully!' }
}


export async function updateCollegeProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) {
    return { error: 'No college associated with this account.' }
  }

  // Extract all fields
  const name = formData.get('name') as string
  const website = formData.get('website') as string
  const location = formData.get('location') as string
  const description = formData.get('description') as string
  const contact_email = formData.get('contact_email') as string
  const contact_phone = formData.get('contact_phone') as string

  // We use the standard supabase client. The RLS policy we just added 
  // explicitly allows them to UPDATE where id = auth_college_id()
  const { error } = await supabase
    .from('colleges')
    .update({
      name,
      website,
      location,
      description,
      contact_email,
      contact_phone
    })
    .eq('id', collegeId)

  if (error) {
    return { error: `Failed to update college details: ${error.message}` }
  }

  revalidatePath('/college/settings')
  return { success: 'College details updated successfully!' }
}

export async function createLocalJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    return { error: 'Unauthorized.' }
  }

  const collegeId = user.app_metadata.college_id
  if (!collegeId) return { error: 'No college associated with this account.' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string
  const company_name = formData.get('company_name') as string
  const compensation_ctc = formData.get('compensation_ctc') ? Number(formData.get('compensation_ctc')) : null
  const compensation_fixed = formData.get('compensation_fixed') ? Number(formData.get('compensation_fixed')) : null
  const compensation_variable = formData.get('compensation_variable') ? Number(formData.get('compensation_variable')) : null
  const application_deadline = formData.get('application_deadline') as string || null

  if (!title || !description || !status || !company_name) return { error: 'Missing required fields.' }

  // Uses standard RLS. The policy enforces that college_id must match auth_college_id()
  const { error } = await supabase.from('jobs').insert({
    title,
    description,
    status,
    company_name,
    compensation_ctc,
    compensation_fixed,
    compensation_variable,
    application_deadline: application_deadline ? new Date(application_deadline).toISOString() : null,
    college_id: collegeId,
    created_by: user.id
  })

  if (error) return { error: error.message }

  revalidatePath('/college/jobs')
  return { success: 'Local job created successfully!' }
}
