import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentJobCard } from '@/components/StudentJobCard'

export default async function StudentJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's college_id and blacklist status
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id, is_blacklisted, policy_counters')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading student profile.</div>
  }

  // Check if student is already placed
  const { data: applications } = await supabase
    .from('applications')
    .select('job_id, status, jobs(compensation_ctc)')
    .eq('student_id', student.id)

  const appliedJobIds = new Set(applications?.map(app => app.job_id) || [])
  const hiredApps = applications?.filter(a => a.status === 'hired') || []
  const isPlaced = hiredApps.length > 0
  const maxCurrentCtc = isPlaced ? Math.max(...hiredApps.map(a => (a.jobs as any)?.compensation_ctc || 0)) : 0

  // Fetch policies for upgrade multiplier
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', student.college_id)
    .single()
    
  const config = policyDoc?.config || {}
  const upgradeConfig = config.upgrade || { enabled: false, min_multiplier: 1 }

  // Fetch active jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, description, college_id, created_at, compensation_ctc')
    .eq('status', 'active')
    .or(`college_id.is.null,college_id.eq.${student.college_id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobs Board</h1>
        <p className="text-zinc-500 mt-2">Discover and apply to open positions.</p>
      </div>

      {student.is_blacklisted && (
        <div className="bg-red-50 text-red-900 border border-red-200 p-4 rounded-md">
          <h3 className="font-semibold">Account Suspended</h3>
          <p className="text-sm mt-1">You are currently blacklisted from applying to jobs. Please contact your college administrator.</p>
        </div>
      )}

      {isPlaced && !student.is_blacklisted && (
        <div className="bg-blue-50 text-blue-900 border border-blue-200 p-4 rounded-md">
          <h3 className="font-semibold">Placed Status Active</h3>
          <p className="text-sm mt-1">You already hold a job offer. Upgrades are {upgradeConfig.enabled ? 'enabled' : 'disabled'} for your college.</p>
          {upgradeConfig.enabled && (
            <p className="text-sm mt-1">You can only apply for jobs offering at least {upgradeConfig.min_multiplier}x your current CTC (₹{(maxCurrentCtc * upgradeConfig.min_multiplier).toLocaleString()}).</p>
          )}
        </div>
      )}

      {!jobs || jobs.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center text-sm text-zinc-500">
          No active jobs are currently available. Check back later!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => {
            const hasApplied = appliedJobIds.has(job.id)
            let disabledReason = ''
            
            if (student.is_blacklisted) {
              disabledReason = 'Blacklisted'
            } else if (isPlaced) {
              if (!upgradeConfig.enabled) {
                disabledReason = 'Placed (Upgrades Disabled)'
              } else {
                const requiredCtc = maxCurrentCtc * (upgradeConfig.min_multiplier || 1)
                const jobCtc = job.compensation_ctc || 0
                if (jobCtc <= maxCurrentCtc || jobCtc < requiredCtc) {
                  disabledReason = 'CTC Too Low for Upgrade'
                } else if ((student.policy_counters?.upgrades_used || 0) >= (upgradeConfig.max_allowed || 1)) {
                  disabledReason = 'Max Upgrade Attempts Reached'
                }
              }
            }

            return (
              <StudentJobCard 
                key={job.id} 
                job={job} 
                hasApplied={hasApplied}
                disabledReason={disabledReason}
                isUpgrade={isPlaced && !disabledReason && !hasApplied}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
