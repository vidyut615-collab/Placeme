import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { StudentProfileForm } from '@/components/StudentProfileForm'
import { DeclareHiredModal } from '@/components/DeclareHiredModal'
import { DigiProfileModal } from '@/components/DigiProfileModal'
import {
  Lock,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react'

interface CollegeOnboardingFields {
  years: string[]
  types: string[]
  departments: string[]
}

interface CollegeData {
  name: string | null
  logo_url: string | null
  onboarding_fields: CollegeOnboardingFields | null
}

interface EducationRecord {
  level?: string
  institution?: string
  board?: string
  score?: string
  passing_year?: string
}

interface ExperienceRecord {
  company?: string
  role?: string
  start_date?: string
  end_date?: string
  tech?: string
  description?: string
}

interface ProjectRecord {
  title?: string
  tech?: string
  link?: string
  description?: string
}

interface CandidateProfileRecord {
  first_name?: string
  middle_name?: string
  last_name?: string
  full_name?: string
  phone?: string
  gpa?: string | number
  year?: string
  type?: string
  department?: string
  academic_10th?: string | number
  academic_12th?: string | number
  diploma_percentage?: string | number
  graduation_percentage?: string | number
  active_backlogs?: string | number
  historical_backlogs?: string | number
  academic_gap_years?: string | number
  profile_picture?: string
  education?: EducationRecord[]
  experience?: ExperienceRecord[]
  projects?: ProjectRecord[]
  activities?: Array<{ title?: string; description?: string }>
  recognitions?: Array<{ title?: string; description?: string }>
  skills?: {
    languages?: string
    frameworks?: string
    tools?: string
  }
  links?: {
    linkedin?: string
    github?: string
    portfolio?: string
  }
  [key: string]: unknown
}

interface PolicyCounters {
  no_show_count?: number
  withdrawal_count?: number
  disciplinary_strikes?: number
  integrity_strikes?: number
  non_participation?: number
  no_shows?: number
  disciplinary?: number
  [key: string]: unknown
}

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
      <div className="p-8 text-[#78716C] dark:text-[#8A847A] font-mono text-sm">
        Error loading candidate profile. Please contact your college placement office.
      </div>
    )
  }

  const profile = (student.profile_data as CandidateProfileRecord) || {}
  const college = student.colleges as unknown as CollegeData | null
  const onboardingFields: CollegeOnboardingFields = college?.onboarding_fields || {
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
      .select('id, company_name, job_role, compensation_ctc, status, offer_type, offer_letter_url, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false }),
  ])

  const auditEnabled = policyDoc?.config?.profile_audit_enabled !== false
  const pendingOffer = studentOffers?.find((o) => o.status === 'pending')
  const approvedOffer = studentOffers?.find((o) => o.status === 'approved')

  // Calculate profile completeness score
  const hasName = Boolean(profile.first_name && profile.last_name)
  const hasPortrait = Boolean(profile.profile_picture)
  const hasPhone = Boolean(profile.phone)
  const hasAcademics = Boolean(profile.gpa && profile.department && profile.year)
  const hasEducation = Array.isArray(profile.education) && profile.education.length > 0
  const hasExperienceOrProjects =
    (Array.isArray(profile.experience) && profile.experience.length > 0) ||
    (Array.isArray(profile.projects) && profile.projects.length > 0)
  const hasSkills = Boolean(
    profile.skills?.languages?.trim() ||
    profile.skills?.frameworks?.trim() ||
    profile.skills?.tools?.trim()
  )
  const hasLinks = Boolean(
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
  const counters = (student.policy_counters as PolicyCounters) || {}
  const totalStrikes =
    (Number(counters.no_show_count) || 0) +
    (Number(counters.withdrawal_count) || 0) +
    (Number(counters.disciplinary_strikes) || 0) +
    (Number(counters.integrity_strikes) || 0) +
    (Number(counters.non_participation) || 0) +
    (Number(counters.no_shows) || 0) +
    (Number(counters.disciplinary) || 0)

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">
      {/* ── 1. Page Header Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
              Candidate DigiProfile
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 font-medium">
              Verified Dossier
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              TPO Sovereign
            </span>
          </div>
          <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-1">
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

      {/* ── 2. Top Completeness & Readiness Radar ── */}
      <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-4 sm:p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                Dossier Completeness &amp; Shortlist Affinity
              </span>
              <span className="font-mono text-xs font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 px-2.5 py-0.5 rounded-full border border-[#0F766E]/20 dark:border-[#14B8A6]/25">
                {completenessScore}% Complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-full overflow-hidden">
              <div
                style={{ width: `${completenessScore}%` }}
                className={`h-full transition-all duration-500 rounded-full ${
                  completenessScore >= 80
                    ? 'bg-gradient-to-r from-[#0F766E] to-[#10B981]'
                    : completenessScore >= 50
                    ? 'bg-gradient-to-r from-teal-600 to-teal-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400'
                }`}
              />
            </div>

            <p className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
              {completenessScore >= 85
                ? 'Your dossier is fully optimized for automated recruiter shortlisting, AI resume tailoring, and campus drive eligibility.'
                : 'Complete all sections (portrait, education qualifications, and projects) to maximize company shortlisting affinity.'}
            </p>
          </div>

          {/* Quick checklist indicators */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono shrink-0">
            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                hasPortrait
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
              }`}
            >
              {hasPortrait ? <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> : <Circle className="w-3 h-3 stroke-[1.5]" />}
              <span>Portrait</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                hasAcademics
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
              }`}
            >
              {hasAcademics ? <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> : <Circle className="w-3 h-3 stroke-[1.5]" />}
              <span>Academics</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                hasEducation
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
              }`}
            >
              {hasEducation ? <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> : <Circle className="w-3 h-3 stroke-[1.5]" />}
              <span>Education</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                hasExperienceOrProjects
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
              }`}
            >
              {hasExperienceOrProjects ? <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> : <Circle className="w-3 h-3 stroke-[1.5]" />}
              <span>Projects/Exp</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                hasSkills
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
              }`}
            >
              {hasSkills ? <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> : <Circle className="w-3 h-3 stroke-[1.5]" />}
              <span>Skills</span>
            </span>

            <span
              className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                hasLinks
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-[#FAF8F5] dark:bg-[#12110F] text-[#78716C] dark:text-[#8A847A] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]'
              }`}
            >
              {hasLinks ? <CheckCircle2 className="w-3 h-3 stroke-[1.5]" /> : <Circle className="w-3 h-3 stroke-[1.5]" />}
              <span>Profiles</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Main Workspace: Candidate Passport Sidebar vs Tactile Studio ── */}
      <div className="flex flex-col xl:flex-row gap-6 min-w-0 w-full max-w-full">
        {/* Left Column: Candidate Passport Card */}
        <div className="w-full xl:w-80 shrink-0 space-y-4 min-w-0">
          {/* Identity Capsule */}
          <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-5 space-y-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-center gap-3.5">
              {profile.profile_picture ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] shrink-0 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
                  <Image
                    src={profile.profile_picture}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#10B981] text-white flex items-center justify-center text-lg font-medium font-mono shrink-0 shadow-[0_1px_2px_rgba(15,118,110,0.2)]">
                  {(
                    profile.first_name?.[0] ||
                    profile.full_name?.[0] ||
                    user.email?.[0] ||
                    'C'
                  ).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                  {profile.first_name
                    ? `${profile.first_name} ${profile.last_name || ''}`
                    : profile.full_name || 'Candidate Dossier'}
                </h3>
                <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3 stroke-[1.5]" />
                  <span>ID Verified</span>
                </div>
              </div>
            </div>

            {/* Academic Credentials List */}
            <div className="space-y-2 pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-[#1C1917]/[0.04] dark:border-[#EFECE6]/[0.04]">
                <span className="text-[#78716C] dark:text-[#8A847A]">Institution</span>
                <span className="text-[#1C1917] dark:text-[#EFECE6] truncate max-w-[150px] text-right font-medium">
                  {college?.name || 'Assigned Campus'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1C1917]/[0.04] dark:border-[#EFECE6]/[0.04]">
                <span className="text-[#78716C] dark:text-[#8A847A]">Degree</span>
                <span className="text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {profile.type || 'B.Tech / B.E'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1C1917]/[0.04] dark:border-[#EFECE6]/[0.04]">
                <span className="text-[#78716C] dark:text-[#8A847A]">Grad Year</span>
                <span className="text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {profile.year || '2026'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1C1917]/[0.04] dark:border-[#EFECE6]/[0.04]">
                <span className="text-[#78716C] dark:text-[#8A847A]">Department</span>
                <span className="text-[#1C1917] dark:text-[#EFECE6] font-medium truncate max-w-[150px]">
                  {profile.department || 'Engineering'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1C1917]/[0.04] dark:border-[#EFECE6]/[0.04]">
                <span className="text-[#78716C] dark:text-[#8A847A]">Academic CGPA</span>
                <span className="text-[#0F766E] dark:text-[#14B8A6] font-medium">
                  {profile.gpa || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#78716C] dark:text-[#8A847A]">Backlogs Status</span>
                <span className="text-[#1C1917] dark:text-[#EFECE6] font-medium">
                  {profile.active_backlogs ?? 0} Active
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Standing & Governance Card */}
          <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] p-4 space-y-2.5 text-xs shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-[#1C1917] dark:text-[#EFECE6]">
                <ShieldCheck className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
                <span>Governance Audit</span>
              </div>
              {student.is_blacklisted ? (
                <span className="font-mono text-[10px] font-medium text-rose-700 dark:text-rose-400 bg-rose-500/[0.08] dark:bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/20">
                  Debarred
                </span>
              ) : totalStrikes > 0 ? (
                <span className="font-mono text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/[0.08] dark:bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/20">
                  {totalStrikes} Strike(s) Active
                </span>
              ) : (
                <span className="font-mono text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/[0.08] dark:bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20">
                  Clean Standing
                </span>
              )}
            </div>

            <p className="text-[#78716C] dark:text-[#8A847A] text-[11px] leading-relaxed">
              {pendingRequest ? (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
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
            className="flex items-center justify-between p-3.5 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#141312] transition-colors shadow-[0_1px_2px_rgba(28,25,23,0.04)] group text-xs"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[#78716C] group-hover:text-[#0F766E] dark:group-hover:text-[#14B8A6] stroke-[1.5] transition-colors" />
              <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                20 Placement Policies
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#0F766E] dark:group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Right Column: Profile Edit Studio Form */}
        <div className="flex-1 min-w-0 max-w-full overflow-hidden rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-5 md:p-6 relative shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          {accessStatus === 'unpaid' && (
            <div className="absolute inset-0 z-20 bg-white/90 dark:bg-[#12110F]/85 backdrop-blur-sm flex items-center justify-center rounded-xl p-6">
              <div className="text-center p-6 bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl shadow-xl max-w-sm space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-center mx-auto text-[#78716C] dark:text-[#8A847A]">
                  <Lock className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Dossier Locked
                  </h3>
                  <p className="text-xs text-[#78716C] dark:text-[#8A847A] mt-1 leading-relaxed">
                    Your placement profile is currently locked. Activate your institutional access in Billing to build your DigiProfile and unlock placement drives.
                  </p>
                </div>
                <Link
                  href="/student/billing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#0F766E] hover:bg-[#0D655E] text-white dark:bg-[#14B8A6] dark:hover:bg-[#0F766E] dark:text-[#12110F] transition-colors shadow-[0_1px_2px_rgba(15,118,110,0.2)]"
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
            hasPendingRequest={Boolean(pendingRequest)}
            auditEnabled={auditEnabled}
            accessStatus={accessStatus}
            collegeName={college?.name || ''}
          />
        </div>
      </div>
    </div>
  )
}
