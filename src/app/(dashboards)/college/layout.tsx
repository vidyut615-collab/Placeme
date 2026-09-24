import { createClient } from '@/utils/supabase/server'
import {
  CollegeSidebar,
  collegeAdminNavigation,
  collegeStaffNavigation,
} from '@/components/CollegeSidebar'
import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CollegeMobileUserMenu } from '@/components/CollegeMobileUserMenu'

export default async function CollegeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user?.app_metadata?.role || 'college_staff'

  let userProfile: {
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    department?: string | null
    college_id?: string | null
  } | null = null

  let collegeName = 'Your Institution'
  let academicDepartments: string[] = []

  if (user) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('first_name, last_name, phone, department, college_id')
      .eq('id', user.id)
      .maybeSingle()
    userProfile = dbUser

    const collegeId = dbUser?.college_id || user.app_metadata?.college_id
    if (collegeId) {
      const { data: college } = await supabase
        .from('colleges')
        .select('name, onboarding_fields')
        .eq('id', collegeId)
        .maybeSingle()
      if (college) {
        collegeName = college.name || 'Your Institution'
        academicDepartments = college.onboarding_fields?.departments || []
      }
    }
  }

  const firstName = userProfile?.first_name || user?.user_metadata?.first_name || ''
  const lastName = userProfile?.last_name || user?.user_metadata?.last_name || ''
  const phone = userProfile?.phone || user?.user_metadata?.phone || ''
  const department = userProfile?.department || user?.user_metadata?.department || null

  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.user_metadata?.full_name ||
    (role === 'college_admin' ? 'College Admin' : 'College Staff')

  const navigationItems = role === 'college_admin' ? collegeAdminNavigation : collegeStaffNavigation

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <CollegeSidebar
          role={role}
          userName={fullName}
          userEmail={user?.email}
          department={department}
          firstName={firstName}
          lastName={lastName}
          phone={phone}
          collegeName={collegeName}
          availableDepartments={academicDepartments}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 border-b bg-white dark:bg-zinc-950 px-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight">College Portal</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <CollegeMobileUserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</main>

        <BottomNav items={navigationItems} />
      </div>
    </div>
  )
}
