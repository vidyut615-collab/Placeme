import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PlacementReadinessClient } from './PlacementReadinessClient'

export default async function PlacementReadinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role || ''
  if (!['college_admin', 'college_staff', 'superadmin'].includes(role)) {
    redirect('/login')
  }

  const collegeId = user.app_metadata?.college_id || (
    await supabase.from('users').select('college_id').eq('id', user.id).single()
  ).data?.college_id

  let departments: string[] = [
    'Computer Engineering',
    'Information Technology',
    'Electronics & Telecommunication',
    'Artificial Intelligence & Data Science',
    'Mechanical Engineering',
  ]

  if (collegeId) {
    const { data: college } = await supabase
      .from('colleges')
      .select('onboarding_fields')
      .eq('id', collegeId)
      .maybeSingle()

    if (college?.onboarding_fields?.departments && college.onboarding_fields.departments.length > 0) {
      departments = college.onboarding_fields.departments
    }
  }

  // Fetch past reports
  const { data: pastReports } = await supabase
    .from('tpo_readiness_reports')
    .select('*')
    .eq('college_id', collegeId)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Placement Readiness</h1>
        <p className="text-zinc-500 mt-1">
          Batch-level skill intelligence, deficit heatmaps, and data-driven workshop recommendations.
        </p>
      </div>

      <PlacementReadinessClient
        departments={departments}
        pastReports={pastReports || []}
      />
    </div>
  )
}
