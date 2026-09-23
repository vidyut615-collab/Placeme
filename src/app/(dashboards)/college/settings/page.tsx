import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CollegeDetailsForm } from '@/components/CollegeDetailsForm'
import { AcademicConfigManager } from '@/components/AcademicConfigManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, GraduationCap } from 'lucide-react'

export default async function CollegeSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.app_metadata.college_id) {
    redirect('/login')
  }

  // Fetch the current college details and onboarding fields
  // RLS ensures they can only select their own college
  const { data: college, error } = await supabase
    .from('colleges')
    .select('id, name, website, location, description, contact_email, contact_phone, onboarding_fields')
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
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">College Settings</h1>
        <p className="text-zinc-500 mt-1">
          Manage your institution&apos;s public profile, placement office contacts, and academic programs.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            College Profile
          </TabsTrigger>
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Academic Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <CollegeDetailsForm initialData={college} />
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <AcademicConfigManager 
            initialFields={college.onboarding_fields} 
            role="college" 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
