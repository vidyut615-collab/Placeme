import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert, GraduationCap, Phone, Mail, Building2, User, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/utils'
import { PenaltyHistoryCard } from '@/components/PenaltyHistoryCard'
import { PenaltySummaryCard } from '@/components/PenaltySummaryCard'
import { StudentPoliciesViewer } from '@/components/StudentPoliciesViewer'
import { PolicyConfig, DEFAULT_POLICY_CONFIG } from '@/lib/policy-engine'

export default async function StudentProfileAuditPage({ params }: { params: Promise<{ studentId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { studentId } = await params

  if (!user || user.app_metadata.role !== 'college_staff' && user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'superadmin' && user.app_metadata.role !== 'agency_staff') {
    redirect('/login')
  }

  // 1. Fetch Student Profile and Policy Data
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id,
      college_id,
      is_blacklisted,
      blacklist_reason,
      policy_counters,
      onboarding_status,
      created_at,
      profile_data,
      users!inner ( email )
    `)
    .eq('id', studentId)
    .single()

  if (error || !student) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Student Not Found</h1>
        <p className="text-zinc-500 mt-2">The student profile you are looking for does not exist or you do not have permission.</p>
        <Link href="/college/students" className="text-blue-600 hover:underline mt-4 inline-block">&larr; Back to Directory</Link>
      </div>
    )
  }

  const profile = student.profile_data || {}
  const counters = student.policy_counters || {}

  // 2. Fetch Application History (Audit Log) & Penalty Logs concurrently
  const [
    { data: applications },
    { data: penaltyLogs },
    { data: policyDoc },
    { data: platformSettings },
    { data: placementLevels },
    { data: offers }
  ] = await Promise.all([
    supabase
      .from('applications')
      .select(`
        id,
        status,
        dropped_reason,
        created_at,
        updated_at,
        jobs (
          id,
          title,
          company_name,
          college_id,
          compensation_ctc,
          placement_level_id
        )
      `)
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('student_penalty_logs')
      .select('id, action, policy_code, created_at, metadata, action_by_user_id')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),
    supabase
      .from('placement_policies')
      .select('config')
      .eq('college_id', student.college_id)
      .single(),
    supabase
      .from('platform_settings')
      .select('max_global_applications_per_student')
      .single(),
    supabase
      .from('placement_levels')
      .select('id, is_dream, is_super_dream')
      .eq('college_id', student.college_id),
    supabase
      .from('student_offers')
      .select('status, compensation_ctc')
      .eq('student_id', studentId)
  ])

  // --- Process Student Metrics for Policy Viewer ---
  const config = (policyDoc?.config || DEFAULT_POLICY_CONFIG) as PolicyConfig
  const maxGlobalApps = platformSettings?.max_global_applications_per_student || 10
  
  const levelsMap = new Map()
  if (placementLevels) {
    placementLevels.forEach(l => {
      levelsMap.set(l.id, { dream: l.is_dream, superDream: l.is_super_dream })
    })
  }

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
      if (isGlobal) globalApps++
      else {
        totalApps++
        if (!['rejected', 'dropped', 'forfeited'].includes(app.status)) activeApps++
      }
      
      const appTime = new Date(app.created_at).getTime()
      if (appTime >= today) appsToday++
      if (appTime >= oneWeekAgo) appsThisWeek++
      
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

  let totalOffers = 0
  let highestOfferCTC = 0
  if (offers) {
    const validOffers = offers.filter(o => ['pending', 'approved'].includes(o.status))
    totalOffers = validOffers.length
    highestOfferCTC = Math.max(0, ...validOffers.map(o => Number(o.compensation_ctc) || 0))
  }

  const studentMetrics = {
    cgpa: Number(profile.cgpa) || 0,
    activeBacklogs: Number(profile.active_backlogs) || 0,
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
      non_participation: Number(counters.non_participation) || 0,
      no_shows: Number(counters.no_shows) || 0,
      withdrawals: Number(counters.withdrawals) || 0,
      post_shortlist_withdrawals: Number(counters.post_shortlist_withdrawals) || 0,
      disciplinary: Number(counters.disciplinary) || 0,
      integrity: Number(counters.integrity) || 0,
      offer_rejections: Number(counters.offer_rejections) || 0,
      upgrades_used: Number(counters.upgrades_used) || 0,
    }
  }

  // --- Formatters ---
  const formatStatus = (status: string) => {
    switch (status) {
      case 'applied': return <Badge variant="secondary">Applied</Badge>;
      case 'shortlisted': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">Shortlisted</Badge>;
      case 'interviewing': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none">Interviewing</Badge>;
      case 'offered': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Offered</Badge>;
      case 'hired': return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Hired / Placed</Badge>;
      case 'dropped': return <Badge variant="destructive">Dropped</Badge>;
      case 'forfeited': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Forfeited</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  const formatDropReason = (reason: string | null) => {
    if (!reason) return '?"'
    const map: Record<string, string> = {
      student_withdrew: 'Student Withdrew Mid-Process',
      student_withdrew_post_shortlist: 'Student Withdrew Post-Shortlist',
      did_not_qualify: 'Did Not Qualify',
      no_show: 'No-Show (Interview)',
      non_participation: 'Non-Participation (Failed to Apply)',
      excused_absence: 'Excused Absence',
      unprofessional_conduct: 'Unprofessional Conduct',
      data_fraud: 'Data Fraud',
      revoked_by_company: 'Revoked by Company'
    }
    return map[reason] || reason
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
      <Link href="/college/students" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 flex items-center gap-1 w-fit mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </Link>
      
      {/* 1. Top Blue Banner */}
      <div className="bg-blue-50/80 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-100">
            {profile.full_name || 'Incomplete Profile'}
          </h1>
          <p className="text-blue-700/80 dark:text-blue-400/80 mt-1 flex items-center gap-2">
            <Mail className="h-4 w-4" /> {(student.users as any)?.email}
          </p>
          {student.is_blacklisted && (
            <div className="bg-red-50 text-red-900 px-3 py-1.5 mt-3 rounded-md border border-red-200 flex items-center gap-2 w-fit">
              <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
              <span className="font-semibold text-sm">Blacklisted: {student.blacklist_reason}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200 font-medium bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-md border border-blue-100/50 dark:border-blue-900/30 w-fit">
            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {profile.type || 'N/A'} • {profile.department || 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-md border border-blue-100/50 dark:border-blue-900/30 w-fit">
            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            {profile.phone || 'No Phone Provided'}
          </div>
        </div>
      </div>

      {/* 2. Main Tabbed Layout */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
        </TabsList>
        
        {/* TAB 1: Profile */}
        <TabsContent value="profile" className="mt-0 space-y-6">
          <Card>
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-zinc-500" />
                Academic Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-6 text-sm">
                <div>
                  <div className="text-zinc-500 mb-1">Graduation Year</div>
                  <div className="font-semibold text-base">{profile.year || '?"'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Current GPA</div>
                  <div className="font-semibold text-base">{profile.gpa || '?"'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Onboarding</div>
                  <div className="font-semibold text-base capitalize">{student.onboarding_status}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">10th %</div>
                  <div className="font-semibold text-base">{profile.academic_10th || '?"'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">12th %</div>
                  <div className="font-semibold text-base">{profile.academic_12th || '?"'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Diploma %</div>
                  <div className="font-semibold text-base">{profile.diploma_percentage || '?"'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">UG %</div>
                  <div className="font-semibold text-base">{profile.graduation_percentage || '?"'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Active Backlogs</div>
                  <div className="font-semibold text-base text-red-600 dark:text-red-400">{profile.active_backlogs || '0'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Hist. Backlogs</div>
                  <div className="font-semibold text-base">{profile.historical_backlogs || '0'}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Gap Years</div>
                  <div className="font-semibold text-base">{profile.academic_gap_years || '0'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Applications */}
        <TabsContent value="applications" className="mt-0">
          <Card>
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b flex flex-row items-center gap-2">
              <Building2 className="h-5 w-5 text-zinc-500" />
              <div>
                <CardTitle className="text-lg">Application History</CardTitle>
                <CardDescription>Comprehensive log of all jobs applied to by this student.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company & Job</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Drop/Withdrawal Reason</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications && applications.length > 0 ? (
                    applications.map((app: any) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{app.jobs?.company_name}</div>
                          <div className="text-xs text-zinc-500">{app.jobs?.title}</div>
                        </TableCell>
                        <TableCell>{formatStatus(app.status)}</TableCell>
                        <TableCell>
                          {app.dropped_reason ? (
                            <div className="text-sm">
                              <span className="text-zinc-500">{formatDropReason(app.dropped_reason.split(':')[0])}</span>
                              {app.dropped_reason.includes(':') && (
                                <span className="block text-xs text-zinc-400 mt-0.5 max-w-[200px] truncate" title={app.dropped_reason.split(':')[1]}>
                                  {app.dropped_reason.split(':')[1]}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-sm">?"</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-500">{formatDate(app.created_at)}</TableCell>
                        <TableCell className="text-sm text-zinc-500">{formatDate(app.updated_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                        No applications found for this student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Policy */}
        <TabsContent value="policy" className="mt-0">
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
                  <p className="max-w-md mx-auto mt-2">This student has no policy violations or disciplinary actions on their record.</p>
                </div>
              ) : (
                <>
                  <PenaltySummaryCard logs={penaltyLogs as any} />
                  <PenaltyHistoryCard logs={penaltyLogs as any} />
                </>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}
