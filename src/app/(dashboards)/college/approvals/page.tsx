import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ApprovalsList } from './ApprovalsList'
import { OfferApprovalsList } from '@/components/OfferApprovalsList'
import { ApprovalLogTable } from '@/components/ApprovalLogTable'
import { Award, UserCheck, History } from 'lucide-react'

export default async function ApprovalsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    redirect('/login')
  }

  const collegeId = user.app_metadata.college_id
  const resolvedParams = await searchParams
  const activeTab = typeof resolvedParams.tab === 'string' ? resolvedParams.tab : 'offers'

  // Fetch pending offer declarations and pending profile update requests in parallel
  const [
    { data: pendingOffers },
    { data: pendingProfileRequests },
    { data: policyRow },
    { data: logs }
  ] = await Promise.all([
    supabase
      .from('student_offers')
      .select(`
        id,
        company_name,
        job_role,
        compensation_ctc,
        offer_type,
        offer_letter_url,
        status,
        student_confirmed_at,
        job_id,
        jobs (
          id,
          title,
          company_name,
          compensation_ctc,
          workplace_mode,
          job_location,
          employment_type
        ),
        students (
          id,
          profile_data,
          users ( email )
        )
      `)
      .eq('college_id', collegeId)
      .eq('status', 'pending')
      .order('student_confirmed_at', { ascending: false }),

    supabase
      .from('profile_update_requests')
      .select(`
        id,
        proposed_profile_data,
        created_at,
        status,
        students (
          id,
          profile_data,
          users ( email )
        )
      `)
      .eq('college_id', collegeId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),

    collegeId
      ? supabase.from('placement_policies').select('config').eq('college_id', collegeId).maybeSingle()
      : Promise.resolve({ data: null }),

    supabase
      .from('approval_logs')
      .select(`
        id,
        entity_type,
        entity_id,
        student_id,
        action_by,
        status,
        reason,
        snapshot_data,
        created_at,
        students ( profile_data, users ( email ) ),
        admin:users!approval_logs_action_by_fkey ( email )
      `)
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(100)
  ])

  const dreamMin = policyRow?.config?.dream?.min_ctc || 8
  const superDreamMin = policyRow?.config?.super_dream?.min_ctc || 15

  const offersCount = pendingOffers?.length || 0
  const profileCount = pendingProfileRequests?.length || 0
  const logsCount = logs?.length || 0

  return (
    <div className="flex flex-1 flex-col p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals & Verification Queue</h1>
        <p className="text-zinc-500 mt-2">
          Verify student placement offers and review student academic profile updates.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-4" aria-label="Approvals Tabs">
          <Link
            href="/college/approvals?tab=offers"
            className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'offers'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Placement Offers</span>
            {offersCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 text-xs font-bold">
                {offersCount}
              </span>
            )}
          </Link>

          <Link
            href="/college/approvals?tab=profiles"
            className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'profiles'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Profile Auditing</span>
            {profileCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 text-xs font-bold">
                {profileCount}
              </span>
            )}
          </Link>

          <Link
            href="/college/approvals?tab=logs"
            className={`py-3 px-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Approval Log</span>
            {logsCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 text-xs font-bold">
                {logsCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'offers' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Student Placement Declarations ({offersCount})
                </h2>
                <p className="text-xs text-zinc-500">
                  Review student-uploaded offer letters. Approving an offer officially marks the candidate as Placed and locks general drives.
                </p>
              </div>
            </div>

            <OfferApprovalsList
              offers={(pendingOffers as any[]) || []}
              dreamThreshold={dreamMin}
              superDreamThreshold={superDreamMin}
            />
          </div>
        ) : activeTab === 'profiles' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Pending Profile & Resume Updates ({profileCount})
              </h2>
              <p className="text-xs text-zinc-500">
                Review and approve student requests to update their CGPA, skills, or resume fields.
              </p>
            </div>

            <ApprovalsList requests={(pendingProfileRequests as any[]) || []} />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Approval Logs
              </h2>
              <p className="text-xs text-zinc-500">
                A complete history of all approval actions performed by college coordinators.
              </p>
            </div>

            <ApprovalLogTable logs={logs || []} />
          </div>
        )}
      </div>
    </div>
  )
}
