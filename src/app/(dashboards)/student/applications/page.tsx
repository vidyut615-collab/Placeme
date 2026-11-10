import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Award, Clock, AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { StudentApplicationsDirectory } from '@/components/StudentApplicationsDirectory'

export default async function StudentApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's ID
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div className="p-8 text-zinc-400 font-mono text-sm">Error loading candidate profile.</div>
  }

  // Fetch applications with joined job details
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id,
      job_id,
      status,
      dropped_reason,
      created_at,
      jobs (
        title,
        company_name,
        compensation_ctc,
        college_id,
        status,
        custom_stages,
        cancellation_reason,
        cancelled_at
      )
    `)
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  // Fetch student declared placement offers
  const { data: offers } = await supabase
    .from('student_offers')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const approvedOffer = offers?.find(o => o.status === 'approved')
  const pendingOffer = offers?.find(o => o.status === 'pending')
  const rejectedOffer = offers?.find(o => o.status === 'rejected')

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Applications Conveyor</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Deterministic 14-Stage
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track interview rounds, assessment status, and offer declarations in real time.
          </p>
        </div>
      </div>

      {/* Official Placement Status Banner */}
      {approvedOffer && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0 stroke-[1.5]" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-900 dark:text-emerald-200 text-sm">
                <span>Officially Placed Candidate</span>
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  1-Offer Multiplier Rule Active
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Your placement at <strong className="text-zinc-900 dark:text-zinc-100">{approvedOffer.company_name}</strong> for the role of <strong className="text-zinc-900 dark:text-zinc-100">{approvedOffer.job_role}</strong> (₹{approvedOffer.compensation_ctc} LPA) has been officially confirmed by your college. You remain eligible only for Dream or Super Dream upgrades with a 1.5× CTC multiplier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Offer Verification Banner */}
      {pendingOffer && !approvedOffer && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0 stroke-[1.5]" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                Offer Declaration Under Verification
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Your submitted offer for <strong className="text-zinc-900 dark:text-zinc-100">{pendingOffer.company_name}</strong> (₹{pendingOffer.compensation_ctc} LPA) is currently under review by the college placement committee.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Offer Notice */}
      {rejectedOffer && !approvedOffer && !pendingOffer && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0 stroke-[1.5]" />
            <div className="space-y-1">
              <div className="font-semibold text-rose-900 dark:text-rose-200 text-sm">
                Offer Declaration Returned
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Your previous declaration for {rejectedOffer.company_name} was returned: {rejectedOffer.rejection_reason || 'Requires document or verification update'}. You may submit a corrected declaration to your TPO.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Linear Interactive Applications Directory */}
      <StudentApplicationsDirectory initialApplications={(applications as any) || []} />
    </div>
  )
}
