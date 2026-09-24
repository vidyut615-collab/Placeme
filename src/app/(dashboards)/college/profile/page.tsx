import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CollegeDetailsForm } from '@/components/CollegeDetailsForm'
import { Building2 } from 'lucide-react'

export default async function CollegeProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.app_metadata.college_id) {
    redirect('/login')
  }

  const isAdmin = user.app_metadata.role === 'college_admin'

  // Fetch college profile details
  const { data: college, error } = await supabase
    .from('colleges')
    .select('id, name, website, location, description, contact_email, contact_phone')
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
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            College Profile
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage your institution&apos;s public identity, website, location, and placement office contact details.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <CollegeDetailsForm initialData={college} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
