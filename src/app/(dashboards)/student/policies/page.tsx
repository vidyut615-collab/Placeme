import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentPoliciesViewer } from '@/components/StudentPoliciesViewer'
import { PolicyConfig, DEFAULT_POLICY_CONFIG } from '@/lib/policy-engine'

export default async function StudentPoliciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's details
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id, profile_data, policy_counters')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading student profile.</div>
  }

  // Fetch policies for the college
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', student.college_id)
    .single()
    
  const config = (policyDoc?.config || DEFAULT_POLICY_CONFIG) as PolicyConfig

  // Fetch all applications
  const { data: applications } = await supabase
    .from('applications')
    .select('status, created_at')
    .eq('student_id', student.id)
    
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000

  let totalApps = 0
  let activeApps = 0
  let appsToday = 0
  let appsThisWeek = 0

  if (applications) {
    totalApps = applications.length
    applications.forEach(app => {
      // Consider active if not rejected, dropped, or forfeited
      if (!['rejected', 'dropped', 'forfeited'].includes(app.status)) {
        activeApps++
      }
      const appTime = new Date(app.created_at).getTime()
      if (appTime >= today) appsToday++
      if (appTime >= oneWeekAgo) appsThisWeek++
    })
  }

  // Fetch offers
  const { data: offers } = await supabase
    .from('student_offers')
    .select('status, compensation_ctc')
    .eq('student_id', student.id)
    
  let totalOffers = 0
  let highestOfferCTC = 0
  
  if (offers) {
    const validOffers = offers.filter(o => ['pending', 'approved'].includes(o.status))
    totalOffers = validOffers.length
    highestOfferCTC = Math.max(0, ...validOffers.map(o => Number(o.compensation_ctc) || 0))
  }

  const profileData = student.profile_data as any || {}
  const policyCounters = student.policy_counters as any || {}

  const studentMetrics = {
    cgpa: Number(profileData.cgpa) || 0,
    activeBacklogs: Number(profileData.active_backlogs) || 0,
    totalApplications: totalApps,
    activeApplications: activeApps,
    applicationsToday: appsToday,
    applicationsThisWeek: appsThisWeek,
    totalOffers,
    highestOfferCTC,
    policyCounters: {
      non_participation: Number(policyCounters.non_participation) || 0,
      no_shows: Number(policyCounters.no_shows) || 0,
      withdrawals: Number(policyCounters.withdrawals) || 0,
      post_shortlist_withdrawals: Number(policyCounters.post_shortlist_withdrawals) || 0,
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Placement Policies</h1>
        <p className="text-zinc-500 mt-2">Review the placement rules and policies set by your college, along with your current standing.</p>
      </div>

      <StudentPoliciesViewer config={config} studentMetrics={studentMetrics} />
    </div>
  )
}
