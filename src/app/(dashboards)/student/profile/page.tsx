import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentProfileForm } from '@/components/StudentProfileForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Fetch student profile and college (for onboarding field dropdowns)
  const { data: student } = await supabase
    .from('students')
    .select(`
      profile_data,
      colleges (
        name,
        onboarding_fields
      )
    `)
    .eq('user_id', user.id)
    .single()

  const profile = student?.profile_data || {}
  const college = student?.colleges as any
  const onboardingFields = college?.onboarding_fields || { years: [], types: [], departments: [] }

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-zinc-500 mt-2">
          Keep your academic information up to date. Admins and recruiters use this to evaluate your applications.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Profile summary card */}
        <div className="w-full lg:w-64 shrink-0">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-2xl font-bold text-blue-600 dark:text-blue-300 mb-2">
                {(profile.full_name?.[0] || user.email?.[0] || 'S').toUpperCase()}
              </div>
              <CardTitle className="text-lg">{profile.full_name || 'No name set'}</CardTitle>
              <CardDescription className="text-xs break-all">{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div><span className="font-medium text-zinc-800 dark:text-zinc-200">College:</span> {college?.name || 'N/A'}</div>
              <div><span className="font-medium text-zinc-800 dark:text-zinc-200">Degree:</span> {profile.type || 'N/A'}</div>
              <div><span className="font-medium text-zinc-800 dark:text-zinc-200">Year:</span> {profile.year || 'N/A'}</div>
              <div><span className="font-medium text-zinc-800 dark:text-zinc-200">Dept:</span> {profile.department || 'N/A'}</div>
              <div><span className="font-medium text-zinc-800 dark:text-zinc-200">GPA:</span> {profile.gpa || 'N/A'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Edit form */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-md border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Edit Information</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Changes are saved instantly and reflected on your applications.
          </p>
          <StudentProfileForm profile={profile} onboardingFields={onboardingFields} />
        </div>
      </div>
    </div>
  )
}
