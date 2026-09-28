'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function applyForJob(jobId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.app_metadata.role !== 'student') {
      return { error: 'Unauthorized. Only students can apply for jobs.' }
    }

    // Get the student's record and counters
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, college_id, is_blacklisted, policy_counters')
      .eq('user_id', user.id)
      .single()

    if (studentError || !student) return { error: 'Student profile not found.' }

    if (student.is_blacklisted) {
      return { error: 'You are currently blacklisted and cannot apply for jobs.' }
    }

    // Verify the job is active and accepting applications
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, college_id, status, compensation_ctc, application_deadline')
      .eq('id', jobId)
      .single()

    if (jobError || !job) return { error: 'Job not found.' }
    if (job.status === 'paused') {
      return { error: 'Applications for this job are currently paused by college administration.' }
    }
    if (job.status === 'completed') {
      return { error: 'This recruitment drive has been completed and is closed for applications.' }
    }
    if (job.status === 'cancelled') {
      return { error: 'This recruitment drive has been cancelled.' }
    }
    if (job.status !== 'active') {
      return { error: 'This job is no longer active.' }
    }
    if (job.application_deadline && new Date().getTime() > new Date(job.application_deadline).getTime()) {
      return { error: 'The application deadline for this job has passed.' }
    }
    if (job.college_id && job.college_id !== student.college_id) return { error: 'You are not eligible.' }

    // Check if already applied
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('student_id', student.id)
      .maybeSingle()

    if (existingApp) return { error: 'You have already applied for this job.' }

    // Fetch college placement policies
    const { data: policyDoc } = await supabase
      .from('placement_policies')
      .select('config')
      .eq('college_id', student.college_id)
      .maybeSingle()

    const config = policyDoc?.config || {}

    // --- POLICY ENGINE: APPLICATION LIMITS CHECK ---
    const isGlobalJob = job.college_id === null;

    if (isGlobalJob) {
      // 1. Fetch Global Settings & Enforce Global Quota
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('max_global_applications_per_student')
        .single()
      
      const maxGlobal = platformSettings?.max_global_applications_per_student || 10

      const { count: globalCount } = await supabase
        .from('applications')
        .select('id, jobs!inner(college_id)', { count: 'exact', head: true })
        .eq('student_id', student.id)
        .is('jobs.college_id', null)

      if (globalCount !== null && globalCount >= maxGlobal) {
        return { error: `Global application limit reached (${maxGlobal}). You cannot apply to any more global agency jobs this season.` }
      }
    } else {
      // 2. Enforce Local College Quotas (excluding global jobs)
      const appLimits = config.application_limit
      if (appLimits?.enabled) {
        if (appLimits.max_active !== null && appLimits.max_active !== undefined) {
          const { count: activeCount } = await supabase
            .from('applications')
            .select('id, jobs!inner(college_id)', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('jobs.college_id', student.college_id)
            .not('status', 'in', '("rejected","withdrawn","closed")')

          if (activeCount !== null && activeCount >= appLimits.max_active) {
            return { error: `Concurrent active application limit reached (${appLimits.max_active}). Please wait for current applications to conclude.` }
          }
        }

        if (appLimits.max_total !== null && appLimits.max_total !== undefined) {
          const { count: totalCount } = await supabase
            .from('applications')
            .select('id, jobs!inner(college_id)', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('jobs.college_id', student.college_id)

          if (totalCount !== null && totalCount >= appLimits.max_total) {
            return { error: `Season application limit reached (${appLimits.max_total}). You cannot apply for additional drives.` }
          }
        }
      }
    }

    // --- POLICY ENGINE: 1-OFFER / DREAM / SUPER DREAM CHECK ---
    // A student is officially Placed when their offer is approved in student_offers
    const { data: approvedOffers } = await supabase
      .from('student_offers')
      .select('compensation_ctc, offer_type')
      .eq('student_id', student.id)
      .eq('status', 'approved')

    const isOfficiallyPlaced = (approvedOffers && approvedOffers.length > 0)
    let counterFieldToIncrement: string | null = null

    if (isOfficiallyPlaced) {
      const offerLimitConfig = config.offer_limit || { enabled: false, max_offers_total: 1 }
      
      // If 1-Offer Policy is explicitly disabled, skip the lock
      if (offerLimitConfig.enabled) {
        const counters = student.policy_counters || {}
        const maxCurrentCtc = Math.max(...approvedOffers.map(o => o.compensation_ctc || 0))
        const jobCtc = job.compensation_ctc || 0

        const superDreamConfig = config.super_dream || { enabled: false, min_ctc: 20, max_attempts: 2 }
        const dreamConfig = config.dream || { enabled: false, min_ctc: 10, max_dream_attempts: 3 }
        const upgradeConfig = config.upgrade || { enabled: false, min_increment_pct: null, max_upgrade_attempts: null }

        if (superDreamConfig.enabled && superDreamConfig.min_ctc && jobCtc >= superDreamConfig.min_ctc) {
          // Super Dream upgrade opportunity
          const maxAttempts = superDreamConfig.max_attempts || 2
          const attemptsUsed = counters.super_dream_attempts || 0
          if (attemptsUsed >= maxAttempts) {
            return { error: `You have reached the maximum allowed Super Dream upgrade attempts (${maxAttempts}).` }
          }
          counterFieldToIncrement = 'super_dream_attempts'
        } else if (dreamConfig.enabled && dreamConfig.min_ctc && jobCtc >= dreamConfig.min_ctc) {
          // Dream upgrade opportunity
          const maxAttempts = dreamConfig.max_dream_attempts || 3
          const attemptsUsed = counters.dream_attempts || 0
          if (attemptsUsed >= maxAttempts) {
            return { error: `You have reached the maximum allowed Dream upgrade attempts (${maxAttempts}).` }
          }
          counterFieldToIncrement = 'dream_attempts'
        } else if (upgradeConfig.enabled) {
          // General upgrade check
          const maxUpgrades = upgradeConfig.max_upgrade_attempts || 1
          const upgradesUsed = counters.upgrades_used || 0
          if (upgradesUsed >= maxUpgrades) {
            return { error: `You have reached the maximum allowed upgrade attempts (${maxUpgrades}).` }
          }
          const pct = upgradeConfig.min_increment_pct || 0
          const multiplier = 1 + (pct / 100)
          const requiredCtc = maxCurrentCtc * multiplier
          if (jobCtc <= maxCurrentCtc || (multiplier > 1 && jobCtc > 0 && jobCtc < requiredCtc)) {
            return { error: `Under 1-Offer Policy, you may only apply for higher upgrade opportunities (Required CTC: ₹${requiredCtc} LPA, Job CTC: ₹${jobCtc} LPA).` }
          }
          counterFieldToIncrement = 'upgrades_used'
        } else {
          return { error: 'You are already officially placed. Under the college 1-Offer Policy, you cannot apply for standard campus placement drives.' }
        }
      }
    }
    // -------------------------------------------------------------

    // Create the application
    const { error: applyError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        student_id: student.id,
        status: 'applied'
      })

    if (applyError) throw applyError
    
    // Update upgrade / dream counter if used
    if (counterFieldToIncrement) {
      const counters = student.policy_counters || {}
      counters[counterFieldToIncrement] = (counters[counterFieldToIncrement] || 0) + 1
      await supabase
        .from('students')
        .update({ policy_counters: counters })
        .eq('id', student.id)
    }

    revalidatePath('/student/jobs')
    revalidatePath('/student/applications')
    revalidatePath('/student/dashboard')

    return { success: 'Application submitted successfully.' }
  } catch (error: any) {
    return { error: error.message || 'Failed to apply for job.' }
  }
}

