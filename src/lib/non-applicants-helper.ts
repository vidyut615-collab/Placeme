import { SupabaseClient } from '@supabase/supabase-js'
import { isStudentAcademicallyEligible } from './eligibility-helper'

export type EligibleNonApplicant = {
  studentId: string
  name: string
  email: string
  rollNumber: string
  department: string
  degreeType: string
  gradYear: string
  gpa: string | number
  activeBacklogs: number
  nonParticipationStrikes: number
}

/**
 * Identifies all college students who:
 * 1. Match the job's academic eligibility criteria (CGPA, Branch, Year, Backlogs).
 * 2. Are legally allowed to apply (not blacklisted, not debarred by 1-offer lock).
 * 3. Have NOT submitted an application for this job.
 */
export async function fetchEligibleNonApplicants(
  supabase: SupabaseClient,
  jobId: string,
  collegeId: string
): Promise<EligibleNonApplicant[]> {
  // 1. Fetch job criteria & compensation
  const { data: job } = await supabase
    .from('jobs')
    .select('id, college_id, compensation_ctc, eligibility_criteria')
    .eq('id', jobId)
    .single()

  if (!job) return []

  // 2. Fetch existing applications for this job (already applied or resolved)
  const { data: existingApps } = await supabase
    .from('applications')
    .select('student_id')
    .eq('job_id', jobId)

  const appliedStudentIds = new Set((existingApps || []).map(a => a.student_id))

  // 3. Fetch placed students for this college (for 1-offer policy checks)
  const { data: approvedOffers } = await supabase
    .from('student_offers')
    .select('student_id, compensation_ctc')
    .eq('status', 'approved')

  const placedMap = new Map<string, number>()
  approvedOffers?.forEach(o => {
    const current = placedMap.get(o.student_id) || 0
    placedMap.set(o.student_id, Math.max(current, o.compensation_ctc || 0))
  })

  // 4. Fetch college placement policy
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', collegeId)
    .maybeSingle()

  const config = policyDoc?.config || {}
  const dreamConfig = config.dream || {}
  const superDreamConfig = config.super_dream || {}
  const upgradeConfig = config.upgrade || {}
  const jobCtc = job.compensation_ctc || 0

  // 5. Fetch all registered students of this college
  const { data: students } = await supabase
    .from('students')
    .select(`
      id,
      is_blacklisted,
      onboarding_status,
      policy_counters,
      profile_data,
      users (
        full_name,
        email
      )
    `)
    .eq('college_id', collegeId)

  if (!students) return []

  const nonApplicants: EligibleNonApplicant[] = []

  for (const s of students) {
    // Exclude if already applied or already resolved
    if (appliedStudentIds.has(s.id)) continue

    // Exclude if blacklisted
    if (s.is_blacklisted) continue

    // Exclude if onboarding not complete
    if (s.onboarding_status === 'invited') continue

    // Exclude if placed and barred by 1-offer policy
    if (placedMap.has(s.id)) {
      const currentCtc = placedMap.get(s.id) || 0
      const isSuperDream = superDreamConfig.enabled && jobCtc >= (superDreamConfig.min_ctc || 20)
      const isDream = dreamConfig.enabled && jobCtc >= (dreamConfig.min_ctc || 10)
      const isUpgrade = upgradeConfig.enabled && jobCtc >= (currentCtc * (upgradeConfig.min_multiplier || 1))

      // If placed and not qualifying for higher tier, they were barred from applying, so cannot be penalized
      if (!isSuperDream && !isDream && !isUpgrade) {
        continue
      }
    }

    // Check academic eligibility against job criteria
    const isEligible = isStudentAcademicallyEligible(s.profile_data, job.eligibility_criteria)
    if (!isEligible) continue

    const profile = s.profile_data || {}
    const user = s.users as any
    const counters = s.policy_counters || {}

    nonApplicants.push({
      studentId: s.id,
      name: user?.full_name || profile.full_name || 'Unnamed Student',
      email: user?.email || '',
      rollNumber: profile.roll_number || 'N/A',
      department: profile.department || 'General',
      degreeType: profile.type || 'UG',
      gradYear: profile.year ? profile.year.toString() : 'N/A',
      gpa: profile.gpa || '—',
      activeBacklogs: Number(profile.active_backlogs) || 0,
      nonParticipationStrikes: Number(counters.non_participation) || 0,
    })
  }

  return nonApplicants
}
