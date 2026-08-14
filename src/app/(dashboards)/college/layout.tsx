import { CollegeSidebar, collegeNavigation } from '@/components/CollegeSidebar'
import { BottomNav } from '@/components/BottomNav'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function CollegeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <CollegeSidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 border-b bg-white dark:bg-zinc-950 px-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold tracking-tight">College Portal</span>
          </div>
          <ThemeToggle />
        </header>
        
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        <BottomNav items={collegeNavigation} />
      </div>
    </div>
  )
}
