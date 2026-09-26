import { AgencySidebar } from '@/components/AgencySidebar'
import { AgencyBottomNav } from '@/components/AgencyBottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileUserMenu } from '@/components/MobileUserMenu'
import { createClient } from '@/utils/supabase/server'

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role || 'agency_staff'

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AgencySidebar role={role} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 border-b bg-white dark:bg-zinc-950 px-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight">Placeme</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MobileUserMenu />
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        <AgencyBottomNav role={role} />
      </div>
    </div>
  )
}
