import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { WithdrawButton } from '@/components/WithdrawButton'
import { Award, Clock, AlertTriangle, CheckCircle2, FileCheck } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const statusMap: Record<string, { label: string, color: string }> = {
  'applied': { label: 'Applied', color: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300' },
  'shortlisted': { label: 'Shortlisted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'interviewing': { label: 'Interviewing', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  'offered': { label: 'Offered', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'hired': { label: 'Hired (Drive)', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'closed': { label: 'Closed / Out', color: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400' },
  'dropped': { label: 'Dropped / Exited', color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' },
  'cancelled': { label: 'Drive Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' },
}

const formatStudentDropReason = (reason: string | null) => {
  if (!reason) return 'Application dropped / closed'
  const map: Record<string, string> = {
    non_participation: 'Non-Participation Penalty (Eligible but did not apply)',
    excused_absence: 'Excused Non-Applicant (No Strike Accrued)',
    student_withdrew: 'Withdrew Mid-Process',
    student_withdrew_post_shortlist: 'Withdrew Post-Shortlist',
    did_not_qualify: 'Did Not Qualify',
    no_show: 'No-Show (Interview)',
    unprofessional_conduct: 'Unprofessional Conduct',
    data_fraud: 'Data Fraud',
    revoked_by_company: 'Revoked by Company'
  }
  return map[reason] || reason
}

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
    return <div>Error loading student profile.</div>
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
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-zinc-500 mt-1">Track the live status of your job applications.</p>
      </div>

      {/* Official Placement Status Banner */}
      {approvedOffer && (
        <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>Officially Placed</span>
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs">
                  1-Offer Policy Active
                </Badge>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                Your placement at <strong>{approvedOffer.company_name}</strong> for the role of <strong>{approvedOffer.job_role}</strong> (₹{approvedOffer.compensation_ctc} LPA) has been verified and registered by your college. You are eligible only for configured Dream or Super Dream upgrades.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Offer Verification Banner */}
      {pendingOffer && !approvedOffer && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-amber-900 dark:text-amber-200">
                Offer Declaration Under Review
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                Your submitted offer for <strong>{pendingOffer.company_name}</strong> (₹{pendingOffer.compensation_ctc} LPA) is currently pending verification by the college placement cell.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Offer Notice */}
      {rejectedOffer && !approvedOffer && !pendingOffer && (
        <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-900 dark:text-red-200">
                Offer Declaration Returned
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 mt-1">
                Your previous declaration for {rejectedOffer.company_name} was returned: {rejectedOffer.rejection_reason || 'Requires document or detail verification'}. You may submit a corrected declaration above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="rounded-md border bg-white dark:bg-zinc-950 shadow-sm w-full overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Placement Type</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!applications || applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                  You haven't applied to any jobs yet.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app: any) => {
                let statusConfig = statusMap[app.status] || { label: app.status, color: 'bg-zinc-100 text-zinc-800' }
                if (app.status === 'stage1') {
                  const label = app.jobs?.custom_stages?.stage_1 || app.jobs?.custom_stages?.stage_1_label || 'Round 1 (Stage 1)'
                  statusConfig = { label, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' }
                } else if (app.status === 'stage2') {
                  const label = app.jobs?.custom_stages?.stage_2 || app.jobs?.custom_stages?.stage_2_label || 'Round 2 (Stage 2)'
                  statusConfig = { label, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' }
                } else if (app.status === 'stage3') {
                  const label = app.jobs?.custom_stages?.stage_3 || app.jobs?.custom_stages?.stage_3_label || 'Round 3 (Stage 3)'
                  statusConfig = { label, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }
                }
                
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{app.jobs?.title || 'Unknown Job'}</span>
                        {app.jobs?.company_name && (
                          <span className="text-xs text-zinc-400">{app.jobs.company_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.jobs?.college_id ? 'College Exclusive' : 'Global Placement'}
                    </TableCell>
                    <TableCell suppressHydrationWarning>
                      {formatDate(app.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={`${statusConfig.color} border-transparent hover:${statusConfig.color} w-fit`}>
                          {statusConfig.label}
                        </Badge>
                        {app.status === 'cancelled' && (
                          <div className="text-[11px] text-zinc-500 space-y-0.5 max-w-[240px]">
                            {app.jobs?.cancellation_reason && (
                              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                Reason: <span className="font-normal text-zinc-600 dark:text-zinc-400">{app.jobs.cancellation_reason}</span>
                              </p>
                            )}
                            {app.jobs?.cancelled_at && (
                              <p className="text-[10px] text-zinc-400" suppressHydrationWarning>
                                Cancelled on: {formatDate(app.jobs.cancelled_at)}
                              </p>
                            )}
                          </div>
                        )}
                        {app.status === 'dropped' && (
                          <div className="text-[11px] text-zinc-500 space-y-0.5 max-w-[260px]">
                            <p className="font-medium text-zinc-700 dark:text-zinc-300">
                              Reason: <span className="font-normal text-zinc-600 dark:text-zinc-400">{formatStudentDropReason(app.dropped_reason)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {app.status === 'cancelled' ? (
                        <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                          Quota Refunded (0 Penalty)
                        </span>
                      ) : app.status === 'dropped' ? (
                        <span className="text-[11px] text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-850 px-2 py-1 rounded border">
                          Process Concluded
                        </span>
                      ) : (
                        <WithdrawButton applicationId={app.id} status={app.status} />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
