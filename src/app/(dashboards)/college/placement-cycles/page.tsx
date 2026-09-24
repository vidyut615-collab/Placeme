import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PlacementCyclesManager } from '@/components/PlacementCyclesManager'
import { Calendar } from 'lucide-react'

export default async function CollegePlacementCyclesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.app_metadata.college_id) {
    redirect('/login')
  }

  const isAdmin = user.app_metadata.role === 'college_admin'

  // Fetch placement cycles with linked jobs count
  const { data: cycles, error } = await supabase
    .from('placement_cycles')
    .select('id, name, start_date, end_date, is_active, created_at, jobs(id)')
    .eq('college_id', user.app_metadata.college_id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Error loading placement cycles</h1>
        <p className="text-zinc-500 mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Placement Cycles
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage academic placement cycles, batches, and active recruitment seasons for your institution.
          </p>
        </div>
      </div>

      <PlacementCyclesManager initialCycles={cycles || []} isAdmin={isAdmin} />
    </div>
  )
}
