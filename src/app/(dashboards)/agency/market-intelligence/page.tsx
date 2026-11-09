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

  // Fetch counts globally so metric cards are accurate across the entire lake
  const [totalRes, cleanRes, scamRes, jobsRes] = await Promise.all([
    supabase.from('discovered_jobs_lake').select('*', { count: 'exact', head: true }),
    supabase.from('discovered_jobs_lake').select('*', { count: 'exact', head: true }).eq('scam_status', 'clean'),
    supabase.from('discovered_jobs_lake').select('*', { count: 'exact', head: true }).in('scam_status', ['scam', 'suspicious']),
    supabase
      .from('discovered_jobs_lake')
      .select('id, title, company_name, location, workplace_mode, employment_type, primary_role, skills_required, sources, scam_status, created_at')
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  const totalCount = totalRes.count || 0
  const cleanCount = cleanRes.count || 0
  const scamCount = scamRes.count || 0
  const jobs = jobsRes.data || []

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