export async function withdrawApplication(
  applicationId: string, 
  reasonCategory?: string, 
  reasonDetails?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.app_metadata.role !== 'student') {
      return { error: 'Unauthorized.' }
    }

    const { data: student } = await supabase
      .from('students')
      .select('id, college_id, policy_counters')
      .eq('user_id', user.id)
      .single()

    if (!student) return { error: 'Student not found.' }

    const { data: application } = await supabase
      .from('applications')
      .select('status, job_id')
      .eq('id', applicationId)
      .eq('student_id', student.id)
      .single()

    if (!application) return { error: 'Application not found.' }

    const currentStatus = application.status
    if (['dropped', 'hired', 'forfeited'].includes(currentStatus)) {
      return { error: 'Cannot withdraw from this state.' }
    }

    // Determine withdrawal penalty type based on stage
    const isPostShortlist = ['shortlisted', 'stage1', 'stage2', 'stage3', 'interviewing', 'offered'].includes(currentStatus)
    
    const { data: policyDoc } = await supabase
      .from('placement_policies')
      .select('config')
      .eq('college_id', student.college_id)
      .single()
      
    const config = policyDoc?.config || {}
    let counters = student.policy_counters || {}
    let autoBlacklistReason = null

    if (isPostShortlist) {
      counters.post_shortlist_withdrawals = (counters.post_shortlist_withdrawals || 0) + 1
      if (config.post_shortlist_withdrawal?.enabled && counters.post_shortlist_withdrawals >= config.post_shortlist_withdrawal.max_allowed) {
        autoBlacklistReason = 'Auto-Blacklist: Exceeded Post-Shortlist Withdrawal Limit'
      }
    } else {
      counters.withdrawals = (counters.withdrawals || 0) + 1
      if (config.withdrawal?.enabled && counters.withdrawals >= config.withdrawal.max_allowed) {
        autoBlacklistReason = 'Auto-Blacklist: Exceeded Withdrawal Limit'
      }
    }

    const categoryLabel = reasonCategory || 'Personal / General'
    const fullReason = reasonDetails 
      ? `Student Withdrew (${categoryLabel}): ${reasonDetails.trim()}`
      : `Student Withdrew: ${categoryLabel}`

    // Execute application update
    await supabase
      .from('applications')
      .update({ 
        status: 'dropped', 
        dropped_reason: fullReason,
        is_withdrawn: true,
        withdrawal_reason: fullReason,
        withdrawn_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    const studentUpdatePayload: any = { policy_counters: counters }
    if (autoBlacklistReason) {
      studentUpdatePayload.is_blacklisted = true
      studentUpdatePayload.blacklist_reason = autoBlacklistReason
    }

    const { error: studentUpdateError } = await supabase
      .from('students')
      .update(studentUpdatePayload)
      .eq('id', student.id)
      
    if (studentUpdateError) {
      throw new Error(`Failed to update student: ${studentUpdateError.message}`)
    }

    revalidatePath('/student/applications')
    revalidatePath('/student/dashboard')
    revalidatePath(`/college/jobs/${application.job_id}`)
    
    return { success: 'Application withdrawn successfully.' }
  } catch (error: any) {
    return { error: error.message || 'Failed to withdraw application.' }
  }
}

