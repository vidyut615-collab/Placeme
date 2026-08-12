import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CollegeDetailsForm } from '@/components/CollegeDetailsForm'

export default async function CollegeSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.app_metadata.college_id) {
    redirect('/login')
  }

  // Fetch the current college details
  // RLS ensures they can only select their own college
  const { data: college, error } = await supabase
    .from('colleges')
    .select('name, website, location, description, contact_email, contact_phone')
    .eq('id', user.app_metadata.college_id)
    .single()

  if (error || !college) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error loading college profile</h1>
        <p className="text-zinc-500 mt-2">{error?.message || 'College not found.'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">College Profile Settings</h1>
        <p className="text-zinc-500 mt-2">Update your college details. This information will be visible to students and the Agency.</p>
      </div>

      <CollegeDetailsForm initialData={college} />
    </div>
  )
}
