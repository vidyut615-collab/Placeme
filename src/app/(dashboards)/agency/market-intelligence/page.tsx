import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { MarketIntelligenceClient } from './MarketIntelligenceClient'

export default async function MarketIntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role || ''
  if (!['agency_admin', 'agency_staff', 'superadmin'].includes(role)) {
    redirect('/login')
  }

  // Fetch jobs from Discovered Jobs Lake
  const { data: jobs, count: totalCount } = await supabase
    .from('discovered_jobs_lake')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  const cleanCount = jobs?.filter((j) => j.scam_status === 'clean').length || 0
  const scamCount = jobs?.filter((j) => j.scam_status === 'scam' || j.scam_status === 'suspicious').length || 0

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Intelligence &amp; Job Lake</h1>
        <p className="text-zinc-500 mt-1">
          Explore multi-portal scraped off-campus opportunities, monitor scam detection audits, and analyze hiring volume.
        </p>
      </div>

      <MarketIntelligenceClient
        jobs={jobs || []}
        totalCount={totalCount || jobs?.length || 0}
        cleanCount={cleanCount}
        scamCount={scamCount}
      />
    </div>
  )
}
