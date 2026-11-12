import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Coins,
  FileText,
  Layers,
  ShieldAlert,
  Target,
} from 'lucide-react'
import { CreateResumeModal, CampusJobOption } from './CreateResumeModal'
import { ResumeCatalogClient, ResumeCatalogItem } from './ResumeCatalogClient'
import { evaluateResumeQuality } from '@/app/builder/[id]/ats-checker/engine'
import {
  ProfileData,
  ResumeDataState,
  ResumeSettings,
} from '@/app/builder/[id]/templates/types'

const DEFAULT_SETTINGS: ResumeSettings = {
  template: 'classic',
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  lineHeight: 1.4,
  margin: 14,
  accentColor: '#0F766E',
  pageFit: 'auto',
}

interface RawResumeRow {
  id: string
  title: string | null
  target_employer: string | null
  target_role: string | null
  job_description: string | null
  shortened_jd: string | null
  created_at: string
  content: unknown
}

function buildNormalizedState(parsedContent: Record<string, unknown>, profileData: ProfileData): ResumeDataState {
  const existingWork = Array.isArray(parsedContent.work_histories)
    ? parsedContent.work_histories
    : []
  const profileExperience = profileData.experience || []
  const sourceWork = existingWork.length > 0 ? existingWork : profileExperience

  const work_histories = sourceWork.map((_: unknown, i: number) => {
    const match = (existingWork[i] as Record<string, unknown>) || {}
    const exp = profileExperience[i] || {}
    return {
      profile_work_id: String(match.profile_work_id || `work_${i}`),
      role: String(match.role !== undefined && match.role !== '' ? match.role : exp.role || ''),
      company: String(
        match.company !== undefined && match.company !== '' ? match.company : exp.company || ''
      ),
      start_date: String(
        match.start_date !== undefined && match.start_date !== ''
          ? match.start_date
          : exp.start_date || ''
      ),
      end_date: String(
        match.end_date !== undefined && match.end_date !== ''
          ? match.end_date
          : exp.end_date || ''
      ),
      tech: String(match.tech !== undefined ? match.tech : exp.tech || ''),
      original_description: String(match.original_description || exp.description || ''),
      is_tailored: Boolean(match.is_tailored),
      is_saved: Boolean(match.is_saved),
      ai_options: Array.isArray(match.ai_options) ? (match.ai_options as string[]) : [],
      final_edited_text: String(
        match.final_edited_text !== undefined ? match.final_edited_text : exp.description || ''
      ),
    }
  })

  const existingProjects = Array.isArray(parsedContent.projects) ? parsedContent.projects : []
  const profileProjects = profileData.projects || []
  const sourceProjects = existingProjects.length > 0 ? existingProjects : profileProjects

  const projects = sourceProjects.map((_: unknown, i: number) => {
    const match = (existingProjects[i] as Record<string, unknown>) || {}
    const proj = profileProjects[i] || {}
    return {
      profile_project_id: String(match.profile_project_id || `proj_${i}`),
      title: String(match.title !== undefined && match.title !== '' ? match.title : proj.title || ''),
      tech: String(match.tech !== undefined ? match.tech : proj.tech || ''),
      original_description: String(match.original_description || proj.description || ''),
      is_tailored: Boolean(match.is_tailored),
      is_saved: Boolean(match.is_saved),
      ai_options: Array.isArray(match.ai_options) ? (match.ai_options as string[]) : [],
      final_edited_text: String(
        match.final_edited_text !== undefined ? match.final_edited_text : proj.description || ''
      ),
    }
  })

  const rawObjective = (parsedContent.career_objective as Record<string, unknown>) || {}
  const rawSettings = (parsedContent.settings as Partial<ResumeSettings>) || {}

  return {
    settings: { ...DEFAULT_SETTINGS, ...rawSettings },
    work_histories,
    projects,
    career_objective: {
      is_generated: Boolean(rawObjective.is_generated),
      is_saved: Boolean(rawObjective.is_saved),
      ai_options: Array.isArray(rawObjective.ai_options)
        ? (rawObjective.ai_options as string[])
        : [],
      final_edited_text: String(rawObjective.final_edited_text || ''),
    },
    profile_overrides:
      (parsedContent.profile_overrides as ResumeDataState['profile_overrides']) || {},
  }
}

