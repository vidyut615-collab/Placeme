import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle, Award, Clock } from 'lucide-react'
import {
  ApplicationItem,
  StudentApplicationsDirectory,
} from '@/components/StudentApplicationsDirectory'
import { DeclareHiredModal } from '@/components/DeclareHiredModal'

interface RawApplicationRow {
  id: string
  job_id: string
  status: string
  dropped_reason: string | null
  created_at: string
  jobs: ApplicationItem['jobs'] | Array<NonNullable<ApplicationItem['jobs']>> | null
}

export default async function StudentApplicationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    return (
      <div className="min-h-full w-full bg-[#FAF8F5] dark:bg-[#12110F] p-8">
        <div className="max-w-7xl mx-auto rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-6 text-[14px] text-[#57534E] dark:text-[#ACA59A]">
          Unable to load your student profile. Please contact your campus placement office.
        </div>
      </div>
    )
  }

  // Fetch applications with joined job details
  const { data: rawApplications } = await supabase
    .from('applications')
    .select(
      `
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
    `
    )
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const applications: ApplicationItem[] = ((rawApplications as RawApplicationRow[] | null) || []).map(
    (row) => ({
      id: row.id,
      job_id: row.job_id,
      status: row.status,
      dropped_reason: row.dropped_reason,
      created_at: row.created_at,
      jobs: Array.isArray(row.jobs) ? row.jobs[0] ?? null : row.jobs ?? null,
    })
  )

  // Fetch student declared placement offers
  const { data: offers } = await supabase
    .from('student_offers')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const approvedOffer = offers?.find((o) => o.status === 'approved')
  const pendingOffer = offers?.find((o) => o.status === 'pending')
  const rejectedOffer = offers?.find((o) => o.status === 'rejected')

  return (
    <div className="min-h-full w-full min-w-0 bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6]">
      <div className="max-w-7xl mx-auto w-full min-w-0 px-6 py-7 md:px-8 md:py-8 space-y-6">
        {/* ── 1. Page Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-medium tracking-[-0.02em] leading-[1.15] text-[#1C1917] dark:text-[#EFECE6]">
                My Applications
              </h1>
              <span className="font-mono text-[12px] tabular-nums px-2.5 py-0.5 rounded-md bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                {applications.length} total
              </span>
            </div>
            <p className="text-[14px] text-[#57534E] dark:text-[#ACA59A] mt-1">
              Track interview rounds, shortlist updates, and offer status across your submitted drives
            </p>
          </div>

          <div className="shrink-0">
            <DeclareHiredModal
              appliedJobs={applications}
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
        </header>

        {/* ── 2. Offer Status Banner ── */}
        {approvedOffer && (
          <section className="rounded-[14px] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-gradient-to-br from-[#0F766E]/[0.07] via-[#10B981]/[0.03] to-white dark:from-[#0F766E]/[0.18] dark:via-[#10B981]/[0.06] dark:to-[#191816] px-5 py-4 flex items-start sm:items-center gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="w-10 h-10 rounded-[10px] bg-[#ECFDF8] dark:bg-[#0F766E]/25 border border-[#0F766E]/20 dark:border-[#14B8A6]/30 text-[#115E59] dark:text-[#5EEAD4] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Placement confirmed · {approvedOffer.company_name}
                </span>
                {approvedOffer.compensation_ctc ? (
                  <span className="font-mono text-[12px] font-medium tabular-nums px-2 py-0.5 rounded-md bg-[#ECFEFF] dark:bg-[#0F766E]/30 text-[#0F766E] dark:text-[#5EEAD4] border border-[#0F766E]/20 dark:border-[#14B8A6]/30">
                    ₹{Number(approvedOffer.compensation_ctc).toFixed(1)} LPA
                  </span>
                ) : null}
              </div>
              <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                Confirmed for {approvedOffer.job_role} — your 1-offer upgrade multiplier rules now apply to new drives
              </p>
            </div>
          </section>
        )}

        {pendingOffer && !approvedOffer && (
          <section className="rounded-[14px] border border-[#B45309]/25 dark:border-[#F59E0B]/25 bg-gradient-to-br from-[#D97706]/[0.07] via-[#F59E0B]/[0.02] to-white dark:from-[#D97706]/[0.16] dark:via-transparent dark:to-[#191816] px-5 py-4 flex items-start sm:items-center gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="w-10 h-10 rounded-[10px] bg-[#FEF3C7] dark:bg-[#B45309]/25 border border-[#B45309]/20 text-[#B45309] dark:text-[#FCD34D] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Offer verification in progress · {pendingOffer.company_name}
                </span>
                {pendingOffer.compensation_ctc ? (
                  <span className="font-mono text-[12px] font-medium tabular-nums px-2 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#B45309]/30 text-[#B45309] dark:text-[#FCD34D] border border-[#B45309]/20">
                    ₹{Number(pendingOffer.compensation_ctc).toFixed(1)} LPA
                  </span>
                ) : null}
              </div>
              <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                Your submitted declaration is under review by the college placement committee
              </p>
            </div>
          </section>
        )}

        {rejectedOffer && !approvedOffer && !pendingOffer && (
          <section className="rounded-[14px] border border-[#DC2626]/25 bg-gradient-to-br from-[#DC2626]/[0.06] via-transparent to-white dark:from-[#DC2626]/[0.14] dark:to-[#191816] px-5 py-4 flex items-start gap-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="w-10 h-10 rounded-[10px] bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border border-[#DC2626]/20 text-[#DC2626] dark:text-[#F87171] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <div className="text-[15px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                Offer declaration returned · {rejectedOffer.company_name}
              </div>
              <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
                {rejectedOffer.rejection_reason || 'Requires document or verification update'} — submit an updated declaration when ready
              </p>
            </div>
          </section>
        )}

        {/* ── 3. Interactive Applications List & Slide-Over Inspector ── */}
        <StudentApplicationsDirectory initialApplications={applications} />
      </div>
    </div>
  )
}
