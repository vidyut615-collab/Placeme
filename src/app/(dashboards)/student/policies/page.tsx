import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentPoliciesViewer } from '@/components/StudentPoliciesViewer'
import { PenaltyHistoryCard, PenaltyHistoryLogEntry } from '@/components/PenaltyHistoryCard'
import { PenaltySummaryCard, PenaltyLogEntry } from '@/components/PenaltySummaryCard'
import { PolicyConfig, DEFAULT_POLICY_CONFIG } from '@/lib/policy-engine'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldAlert, FileText, ShieldCheck } from 'lucide-react'
import { DeclareHiredModal } from '@/components/DeclareHiredModal'

export default async function StudentPoliciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's details
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id, profile_data, policy_counters, is_blacklisted')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div className="p-8 text-zinc-400 font-mono text-sm">Error loading candidate profile.</div>
  }

  // Fetch policies for the college
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', student.college_id)
    .single()
    
  const rawConfig = (policyDoc?.config as unknown as Partial<PolicyConfig>) || {}
  const config = {
    ...DEFAULT_POLICY_CONFIG,
    ...rawConfig,
    upgrade: {
      ...DEFAULT_POLICY_CONFIG.upgrade,
      ...(rawConfig.upgrade || {}),
    },
    dream: {
      ...DEFAULT_POLICY_CONFIG.dream,
      ...(rawConfig.dream || {}),
    },
    super_dream: {
      ...DEFAULT_POLICY_CONFIG.super_dream,
      ...(rawConfig.super_dream || {}),
    },
    offer_limit: {
      ...DEFAULT_POLICY_CONFIG.offer_limit,
      ...(rawConfig.offer_limit || {}),
    },
    application_limit: {
      ...DEFAULT_POLICY_CONFIG.application_limit,
      ...(rawConfig.application_limit || {}),
    },
  } as PolicyConfig

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
    .select('id, job_id, status, created_at, jobs(title, company_name, college_id, compensation_ctc, placement_level_id)')
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
      const job = app.jobs as unknown as {
        college_id: string | null
        compensation_ctc: number | string | null
        placement_level_id: string | null
      } | null
      if (!job) return

      const isGlobal = job.college_id === null
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
    .select('id, status, compensation_ctc, company_name, job_role, offer_type, offer_letter_url, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    
  // Fetch penalty logs
  const { data: penaltyLogs } = await supabase
    .from('student_penalty_logs')
    .select('id, action, policy_code, created_at, metadata, action_by_user_id')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  let totalOffers = 0
  let highestOfferCTC = 0
  
  if (offers) {
    const validOffers = offers.filter(o => ['pending', 'approved'].includes(o.status))
    totalOffers = validOffers.length
    highestOfferCTC = Math.max(0, ...validOffers.map(o => Number(o.compensation_ctc) || 0))
  }

  const approvedOffer = offers?.find((o) => o.status === 'approved')
  const pendingOffer = offers?.find((o) => o.status === 'pending')
  const appliedJobsSummary = (applications || []).map((app) => ({
    id: app.id,
    job_id: app.job_id,
    jobs: Array.isArray(app.jobs) ? app.jobs[0] : app.jobs,
  }))

  const profileData = (student.profile_data as Record<string, unknown>) || {}
  const policyCounters = (student.policy_counters as Record<string, unknown>) || {}
  const totalStrikes = (Number(policyCounters.non_participation) || 0) + (Number(policyCounters.no_shows) || 0) + (Number(policyCounters.disciplinary) || 0)

  const studentMetrics = {
    isBlacklisted: Boolean(student.is_blacklisted),
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
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
              Placement Governance &amp; Policies
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 font-medium">
              Institutional rulebook
            </span>
          </div>
          <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-1">
            Review live quota limitations, strike penalties, and dream upgrade rules active for your graduating batch.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {totalStrikes === 0 ? (
            <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500/[0.08] dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
              Zero Strikes (Good Standing)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-500/[0.08] dark:bg-amber-500/15 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 stroke-[1.5]" />
              {totalStrikes} Strike(s) Active
            </span>
          )}

          <DeclareHiredModal
            appliedJobs={appliedJobsSummary}
            hasPendingOffer={Boolean(pendingOffer)}
            pendingOfferDetails={
              pendingOffer
                ? {
                    company_name: pendingOffer.company_name,
                    job_role: pendingOffer.job_role,
                    compensation_ctc: pendingOffer.compensation_ctc,
                    offer_type: pendingOffer.offer_type,
                    offer_letter_url: pendingOffer.offer_letter_url,
                    created_at: pendingOffer.created_at,
                  }
                : null
            }
            approvedOfferDetails={
              approvedOffer
                ? {
                    company_name: approvedOffer.company_name,
                    job_role: approvedOffer.job_role,
                    compensation_ctc: Number(approvedOffer.compensation_ctc),
                  }
                : null
            }
          />
        </div>
      </div>

      <Tabs defaultValue="policies" className="w-full space-y-6">
        <TabsList className="bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] p-1 rounded-xl h-auto">
          <TabsTrigger
            value="policies"
            className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg text-[#57534E] dark:text-[#ACA59A] data-[state=active]:bg-white dark:data-[state=active]:bg-[#191816] data-[state=active]:text-[#0F766E] dark:data-[state=active]:text-[#14B8A6] data-[state=active]:shadow-[0_1px_2px_rgba(28,25,23,0.06)] font-medium transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
            Rules &amp; Quotas
          </TabsTrigger>
          <TabsTrigger
            value="disciplinary"
            className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg text-[#57534E] dark:text-[#ACA59A] data-[state=active]:bg-white dark:data-[state=active]:bg-[#191816] data-[state=active]:text-[#0F766E] dark:data-[state=active]:text-[#14B8A6] data-[state=active]:shadow-[0_1px_2px_rgba(28,25,23,0.06)] font-medium transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 stroke-[1.5]" />
            Disciplinary Ledger
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="policies" className="mt-0 space-y-6">
          <StudentPoliciesViewer config={config} studentMetrics={studentMetrics} />
        </TabsContent>
        
        <TabsContent value="disciplinary" className="mt-0 space-y-6">
          {!penaltyLogs || penaltyLogs.length === 0 ? (
            <div className="text-center p-12 border rounded-xl border-dashed border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] text-[#78716C] dark:text-[#8A847A] space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
              <h3 className="font-medium text-sm text-[#1C1917] dark:text-[#EFECE6]">Exemplary Standing</h3>
              <p className="text-xs text-[#78716C] dark:text-[#8A847A] max-w-sm mx-auto">
                No policy violations, interview no-shows, or disciplinary infractions recorded in your institutional ledger.
              </p>
            </div>
          ) : (
            <>
              <PenaltySummaryCard logs={penaltyLogs as unknown as PenaltyLogEntry[]} />
              <PenaltyHistoryCard logs={penaltyLogs as unknown as PenaltyHistoryLogEntry[]} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
