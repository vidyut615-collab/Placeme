import { AgencySidebar, agencyNavigation } from '@/components/AgencySidebar'
import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileUserMenu } from '@/components/MobileUserMenu'

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AgencySidebar />
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

        <BottomNav items={agencyNavigation} />
      </div>
    </div>
  )
}
