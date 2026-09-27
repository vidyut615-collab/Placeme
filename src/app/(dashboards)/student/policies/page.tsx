import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentPoliciesViewer } from '@/components/StudentPoliciesViewer'
import { PenaltyHistoryCard } from '@/components/PenaltyHistoryCard'
import { PenaltySummaryCard } from '@/components/PenaltySummaryCard'
import { PolicyConfig, DEFAULT_POLICY_CONFIG } from '@/lib/policy-engine'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldAlert, FileText } from 'lucide-react'

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

  // Fetch global platform settings
  const { data: platformSettings } = await supabase
    .from('platform_settings')
    .select('max_global_applications_per_student')
    .single()

  const maxGlobalApps = platformSettings?.max_global_applications_per_student || 10

  // Fetch placement levels for accurate dream matching
  const { data: placementLevels } = await supabase
    .from('placement_levels')
    .select('id, is_dream, is_super_dream')
    .eq('college_id', student.college_id)
    
  const levelsMap = new Map()
  if (placementLevels) {
    placementLevels.forEach(l => {
      levelsMap.set(l.id, { dream: l.is_dream, superDream: l.is_super_dream })
    })
  }

  // Fetch all applications with job CTC and level
  const { data: applications } = await supabase
    .from('applications')
    .select('status, created_at, jobs(college_id, compensation_ctc, placement_level_id)')
    .eq('student_id', student.id)
    
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000

  let totalApps = 0
  let activeApps = 0
  let globalApps = 0
  let appsToday = 0
  let appsThisWeek = 0
  
  let dreamAttempts = 0
  let superDreamAttempts = 0

  if (applications) {
    applications.forEach(app => {
      const job = app.jobs as any
      if (!job) return

      const isGlobal = job.college_id === null;
      if (isGlobal) {
        globalApps++
      } else {
        totalApps++
        if (!['rejected', 'dropped', 'forfeited'].includes(app.status)) {
          activeApps++
        }
      }
      
      const appTime = new Date(app.created_at).getTime()
      if (appTime >= today) appsToday++
      if (appTime >= oneWeekAgo) appsThisWeek++
      
      // Calculate Dream / Super Dream attempts
      const ctc = Number(job.compensation_ctc) || 0
      const levelId = job.placement_level_id
      
      let isSuperDream = false
      let isDream = false
      
      if (config.super_dream?.enabled) {
        if (config.super_dream.classification_method === 'ctc_based' && config.super_dream.min_ctc) {
          if (ctc >= config.super_dream.min_ctc) isSuperDream = true
        } else if (levelId && levelsMap.has(levelId) && levelsMap.get(levelId).superDream) {
          isSuperDream = true
        }
      }
      
      if (config.dream?.enabled) {
        if (config.dream.classification_method === 'ctc_based' && config.dream.min_ctc) {
          if (ctc >= config.dream.min_ctc && !isSuperDream) isDream = true
        } else if (levelId && levelsMap.has(levelId) && levelsMap.get(levelId).dream && !isSuperDream) {
          isDream = true
        }
      }
      
      if (isSuperDream) superDreamAttempts++
      else if (isDream) dreamAttempts++
    })
  }

  // Fetch offers
  const { data: offers } = await supabase
    .from('student_offers')
    .select('status, compensation_ctc')
    .eq('student_id', student.id)
    
  // Fetch penalty logs
  const { data: penaltyLogs, error: penaltyLogsError } = await supabase
    .from('student_penalty_logs')
    .select('id, action, policy_code, created_at, metadata, action_by_user_id')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    
  if (penaltyLogsError) {
    console.error("Failed to fetch penalty logs:", penaltyLogsError)
  }

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
    globalApplications: globalApps,
    maxGlobalApplications: maxGlobalApps,
    applicationsToday: appsToday,
    applicationsThisWeek: appsThisWeek,
    dreamAttempts,
    superDreamAttempts,
    totalOffers,
    highestOfferCTC,
    policyCounters: {
      non_participation: Number(policyCounters.non_participation) || 0,
      no_shows: Number(policyCounters.no_shows) || 0,
      withdrawals: Number(policyCounters.withdrawals) || 0,
      post_shortlist_withdrawals: Number(policyCounters.post_shortlist_withdrawals) || 0,
      disciplinary: Number(policyCounters.disciplinary) || 0,
      integrity: Number(policyCounters.integrity) || 0,
      offer_rejections: Number(policyCounters.offer_rejections) || 0,
      upgrades_used: Number(policyCounters.upgrades_used) || 0,
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Placement Policies</h1>
        <p className="text-zinc-500 mt-2">Review the placement rules and policies set by your college, along with your current standing.</p>
      </div>

      <Tabs defaultValue="policies" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Policies & Limits
          </TabsTrigger>
          <TabsTrigger value="disciplinary" className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Disciplinary Record
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="policies" className="mt-0">
          <StudentPoliciesViewer config={config} studentMetrics={studentMetrics} />
        </TabsContent>
        
        <TabsContent value="disciplinary" className="mt-0 space-y-6">
          {!penaltyLogs || penaltyLogs.length === 0 ? (
            <div className="text-center p-12 border rounded-xl border-dashed bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-500">
              <ShieldAlert className="w-10 h-10 mx-auto text-zinc-400 mb-4" />
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">Clean Disciplinary Record</h3>
              <p className="max-w-md mx-auto mt-2">You have no policy violations or disciplinary actions on your record.</p>
            </div>
          ) : (
            <>
              <PenaltySummaryCard logs={penaltyLogs as any} />
              <PenaltyHistoryCard logs={penaltyLogs as any} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