export async function declareStudentOffer({
  companyName,
  jobRole,
  compensationCtc,
  offerType,
  jobId,
  offerLetterUrl,
  password,
}: {
  companyName: string
  jobRole: string
  compensationCtc: number
  offerType: 'on_campus' | 'off_campus'
  jobId?: string | null
  offerLetterUrl?: string | null
  password: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.app_metadata.role !== 'student') {
      return { error: 'Unauthorized. Only students can declare job offers.' }
    }

    if (!password) {
      return { error: 'Password confirmation is required.' }
    }

    if (!companyName || !jobRole || !compensationCtc) {
      return { error: 'Company Name, Job Role, and CTC are required.' }
    }

    if (!offerLetterUrl) {
      return { error: 'Please upload a copy of your Offer Letter (max 500KB).' }
    }

    // No base64 check needed since we upload to Storage client-side

    // Cryptographic verification of student's account password
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    })

    if (authErr) {
      return { error: 'Incorrect account password. Confirmation failed.' }
    }

    // Fetch student profile record
    const { data: student, error: stuErr } = await supabase
      .from('students')
      .select('id, college_id')
      .eq('user_id', user.id)
      .single()

    if (stuErr || !student) {
      return { error: 'Student record not found.' }
    }

    // 1. Concurrency / Duplicate check: Block submission if an offer is already pending review
    const { data: existingPending } = await supabase
      .from('student_offers')
      .select('id, company_name, job_role')
      .eq('student_id', student.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return { 
        error: `You already have an active offer declaration for "${existingPending.company_name}" (${existingPending.job_role}) currently pending verification by the college placement cell. You cannot submit multiple concurrent declarations.` 
      }
    }

    // 2. 1-Offer Policy Check: If student already has an approved offer, verify upgrade eligibility
    const { data: existingApproved } = await supabase
      .from('student_offers')
      .select('id, company_name, compensation_ctc')
      .eq('student_id', student.id)
      .eq('status', 'approved')
      .maybeSingle()

    if (existingApproved) {
      if (compensationCtc <= Number(existingApproved.compensation_ctc)) {
        return {
          error: `Under the college 1-Offer Policy, you are already officially placed at "${existingApproved.company_name}" (₹${existingApproved.compensation_ctc} LPA). You may only declare higher upgrade offers.`
        }
      }
    }

    // Insert into student_offers
    const { error: insertErr } = await supabase
      .from('student_offers')
      .insert({
        student_id: student.id,
        college_id: student.college_id,
        job_id: jobId && jobId !== 'none' ? jobId : null,
        company_name: companyName.trim(),
        job_role: jobRole.trim(),
        compensation_ctc: compensationCtc,
        offer_type: offerType,
        offer_letter_url: offerLetterUrl,
        status: 'pending',
        student_confirmed_at: new Date().toISOString()
      })

    if (insertErr) {
      return { error: `Failed to submit offer declaration: ${insertErr.message}` }
    }

    revalidatePath('/student/dashboard')
    revalidatePath('/student/profile')
    revalidatePath('/student/applications')
    revalidatePath('/college/approvals')
    revalidatePath('/college/placed-students')

    return { success: 'Offer declaration submitted successfully for college verification!' }
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred.' }
  }
}

