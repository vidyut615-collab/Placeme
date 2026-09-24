import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { MyProfileForm } from '@/components/MyProfileForm'
import { UserCheck } from 'lucide-react'

export default async function CollegeMyProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.app_metadata.college_id) {
    redirect('/login')
  }

  const role = user.app_metadata.role || 'college_staff'
  const collegeId = user.app_metadata.college_id

  // Fetch db user profile and college departments
  const [{ data: dbUser }, { data: college }] = await Promise.all([
    supabase
      .from('users')
      .select('first_name, last_name, phone, department')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('colleges')
      .select('name, onboarding_fields')
      .eq('id', collegeId)
      .maybeSingle(),
  ])

  const firstName = dbUser?.first_name || user.user_metadata?.first_name || ''
  const lastName = dbUser?.last_name || user.user_metadata?.last_name || ''
  const phone = dbUser?.phone || user.user_metadata?.phone || ''
  const department = dbUser?.department || user.user_metadata?.department || ''
  const collegeName = college?.name || 'Your Institution'
  const academicDepartments = college?.onboarding_fields?.departments || []

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
          <UserCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            My Profile
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage your personal profile details, placement contact phone, and department wing.
          </p>
        </div>
      </div>

      <MyProfileForm
        initialProfile={{
          firstName,
          lastName,
          email: user.email || '',
          phone,
          department,
          role,
          collegeName,
        }}
        academicDepartments={academicDepartments}
      />
    </div>
  )
}
