/**
 * Placement Policy Engine
 * Evaluates all 20 Truskill policies against a student + job context.
 * 
 * Core principle: "Placeme defines the configurable building blocks;
 * the college defines the placement policy."
 */

import { SupabaseClient } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────

export type PolicyConfig = {
  registration?: RegistrationPolicy
  eligibility?: EligibilityPolicy
  application_limit?: ApplicationLimitPolicy
  withdrawal?: WithdrawalPolicy
  no_show?: NoShowPolicy
  offer_limit?: OfferLimitPolicy
  upgrade?: UpgradePolicy
  job_types?: JobTypePolicy
  placement_levels?: PlacementLevelPolicy
  placement_categories?: PlacementCategoryPolicy
  level_movement?: LevelMovementPolicy
  attempt_limit?: AttemptLimitPolicy
  dream?: DreamPolicy
  super_dream?: SuperDreamPolicy
  special_exception?: SpecialExceptionPolicy
  offer_acceptance?: OfferAcceptancePolicy
  placement_completion?: PlacementCompletionPolicy
  training_readiness?: TrainingReadinessPolicy
  academic_clearance?: AcademicClearancePolicy
  override_management?: OverrideManagementPolicy
}

type RegistrationPolicy = {
  enabled: boolean
  requirement: 'mandatory' | 'optional'
  late_registration_allowed: boolean
  approval_required_for_late: boolean
  min_attendance_pct: number | null
  academic_clearance_required: boolean
  orientation_required: boolean
  training_completion_required: boolean
}

type EligibilityPolicy = {
  enabled: boolean
  min_gpa: number | null
  min_10th: number | null
  min_12th: number | null
  min_diploma: number | null
  min_graduation: number | null
  max_active_backlogs: number | null
  max_historical_backlogs: number | null
  max_gap_years: number | null
  allowed_years: string[]
  allowed_types: string[]
  allowed_departments: string[]
  required_skills: string[]
  required_certifications: string[]
}

type ApplicationLimitPolicy = {
  enabled: boolean
  max_total: number | null
  max_active: number | null
  max_per_cycle: number | null
  max_per_level: number | null
  max_per_category: number | null
  max_per_job_type: number | null
  max_per_day: number | null
  max_per_week: number | null
}

type WithdrawalPolicy = {
  enabled: boolean
  rules: Record<string, 'allowed' | 'not_allowed' | 'approval_required'>
  consequence: string
  reason_required: boolean
  document_required: boolean
}

type NoShowPolicy = {
  enabled: boolean
  max_no_shows: number
  first_consequence: string
  second_consequence: string
  third_consequence: string
  restriction_duration_days: number | null
  valid_reasons: string[]
  document_required_for_excuse: boolean
}

type OfferLimitPolicy = {
  enabled: boolean
  max_offers_total: number | null
  max_active_offers: number | null
  max_accepted_offers: number | null
  max_offers_per_level: number | null
  max_offers_per_category: number | null
  debar_on_hired: boolean
  offer_coexistence: string
  participation_ends_on: string
}

type UpgradePolicy = {
  enabled: boolean
  comparison_field: string
  comparison_operator: string
  min_increment_pct: number | null
  min_increment_amount: number | null
  must_be_higher_level: boolean
  must_be_higher_category: boolean
  max_upgrade_attempts: number | null
  rejection_consumes_attempt: boolean
  new_offer_replaces_old: boolean
  can_return_to_previous: boolean
}

type JobTypePolicy = {
  enabled: boolean
  cross_type_application_allowed: boolean
  cross_type_movement_requires_approval: boolean
}

type PlacementLevelPolicy = {
  enabled: boolean
}

type PlacementCategoryPolicy = {
  enabled: boolean
}

type LevelMovementPolicy = {
  enabled: boolean
  movement_rules: Array<{
    from_level: string
    to_level: string
    rule: 'allowed' | 'not_allowed' | 'approval_required'
  }>
  requires_higher_package: boolean
  requires_approval: boolean
}

