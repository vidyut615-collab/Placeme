import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { StudentProfileForm } from '@/components/StudentProfileForm'
import { DeclareHiredModal } from '@/components/DeclareHiredModal'
import { DigiProfileModal } from '@/components/DigiProfileModal'
import {
  Lock,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  GraduationCap,
  Building2,
  Award,
  Sparkles,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { TactileCard } from '@/components/ui/tactile'

export default async function StudentProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // 1. Fetch student profile, college, and institutional standing
  const { data: student } = await supabase
    .from('students')
    .select(`
      id,
      college_id,
      profile_data,
      access_end_date,
      is_blacklisted,
      policy_counters,
      colleges (
        name,
        logo_url,
        onboarding_fields
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return (
      <div className="p-8 text-zinc-500 font-mono text-sm">
        Error loading candidate profile. Please contact your college placement office.
      </div>
    )
  }

  const profile = (student.profile_data as Record<string, any>) || {}
  const college = student.colleges as any
  const onboardingFields = college?.onboarding_fields || {
    years: [],
    types: [],
    departments: [],
  }

  let accessStatus: 'active' | 'expired' | 'unpaid' = 'active'
  if (!student.access_end_date) {
    accessStatus = 'unpaid'
  } else if (new Date(student.access_end_date) < new Date()) {
    accessStatus = 'expired'
  }

  // 2. Parallel fetch pending audit requests, policies, applications, and offers
  const [
    { data: pendingRequest },
    { data: policyDoc },
    { data: appliedJobs },
    { data: studentOffers },
  ] = await Promise.all([
    supabase
      .from('profile_update_requests')
      .select('id, created_at, status')
      .eq('student_id', student.id)
      .eq('status', 'pending')
      .maybeSingle(),
    supabase
      .from('placement_policies')
      .select('config')
      .eq('college_id', student.college_id)
      .maybeSingle(),
    supabase
      .from('applications')
      .select('id, job_id, jobs ( title, company_name, compensation_ctc )')
      .eq('student_id', student.id),
    supabase
      .from('student_offers')
      .select('id, company_name, job_role, compensation_ctc, status, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false }),
  ])

  const auditEnabled = policyDoc?.config?.profile_audit_enabled !== false
  const pendingOffer = studentOffers?.find((o) => o.status === 'pending')
  const approvedOffer = studentOffers?.find((o) => o.status === 'approved')

  // Calculate profile completeness score
  const hasName = !!(profile.first_name && profile.last_name)
  const hasPortrait = !!profile.profile_picture
  const hasPhone = !!profile.phone
  const hasAcademics = !!(profile.gpa && profile.department && profile.year)
  const hasEducation = Array.isArray(profile.education) && profile.education.length > 0
  const hasExperienceOrProjects =
    (Array.isArray(profile.experience) && profile.experience.length > 0) ||
    (Array.isArray(profile.projects) && profile.projects.length > 0)
  const hasSkills = !!(
    profile.skills?.languages?.trim() ||
    profile.skills?.frameworks?.trim() ||
    profile.skills?.tools?.trim()
  )
  const hasLinks = !!(
    profile.links?.linkedin?.trim() ||
    profile.links?.github?.trim() ||
    profile.links?.portfolio?.trim()
  )

  let completenessScore = 0
  if (hasName) completenessScore += 15
  if (hasPortrait) completenessScore += 15
  if (hasPhone) completenessScore += 10
  if (hasAcademics) completenessScore += 15
  if (hasEducation) completenessScore += 15
  if (hasExperienceOrProjects) completenessScore += 15
  if (hasSkills) completenessScore += 10
  if (hasLinks) completenessScore += 5
  completenessScore = Math.min(completenessScore, 100)

  // Policy strikes breakdown
  const counters = (student.policy_counters as Record<string, any>) || {}
  const totalStrikes =
    (counters.no_show_count || 0) +
    (counters.withdrawal_count || 0) +
    (counters.disciplinary_strikes || 0) +
    (counters.integrity_strikes || 0)

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* ── 1. Page Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Candidate DigiProfile
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-semibold">
              Verified Dossier
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              TPO Sovereign
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain your verified academic record, engineering portfolio, and official placement declarations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {accessStatus !== 'unpaid' && (
            <DigiProfileModal
              profile={profile}
              email={user.email || ''}
              collegeName={college?.name || ''}
              collegeLogoUrl={college?.logo_url || ''}
            />
          )}

          <DeclareHiredModal
            appliedJobs={appliedJobs || []}
            hasPendingOffer={!!pendingOffer}
            pendingOfferDetails={
              pendingOffer
                ? {
                    company_name: pendingOffer.company_name,
                    job_role: pendingOffer.job_role,
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
            triggerButton={
              <button className="inline-flex items-center gap-2 h-8.5 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer select-none">
                <Award className="w-3.5 h-3.5 stroke-[1.5] text-emerald-400 dark:text-emerald-600" />
                <span>{pendingOffer ? 'Verification Pending' : 'Declare Placement'}</span>
              </button>
            }
          />
        </div>
      </div>

      {/* ── 2. Top Completeness & Readiness Radar ── */}
      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Dossier Completeness & Shortlist Affinity
              </span>
              <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/50">
                {completenessScore}% Complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${completenessScore}%` }}
                className={`h-full transition-all duration-500 rounded-full ${
                  completenessScore >= 80
                    ? 'bg-emerald-500'
                    : completenessScore >= 50
                    ? 'bg-purple-600'
                    : 'bg-amber-500'
                }`}
              />
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {completenessScore >= 85
                ? 'Your dossier is fully optimized for automated recruiter shortlisting, AI resume tailoring, and campus drive eligibility.'
                : 'Complete all sections (portrait, education qualifications, and projects) to maximize company shortlisting affinity.'}
            </p>
          </div>

          {/* Quick checklist indicators */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono shrink-0">
            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1 ${
                hasPortrait
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <span>{hasPortrait ? '✓' : '○'}</span>
              <span>Portrait</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1 ${
                hasAcademics
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <span>{hasAcademics ? '✓' : '○'}</span>
              <span>Academics</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1 ${
                hasEducation
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <span>{hasEducation ? '✓' : '○'}</span>
              <span>Education</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1 ${
                hasExperienceOrProjects
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <span>{hasExperienceOrProjects ? '✓' : '○'}</span>
              <span>Projects/Exp</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1 ${
                hasSkills
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-500 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <span>{hasSkills ? '✓' : '○'}</span>
              <span>Skills</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Main Workspace: Candidate Passport Sidebar vs Tactile Studio ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column (w-full lg:w-80): Candidate Passport Card */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          {/* Identity Capsule */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              {profile.profile_picture ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-2xs">
                  <Image
                    src={profile.profile_picture}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xl font-bold font-mono shrink-0 shadow-2xs">
                  {(
                    profile.first_name?.[0] ||
                    profile.full_name?.[0] ||
                    user.email?.[0] ||
                    'C'
                  ).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {profile.first_name
                    ? `${profile.first_name} ${profile.last_name || ''}`
                    : profile.full_name || 'Candidate Dossier'}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3 stroke-[1.5]" />
                  <span>ID Verified</span>
                </div>
              </div>
            </div>

            {/* Academic Credentials List */}
            <div className="space-y-2 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">Institution</span>
                <span className="text-zinc-900 dark:text-zinc-200 truncate max-w-[150px] text-right font-semibold">
                  {college?.name || 'Assigned Campus'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">Degree</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-semibold">
                  {profile.type || 'B.Tech / B.E'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">Grad Year</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-semibold">
                  {profile.year || '2026'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">Department</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-semibold truncate max-w-[150px]">
                  {profile.department || 'Engineering'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">Academic CGPA</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {profile.gpa || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Backlogs Status</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-semibold">
                  {profile.active_backlogs ?? 0} Active
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Standing & Governance Card */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/30 p-4 space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
                <span>Governance Audit</span>
              </div>
              {student.is_blacklisted ? (
                <span className="font-mono text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                  Debarred
                </span>
              ) : totalStrikes > 0 ? (
                <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  {totalStrikes} Strike(s)
                </span>
              ) : (
                <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Clean Standing
                </span>
              )}
            </div>

            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
              {pendingRequest ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  A profile audit request is currently queued for placement cell review.
                </span>
              ) : auditEnabled ? (
                'Academic field updates (CGPA, backlogs, department) route to your college TPO for cryptographic sign-off.'
              ) : (
                'Direct database synchronization active. Profile changes reflect immediately across company shortlists.'
              )}
            </p>
          </div>

          {/* Quick Action Link: Placement Rules */}
          <Link
            href="/student/policies"
            className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors shadow-2xs group text-xs"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-zinc-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 stroke-[1.5] transition-colors" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                20 Placement Policies
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Right Column: Profile Edit Studio Form */}
        <div className="flex-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/30 p-5 md:p-6 relative shadow-2xs">
          {accessStatus === 'unpaid' && (
            <div className="absolute inset-0 z-20 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center rounded-xl p-6">
              <div className="text-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-w-sm space-y-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto text-zinc-600 dark:text-zinc-400">
                  <Lock className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Dossier Locked
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    Your placement profile is currently locked. Activate your institutional access in Billing to build your DigiProfile and unlock placement drives.
                  </p>
                </div>
                <Link
                  href="/student/billing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
                >
                  <span>Go to Billing Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          <StudentProfileForm
            profile={profile}
            onboardingFields={onboardingFields}
            hasPendingRequest={!!pendingRequest}
            auditEnabled={auditEnabled}
            accessStatus={accessStatus}
            collegeName={college?.name || ''}
          />
        </div>
      </div>
    </div>
  )
}