export default async function AIResumePage(props: {
  searchParams?: Promise<{ job?: string }>
}) {
  const searchParams = (await props.searchParams) || {}
  const initialJobId = searchParams.job || undefined

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  const { data: student } = await supabase
    .from('students')
    .select('college_id, credit_balance, access_end_date, profile_data')
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

  const [{ data: resumes }, { data: jobsData }] = await Promise.all([
    supabase
      .from('ai_resumes')
      .select('id, title, target_employer, target_role, job_description, shortened_jd, created_at, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('jobs')
      .select('id, title, company_name, description')
      .or(`college_id.eq.${student.college_id},college_id.is.null`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const activeJobs: CampusJobOption[] = (jobsData as CampusJobOption[] | null) || []
  const profileData = (student.profile_data as ProfileData) || {}

  const workCount = profileData.experience?.length || 0
  const projectCount = profileData.projects?.length || 0
  const actCount = profileData.activities?.length || 0
  const recCount = profileData.recognitions?.length || 0
  const hasProfileData = workCount > 0 || projectCount > 0 || actCount > 0 || recCount > 0

  const isActive = Boolean(
    student.access_end_date && new Date(student.access_end_date) >= new Date()
  )

  const catalogItems: ResumeCatalogItem[] = ((resumes as RawResumeRow[] | null) || []).map(
    (resume) => {
      let parsedContent: Record<string, unknown> = {}
      try {
        parsedContent =
          typeof resume.content === 'string'
            ? (JSON.parse(resume.content) as Record<string, unknown>)
            : ((resume.content as Record<string, unknown>) || {})
      } catch {
        parsedContent = {}
      }

      const state = buildNormalizedState(parsedContent, profileData)
      const atsCheck = evaluateResumeQuality(
        profileData,
        state,
        resume.shortened_jd || resume.job_description || ''
      )

      const storedAiScore = (parsedContent.ats_score as { match_score?: number } | undefined)
        ?.match_score
      const atsScore = typeof storedAiScore === 'number' ? storedAiScore : atsCheck.score

      const totalWork = state.work_histories.length
      const totalProj = state.projects.length
      const savedWork = state.work_histories.filter((w) => w.is_saved).length
      const savedProj = state.projects.filter((p) => p.is_saved).length
      const objectiveSaved = state.career_objective.is_generated && state.career_objective.is_saved

      const totalSections = totalWork + totalProj + 1
      const savedSections = savedWork + savedProj + (objectiveSaved ? 1 : 0)
      const isComplete = savedSections === totalSections

      const tmplRaw = state.settings.template || 'classic'
      const templateName = tmplRaw.charAt(0).toUpperCase() + tmplRaw.slice(1)

      return {
        id: resume.id,
        title: resume.title || 'Untitled Resume',
        target_employer: resume.target_employer || 'Target Employer',
        target_role: resume.target_role || 'Target Role',
        created_at: resume.created_at,
        templateName,
        atsScore,
        isComplete,
        savedSections,
        totalSections,
      }
    }
  )

  const avgATSScore =
    catalogItems.length > 0
      ? Math.round(catalogItems.reduce((sum, item) => sum + item.atsScore, 0) / catalogItems.length)
      : null

  return (
    <div className="min-h-full w-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6]">
      <div className="max-w-7xl mx-auto w-full px-6 py-7 md:px-8 md:py-8 space-y-6">
        {/* ── 1. Page Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[28px] font-medium tracking-[-0.02em] leading-[1.15] text-[#1C1917] dark:text-[#EFECE6]">
                AI Resume Maker
              </h1>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 font-medium">
                Single-page ATS builder
              </span>
            </div>
            <p className="text-[14px] text-[#57534E] dark:text-[#ACA59A] mt-1">
              Tailor resume bullets against target job descriptions, run automated ATS checks, and export clean PDFs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Link
              href="/student/billing"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-white dark:bg-[#191816] hover:bg-[#F3EFE9] dark:hover:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[13px] transition-colors duration-150"
            >
              <Coins className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
              <span className="font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#EFECE6]">
                {student.credit_balance || 0} credits
              </span>
              <span className="text-[12px] text-[#0F766E] dark:text-[#14B8A6] font-medium">
                + Top up
              </span>
            </Link>

            <CreateResumeModal
              creditBalance={student.credit_balance || 0}
              isActive={isActive}
              hasProfileData={hasProfileData}
              activeJobs={activeJobs}
              initialJobId={initialJobId}
            />
          </div>
        </header>

        {/* ── 2. Inactive Subscription Banner ── */}
        {!isActive && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] dark:bg-amber-950/20 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="text-[13px] space-y-0.5">
                <p className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Placement access inactive
                </p>
                <p className="text-[#57534E] dark:text-[#ACA59A]">
                  Activate your subscription in Credit Balance to generate new tailored resumes. Existing resumes remain editable.
                </p>
              </div>
            </div>
            <Link
              href="/student/billing"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] transition-colors duration-150 shrink-0"
            >
              <span>Go to billing</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>
          </div>
        )}

        {/* ── 3. Three-Card KPI Horizon ── */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#57534E] dark:text-[#ACA59A] mb-3">
              <span className="text-[12px] font-medium">Tailored resumes</span>
              <FileText className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            </div>
            <div>
              <div className="text-[28px] font-mono tabular-nums font-medium tracking-[-0.02em] text-[#1C1917] dark:text-[#EFECE6]">
                {catalogItems.length}
              </div>
              <p className="text-[12px] text-[#78716C] dark:text-[#8A847A] mt-1">
                Role-specific versions in your workspace
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#57534E] dark:text-[#ACA59A] mb-3">
              <span className="text-[12px] font-medium">Average ATS readiness</span>
              <Target className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            </div>
            <div>
              <div className="text-[28px] font-mono tabular-nums font-medium tracking-[-0.02em] text-[#0F766E] dark:text-[#14B8A6]">
                {avgATSScore !== null ? `${avgATSScore}%` : '—'}
              </div>
              <p className="text-[12px] text-[#78716C] dark:text-[#8A847A] mt-1">
                {avgATSScore !== null
                  ? 'Average score across compiled resumes'
                  : 'Create a resume to measure ATS alignment'}
              </p>
            </div>
          </div>

          <Link
            href="/student/profile"
            className="group rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] hover:border-[#0F766E]/35 dark:hover:border-[#14B8A6]/35 p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col justify-between transition-colors duration-150"
          >
            <div className="flex items-center justify-between text-[#57534E] dark:text-[#ACA59A] mb-3">
              <span className="text-[12px] font-medium">DigiProfile source data</span>
              <Layers className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5]" />
            </div>
            <div>
              <div className="text-[22px] font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                {projectCount} projects · {workCount} roles
              </div>
              <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] group-hover:text-[#0F766E] dark:group-hover:text-[#14B8A6] mt-1 inline-flex items-center gap-1 transition-colors duration-150">
                <span>Update DigiProfile source</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
              </p>
            </div>
          </Link>
        </section>

        {/* ── 4. Pre-Flight Profile Callout ── */}
        {projectCount === 0 && (
          <div className="rounded-xl border border-[#0F766E]/20 dark:border-[#14B8A6]/25 bg-[#0F766E]/[0.05] dark:bg-[#14B8A6]/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 dark:bg-[#14B8A6]/20 text-[#0F766E] dark:text-[#14B8A6] flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 stroke-[1.5]" />
              </div>
              <div className="text-[13px] space-y-0.5">
                <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] block">
                  Add projects to improve bullet quality
                </span>
                <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                  Your DigiProfile currently has 0 projects recorded. Adding projects and metrics helps tailor stronger experience bullets.
                </p>
              </div>
            </div>

            <Link
              href="/student/profile"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-white dark:bg-[#191816] text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/25 dark:border-[#14B8A6]/30 hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] transition-colors duration-150 shrink-0"
            >
              <span>Add projects in DigiProfile</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>
          </div>
        )}

        {/* ── 5. Resumes Catalog / Empty State ── */}
        <ResumeCatalogClient
          resumes={catalogItems}
          creditBalance={student.credit_balance || 0}
          isActive={isActive}
          hasProfileData={hasProfileData}
          activeJobs={activeJobs}
          initialJobId={initialJobId}
        />
      </div>
    </div>
  )
}