type AttemptLimitPolicy = {
  enabled: boolean
  max_first_offer_attempts: number | null
  max_additional_offer_attempts: number | null
  what_counts_as_attempt: string
  rejection_consumes_attempt: boolean
  no_show_consumes_attempt: boolean
  withdrawal_consumes_attempt: boolean
}

type DreamPolicy = {
  enabled: boolean
  classification_method: 'manual' | 'ctc_based' | 'level_based'
  min_ctc: number | null
  additional_conditions: string[]
  max_dream_attempts: number | null
  max_dream_offers: number | null
  replaces_previous_offer: boolean
  ends_placement: boolean
}

type SuperDreamPolicy = {
  enabled: boolean
  classification_method: 'manual' | 'ctc_based' | 'level_based'
  min_ctc: number | null
  additional_conditions: string[]
  max_attempts: number | null
  max_offers: number | null
  replaces_previous_offer: boolean
  ends_placement: boolean
}

type SpecialExceptionPolicy = {
  enabled: boolean
  exceptions: Array<{
    name: string
    condition: string
    action: string
  }>
}

type OfferAcceptancePolicy = {
  enabled: boolean
  acceptance_window_hours: number | null
  acceptance_window_days: number | null
  expired_offer_action: string
  declined_offer_action: string
}

type PlacementCompletionPolicy = {
  enabled: boolean
  completion_trigger: string
  on_offer_withdrawn: string
  on_offer_rescinded: string
  on_not_joined: string
  counts_for_statistics: string
}

type TrainingReadinessPolicy = {
  enabled: boolean
  all_modules_required: boolean
  min_score: number | null
  override_allowed: boolean
}

type AcademicClearancePolicy = {
  enabled: boolean
  clearance_required_before: string
  backlog_clearance_deadline: string | null
}

type OverrideManagementPolicy = {
  enabled: boolean
  dual_approval_required: boolean
  reason_mandatory: boolean
  document_required: boolean
}

// ─── Evaluation Result ───────────────────────────────────────

export type PolicyResult = {
  allowed: boolean
  violations: string[]
}

// ─── Student Context (gathered before evaluation) ────────────

type StudentContext = {
  id: string
  college_id: string
  profile_data: Record<string, any>
  total_applications: number
  active_applications: number
  applications_today: number
  applications_this_week: number
  applications_in_cycle: number
  applications_per_level: Record<string, number>
  applications_per_category: Record<string, number>
  applications_per_job_type: Record<string, number>
  total_offers: number
  active_offers: number
  accepted_offers: number
  has_hired_status: boolean
  no_show_count: number
  total_attempts: number
  existing_offer_ctc: number | null
  existing_offer_level_rank: number | null
  is_registered_for_cycle: boolean
  training_completed: boolean
  training_score: number | null
  has_active_override: boolean
  override_policies: string[]
}

// ─── Job Context ─────────────────────────────────────────────

type JobContext = {
  id: string
  college_id: string | null
  compensation_ctc: number | null
  compensation_fixed: number | null
  job_type_id: string | null
  placement_level_id: string | null
  placement_category_id: string | null
  cycle_id: string | null
  level_rank: number | null
  level_is_dream: boolean
  level_is_super_dream: boolean
}

// ─── Default Policy Config ──────────────────────────────────

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  registration: {
    enabled: false,
    requirement: 'optional',
    late_registration_allowed: true,
    approval_required_for_late: false,
    min_attendance_pct: null,
    academic_clearance_required: false,
    orientation_required: false,
    training_completion_required: false,
  },
  eligibility: {
    enabled: false,
    min_gpa: null,
    min_10th: null,
    min_12th: null,
    min_diploma: null,
    min_graduation: null,
    max_active_backlogs: null,
    max_historical_backlogs: null,
    max_gap_years: null,
    allowed_years: [],
    allowed_types: [],
    allowed_departments: [],
    required_skills: [],
    required_certifications: [],
  },
  application_limit: {
    enabled: false,
    max_total: null,
    max_active: null,
    max_per_cycle: null,
    max_per_level: null,
    max_per_category: null,
    max_per_job_type: null,
    max_per_day: null,
    max_per_week: null,
  },
  withdrawal: {
    enabled: false,
    rules: {
      after_applied: 'allowed',
      after_shortlisted: 'allowed',
      after_interviewing: 'approval_required',
      after_selected: 'not_allowed',
      after_offered: 'not_allowed',
      after_offer_accepted: 'not_allowed',
    },
    consequence: 'none',
    reason_required: true,
    document_required: false,
  },
  no_show: {
    enabled: false,
    max_no_shows: 3,
    first_consequence: 'warning',
    second_consequence: 'temporary_restriction',
    third_consequence: 'placement_suspension',
    restriction_duration_days: null,
    valid_reasons: ['medical', 'academic', 'emergency'],
    document_required_for_excuse: true,
  },
  offer_limit: {
    enabled: false,
    max_offers_total: null,
    max_active_offers: null,
    max_accepted_offers: null,
    max_offers_per_level: null,
    max_offers_per_category: null,
    debar_on_hired: false,
    offer_coexistence: 'student_chooses',
    participation_ends_on: 'offer_accepted',
  },
  upgrade: {
    enabled: false,
    comparison_field: 'compensation_ctc',
    comparison_operator: 'greater_than',
    min_increment_pct: null,
    min_increment_amount: null,
    must_be_higher_level: false,
    must_be_higher_category: false,
    max_upgrade_attempts: null,
    rejection_consumes_attempt: false,
    new_offer_replaces_old: true,
    can_return_to_previous: false,
  },
  job_types: {
    enabled: false,
    cross_type_application_allowed: true,
    cross_type_movement_requires_approval: false,
  },
  placement_levels: { enabled: false },
  placement_categories: { enabled: false },
  level_movement: {
    enabled: false,
    movement_rules: [],
    requires_higher_package: false,
    requires_approval: false,
  },
  attempt_limit: {
    enabled: false,
    max_first_offer_attempts: null,
    max_additional_offer_attempts: null,
    what_counts_as_attempt: 'application',
    rejection_consumes_attempt: true,
    no_show_consumes_attempt: true,
    withdrawal_consumes_attempt: false,
  },
  dream: {
    enabled: false,
    classification_method: 'manual',
    min_ctc: null,
    additional_conditions: [],
    max_dream_attempts: null,
    max_dream_offers: null,
    replaces_previous_offer: true,
    ends_placement: false,
  },
  super_dream: {
    enabled: false,
    classification_method: 'manual',
    min_ctc: null,
    additional_conditions: [],
    max_attempts: null,
    max_offers: null,
    replaces_previous_offer: true,
    ends_placement: true,
  },
  special_exception: {
    enabled: false,
    exceptions: [],
  },
  offer_acceptance: {
    enabled: false,
    acceptance_window_hours: null,
    acceptance_window_days: null,
    expired_offer_action: 'restore_eligibility',
    declined_offer_action: 'restore_with_restrictions',
  },
  placement_completion: {
    enabled: false,
    completion_trigger: 'offer_accepted',
    on_offer_withdrawn: 'reopen',
    on_offer_rescinded: 'reopen',
    on_not_joined: 'reopen',
    counts_for_statistics: 'offer_accepted',
  },
  training_readiness: {
    enabled: false,
    all_modules_required: false,
    min_score: null,
    override_allowed: true,
  },
  academic_clearance: {
    enabled: false,
    clearance_required_before: 'application',
    backlog_clearance_deadline: null,
  },
  override_management: {
    enabled: true,
    dual_approval_required: false,
    reason_mandatory: true,
    document_required: false,
  },
}

// ─── Context Gatherer ────────────────────────────────────────

export async function gatherStudentContext(
  supabase: SupabaseClient,
  studentId: string,
  collegeId: string,
  jobId: string
): Promise<StudentContext> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek = new Date(now.getTime() - now.getDay() * 86400000).toISOString()

  // Fetch student profile
  const { data: student } = await supabase
    .from('students')
    .select('profile_data')
    .eq('id', studentId)
    .single()

  // Fetch all applications for this student
  const { data: allApps } = await supabase
    .from('applications')
    .select('id, status, created_at, job_id, offer_amount, jobs(placement_level_id, placement_category_id, job_type_id, compensation_ctc)')
    .eq('student_id', studentId)

  const apps = allApps || []
  const terminalStatuses = ['withdrawn', 'rejected', 'offer_declined', 'not_joined']
  const offerStatuses = ['offered', 'offer_accepted', 'hired', 'joined']

  const activeApps = apps.filter(a => !terminalStatuses.includes(a.status) && a.status !== 'withdrawn')
  const offeredApps = apps.filter(a => offerStatuses.includes(a.status))
  const acceptedApps = apps.filter(a => ['offer_accepted', 'hired', 'joined'].includes(a.status))
  const hiredApps = apps.filter(a => ['hired', 'joined'].includes(a.status))
  const todayApps = apps.filter(a => a.created_at >= startOfDay)
  const weekApps = apps.filter(a => a.created_at >= startOfWeek)

  // Applications per level/category/type
  const perLevel: Record<string, number> = {}
  const perCategory: Record<string, number> = {}
  const perJobType: Record<string, number> = {}
  apps.forEach((a: any) => {
    const job = a.jobs
    if (job?.placement_level_id) perLevel[job.placement_level_id] = (perLevel[job.placement_level_id] || 0) + 1
    if (job?.placement_category_id) perCategory[job.placement_category_id] = (perCategory[job.placement_category_id] || 0) + 1
    if (job?.job_type_id) perJobType[job.job_type_id] = (perJobType[job.job_type_id] || 0) + 1
  })

  // Highest existing offer CTC
  const existingCTCs = offeredApps
    .map((a: any) => a.offer_amount || a.jobs?.compensation_ctc)
    .filter(Boolean)
  const existingOfferCtc = existingCTCs.length > 0 ? Math.max(...existingCTCs) : null

  // No-show count
  const { count: noShowCount } = await supabase
    .from('event_attendance')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'absent')

  // Registration check for active cycle
  const { data: activeCycle } = await supabase
    .from('placement_cycles')
    .select('id')
    .eq('college_id', collegeId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  let isRegistered = true
  let cycleAppCount = apps.length
  if (activeCycle) {
    const { data: reg } = await supabase
      .from('student_registrations')
      .select('status')
      .eq('student_id', studentId)
      .eq('cycle_id', activeCycle.id)
      .maybeSingle()
    isRegistered = !!reg && reg.status === 'registered'

    // Applications in this cycle
    const { data: cycleJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('cycle_id', activeCycle.id)
    const cycleJobIds = (cycleJobs || []).map((j: any) => j.id)
    cycleAppCount = apps.filter(a => cycleJobIds.includes(a.job_id)).length
  }

  // Training check
  const { data: mandatoryModules } = await supabase
    .from('training_modules')
    .select('id')
    .eq('college_id', collegeId)
    .eq('is_mandatory', true)

  let trainingCompleted = true
  let trainingScore: number | null = null
  if (mandatoryModules && mandatoryModules.length > 0) {
    const moduleIds = mandatoryModules.map(m => m.id)
    const { data: progress } = await supabase
      .from('student_training_progress')
      .select('module_id, status, score')
      .eq('student_id', studentId)
      .in('module_id', moduleIds)

    const completedModules = (progress || []).filter(p => p.status === 'completed')
    trainingCompleted = completedModules.length >= moduleIds.length
    if (completedModules.length > 0) {
      const scores = completedModules.map(p => p.score).filter(Boolean) as number[]
      trainingScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    }
  }

  // Override check
  const { data: overrides } = await supabase
    .from('policy_overrides')
    .select('policy_type')
    .eq('college_id', collegeId)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .or(`effective_until.is.null,effective_until.gte.${now.toISOString()}`)

  const overridePolicies = (overrides || []).map(o => o.policy_type)

  // Get existing offer level rank
  let existingLevelRank: number | null = null
  if (offeredApps.length > 0) {
    const levelIds = offeredApps
      .map((a: any) => a.jobs?.placement_level_id)
      .filter(Boolean)
    if (levelIds.length > 0) {
      const { data: levels } = await supabase
        .from('placement_levels')
        .select('rank')
        .in('id', levelIds)
      if (levels && levels.length > 0) {
        existingLevelRank = Math.max(...levels.map(l => l.rank))
      }
    }
  }

  return {
    id: studentId,
    college_id: collegeId,
    profile_data: student?.profile_data || {},
    total_applications: apps.length,
    active_applications: activeApps.length,
    applications_today: todayApps.length,
    applications_this_week: weekApps.length,
    applications_in_cycle: cycleAppCount,
    applications_per_level: perLevel,
    applications_per_category: perCategory,
    applications_per_job_type: perJobType,
    total_offers: offeredApps.length,
    active_offers: offeredApps.filter(a => a.status === 'offered').length,
    accepted_offers: acceptedApps.length,
    has_hired_status: hiredApps.length > 0,
    no_show_count: noShowCount || 0,
    total_attempts: apps.length,
    existing_offer_ctc: existingOfferCtc,
    existing_offer_level_rank: existingLevelRank,
    is_registered_for_cycle: isRegistered,
    training_completed: trainingCompleted,
    training_score: trainingScore,
    has_active_override: overridePolicies.length > 0,
    override_policies: overridePolicies,
  }
}

export async function gatherJobContext(
  supabase: SupabaseClient,
  jobId: string
): Promise<JobContext> {
  const { data: job } = await supabase
    .from('jobs')
    .select('id, college_id, compensation_ctc, compensation_fixed, job_type_id, placement_level_id, placement_category_id, cycle_id')
    .eq('id', jobId)
    .single()

  let levelRank: number | null = null
  let isDream = false
  let isSuperDream = false

  if (job?.placement_level_id) {
    const { data: level } = await supabase
      .from('placement_levels')
      .select('rank, is_dream, is_super_dream')
      .eq('id', job.placement_level_id)
      .single()
    if (level) {
      levelRank = level.rank
      isDream = level.is_dream
      isSuperDream = level.is_super_dream
    }
  }

  return {
    id: jobId,
    college_id: job?.college_id || null,
    compensation_ctc: job?.compensation_ctc || null,
    compensation_fixed: job?.compensation_fixed || null,
    job_type_id: job?.job_type_id || null,
    placement_level_id: job?.placement_level_id || null,
    placement_category_id: job?.placement_category_id || null,
    cycle_id: job?.cycle_id || null,
    level_rank: levelRank,
    level_is_dream: isDream,
    level_is_super_dream: isSuperDream,
  }
}

// ─── Main Policy Evaluator ───────────────────────────────────

export function evaluatePolicies(
  config: PolicyConfig,
  student: StudentContext,
  job: JobContext
): PolicyResult {
  const violations: string[] = []

  // If student has an active override for ALL policies, allow immediately
  if (student.has_active_override && student.override_policies.includes('all')) {
    return { allowed: true, violations: [] }
  }

  const isOverridden = (policy: string) =>
    student.has_active_override && student.override_policies.includes(policy)

  // ── Policy #1: Registration ──
  const reg = config.registration
  if (reg?.enabled && !isOverridden('registration')) {
    if (reg.requirement === 'mandatory' && !student.is_registered_for_cycle) {
      violations.push('You must register for the active placement cycle before applying.')
    }
  }

  // ── Policy #19: Academic Clearance ──
  const acad = config.academic_clearance
  if (acad?.enabled && !isOverridden('academic_clearance')) {
    if (acad.clearance_required_before === 'application') {
      const profile = student.profile_data
      const elig = config.eligibility
      if (elig?.enabled) {
        const activeBacklogs = Number(profile.active_backlogs) || 0
        if (elig.max_active_backlogs !== null && activeBacklogs > elig.max_active_backlogs) {
          violations.push(`Academic clearance required: You have ${activeBacklogs} active backlogs (max allowed: ${elig.max_active_backlogs}).`)
        }
      }
    }
  }

  // ── Policy #18: Training Readiness ──
  const training = config.training_readiness
  if (training?.enabled && !isOverridden('training_readiness')) {
    if (!student.training_completed) {
      violations.push('You must complete all mandatory training modules before applying.')
    }
    if (training.min_score !== null && student.training_score !== null && student.training_score < training.min_score) {
      violations.push(`Minimum training score required: ${training.min_score}. Your score: ${student.training_score}.`)
    }
  }

  // ── Policy #2: Eligibility ──
  const elig = config.eligibility
  if (elig?.enabled && !isOverridden('eligibility')) {
    const p = student.profile_data
    if (elig.min_gpa !== null && (Number(p.gpa) || 0) < elig.min_gpa) {
      violations.push(`Minimum GPA required: ${elig.min_gpa}. Your GPA: ${p.gpa || 'not set'}.`)
    }
    if (elig.min_10th !== null && (Number(p.academic_10th) || 0) < elig.min_10th) {
      violations.push(`Minimum 10th marks required: ${elig.min_10th}%. Your marks: ${p.academic_10th || 'not set'}.`)
    }
    if (elig.min_12th !== null && (Number(p.academic_12th) || 0) < elig.min_12th) {
      violations.push(`Minimum 12th marks required: ${elig.min_12th}%. Your marks: ${p.academic_12th || 'not set'}.`)
    }
    if (elig.min_diploma !== null && (Number(p.diploma_percentage) || 0) < elig.min_diploma) {
      violations.push(`Minimum diploma marks required: ${elig.min_diploma}%.`)
    }
    if (elig.min_graduation !== null && (Number(p.graduation_percentage) || 0) < elig.min_graduation) {
      violations.push(`Minimum graduation marks required: ${elig.min_graduation}%.`)
    }
    if (elig.max_active_backlogs !== null && (Number(p.active_backlogs) || 0) > elig.max_active_backlogs) {
      violations.push(`Maximum active backlogs allowed: ${elig.max_active_backlogs}. You have: ${p.active_backlogs || 0}.`)
    }
    if (elig.max_historical_backlogs !== null && (Number(p.historical_backlogs) || 0) > elig.max_historical_backlogs) {
      violations.push(`Maximum historical backlogs allowed: ${elig.max_historical_backlogs}.`)
    }
    if (elig.max_gap_years !== null && (Number(p.academic_gap_years) || 0) > elig.max_gap_years) {
      violations.push(`Maximum academic gap allowed: ${elig.max_gap_years} years.`)
    }
    if (elig.allowed_years?.length > 0 && !elig.allowed_years.includes(p.year)) {
      violations.push(`This job is restricted to years: ${elig.allowed_years.join(', ')}. Your year: ${p.year || 'not set'}.`)
    }
    if (elig.allowed_types?.length > 0 && !elig.allowed_types.includes(p.type)) {
      violations.push(`This job is restricted to degree types: ${elig.allowed_types.join(', ')}.`)
    }
    if (elig.allowed_departments?.length > 0 && !elig.allowed_departments.includes(p.department)) {
      violations.push(`This job is restricted to departments: ${elig.allowed_departments.join(', ')}.`)
    }
  }

  // ── Policy #3: Application Limits ──
  const appLimit = config.application_limit
  if (appLimit?.enabled && !isOverridden('application_limit')) {
    if (appLimit.max_total !== null && student.total_applications >= appLimit.max_total) {
      violations.push(`Maximum total applications reached: ${appLimit.max_total}.`)
    }
    if (appLimit.max_active !== null && student.active_applications >= appLimit.max_active) {
      violations.push(`Maximum active applications reached: ${appLimit.max_active}.`)
    }
    if (appLimit.max_per_cycle !== null && student.applications_in_cycle >= appLimit.max_per_cycle) {
      violations.push(`Maximum applications per placement cycle reached: ${appLimit.max_per_cycle}.`)
    }
    if (appLimit.max_per_day !== null && student.applications_today >= appLimit.max_per_day) {
      violations.push(`Maximum daily application limit reached: ${appLimit.max_per_day}.`)
    }
    if (appLimit.max_per_week !== null && student.applications_this_week >= appLimit.max_per_week) {
      violations.push(`Maximum weekly application limit reached: ${appLimit.max_per_week}.`)
    }
    if (appLimit.max_per_level !== null && job.placement_level_id) {
      const count = student.applications_per_level[job.placement_level_id] || 0
      if (count >= appLimit.max_per_level) {
        violations.push(`Maximum applications per placement level reached: ${appLimit.max_per_level}.`)
      }
    }
    if (appLimit.max_per_category !== null && job.placement_category_id) {
      const count = student.applications_per_category[job.placement_category_id] || 0
      if (count >= appLimit.max_per_category) {
        violations.push(`Maximum applications per category reached: ${appLimit.max_per_category}.`)
      }
    }
    if (appLimit.max_per_job_type !== null && job.job_type_id) {
      const count = student.applications_per_job_type[job.job_type_id] || 0
      if (count >= appLimit.max_per_job_type) {
        violations.push(`Maximum applications per job type reached: ${appLimit.max_per_job_type}.`)
      }
    }
  }

  // ── Policy #12: Attempt Limits ──
  const attemptLimit = config.attempt_limit
  if (attemptLimit?.enabled && !isOverridden('attempt_limit')) {
    if (student.total_offers === 0 && attemptLimit.max_first_offer_attempts !== null) {
      if (student.total_attempts >= attemptLimit.max_first_offer_attempts) {
        violations.push(`Maximum placement attempts before first offer reached: ${attemptLimit.max_first_offer_attempts}.`)
      }
    }
    if (student.total_offers > 0 && attemptLimit.max_additional_offer_attempts !== null) {
      if (student.total_attempts >= attemptLimit.max_additional_offer_attempts) {
        violations.push(`Maximum additional placement attempts reached: ${attemptLimit.max_additional_offer_attempts}.`)
      }
    }
  }

  // ── Policy #6: Offer Limits ──
  const offerLimit = config.offer_limit
  if (offerLimit?.enabled && !isOverridden('offer_limit')) {
    if (offerLimit.debar_on_hired && student.has_hired_status) {
      violations.push('You have already been placed (hired). No further applications allowed.')
    }
    if (offerLimit.max_offers_total !== null && student.total_offers >= offerLimit.max_offers_total) {
      violations.push(`Maximum total offers reached: ${offerLimit.max_offers_total}.`)
    }
    if (offerLimit.max_active_offers !== null && student.active_offers >= offerLimit.max_active_offers) {
      violations.push(`Maximum active offers reached: ${offerLimit.max_active_offers}. Accept or decline an existing offer first.`)
    }
    if (offerLimit.max_accepted_offers !== null && student.accepted_offers >= offerLimit.max_accepted_offers) {
      violations.push(`Maximum accepted offers reached: ${offerLimit.max_accepted_offers}.`)
    }
    // Participation end check
    if (offerLimit.participation_ends_on === 'offer_accepted' && student.accepted_offers > 0) {
      violations.push('Your placement participation has ended after accepting an offer.')
    }
    if (offerLimit.participation_ends_on === 'hired' && student.has_hired_status) {
      violations.push('Your placement participation has ended after being hired.')
    }
  }

  // ── Policy #17: Placement Completion ──
  const completion = config.placement_completion
  if (completion?.enabled && !isOverridden('placement_completion')) {
    const trigger = completion.completion_trigger
    if (trigger === 'offer_accepted' && student.accepted_offers > 0) {
      violations.push('Placement completed: You have already accepted an offer.')
    }
    if (trigger === 'hired' && student.has_hired_status) {
      violations.push('Placement completed: You are already placed (hired).')
    }
    if (trigger === 'offered' && student.total_offers > 0) {
      violations.push('Placement completed: You have already received an offer.')
    }
  }

  // ── Policy #7: Upgrade Rules ──
  const upgrade = config.upgrade
  if (upgrade?.enabled && !isOverridden('upgrade') && student.existing_offer_ctc !== null) {
    const newCtc = job.compensation_ctc
    if (newCtc !== null && student.existing_offer_ctc !== null) {
      const existingCtc = student.existing_offer_ctc

      if (upgrade.comparison_operator === 'greater_than' && newCtc <= existingCtc) {
        violations.push(`Upgrade policy: New CTC (₹${newCtc}) must be greater than existing offer (₹${existingCtc}).`)
      }

      if (upgrade.min_increment_pct !== null) {
        const requiredCtc = existingCtc * (1 + upgrade.min_increment_pct / 100)
        if (newCtc < requiredCtc) {
          violations.push(`Upgrade policy: New CTC must be at least ${upgrade.min_increment_pct}% higher than existing offer.`)
        }
      }

      if (upgrade.min_increment_amount !== null) {
        if (newCtc < existingCtc + upgrade.min_increment_amount) {
          violations.push(`Upgrade policy: New CTC must be at least ₹${upgrade.min_increment_amount} higher than existing offer.`)
        }
      }
    }

    if (upgrade.must_be_higher_level && job.level_rank !== null && student.existing_offer_level_rank !== null) {
      if (job.level_rank <= student.existing_offer_level_rank) {
        violations.push('Upgrade policy: New job must be at a higher placement level than your current offer.')
      }
    }

    if (upgrade.max_upgrade_attempts !== null && student.total_attempts >= upgrade.max_upgrade_attempts) {
      violations.push(`Upgrade policy: Maximum upgrade attempts reached: ${upgrade.max_upgrade_attempts}.`)
    }
  }

  // ── Policy #11: Level/Category Movement ──
  const movement = config.level_movement
  if (movement?.enabled && !isOverridden('level_movement')) {
    if (movement.requires_higher_package && student.existing_offer_ctc !== null && job.compensation_ctc !== null) {
      if (job.compensation_ctc <= student.existing_offer_ctc) {
        violations.push('Level movement policy: You can only move to a higher-package opportunity.')
      }
    }
  }

  // ── Policy #13: Dream Opportunity ──
  const dream = config.dream
  if (dream?.enabled && !isOverridden('dream') && job.level_is_dream) {
    if (dream.max_dream_attempts !== null) {
      // Count dream applications (simplified — based on level_is_dream tag)
      const dreamAppCount = Object.entries(student.applications_per_level)
        .reduce((sum) => sum + 1, 0) // Simplified count
      if (dreamAppCount >= dream.max_dream_attempts) {
        violations.push(`Dream policy: Maximum dream opportunity attempts reached: ${dream.max_dream_attempts}.`)
      }
    }
    if (dream.max_dream_offers !== null && student.total_offers >= dream.max_dream_offers) {
      violations.push(`Dream policy: Maximum dream offers reached: ${dream.max_dream_offers}.`)
    }
  }

  // ── Policy #14: Super Dream ──
  const superDream = config.super_dream
  if (superDream?.enabled && !isOverridden('super_dream') && job.level_is_super_dream) {
    if (superDream.max_attempts !== null && student.total_attempts >= superDream.max_attempts) {
      violations.push(`Super Dream policy: Maximum attempts reached: ${superDream.max_attempts}.`)
    }
    if (superDream.max_offers !== null && student.total_offers >= superDream.max_offers) {
      violations.push(`Super Dream policy: Maximum offers reached: ${superDream.max_offers}.`)
    }
  }

  // ── Policy #5: No-Show ──
  const noShow = config.no_show
  if (noShow?.enabled && !isOverridden('no_show')) {
    if (student.no_show_count >= noShow.max_no_shows) {
      violations.push(`No-show policy: You have ${student.no_show_count} unexcused absences (max: ${noShow.max_no_shows}). Your placement participation is suspended.`)
    }
  }

  return {
    allowed: violations.length === 0,
    violations,
  }
}
