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

    // Verify the job is active
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, college_id, status, compensation_ctc')
      .eq('id', jobId)
      .single()

    if (jobError || !job) return { error: 'Job not found.' }
    if (job.status !== 'active') return { error: 'This job is no longer active.' }
    if (job.college_id && job.college_id !== student.college_id) return { error: 'You are not eligible.' }

    // Check if already applied
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('student_id', student.id)
      .maybeSingle()

    if (existingApp) return { error: 'You have already applied for this job.' }

    // --- POLICY ENGINE: UPGRADE RULE CHECK ---
    const { data: apps } = await supabase
      .from('applications')
      .select('status, jobs(compensation_ctc)')
      .eq('student_id', student.id)
      
    const hiredApps = apps?.filter(a => a.status === 'hired') || []
    let upgradesUsedToIncrement = 0

    if (hiredApps.length > 0) {
      // Student is PLACED. Check Upgrade Policy.
      const { data: policyDoc } = await supabase
        .from('placement_policies')
        .select('config')
        .eq('college_id', student.college_id)
        .single()
        
      const config = policyDoc?.config || {}
      const upgradeConfig = config.upgrade || { enabled: false }
      
      if (!upgradeConfig.enabled) {
        return { error: 'You are already placed and offer upgrades are disabled.' }
      }
      
      const counters = student.policy_counters || {}
      const upgradesUsed = counters.upgrades_used || 0
      const maxUpgrades = upgradeConfig.max_allowed || 1
      
      if (upgradesUsed >= maxUpgrades) {
        return { error: `You have reached the maximum allowed upgrade attempts (${maxUpgrades}).` }
      }
      
      // Get highest current CTC
      const currentCtcs = hiredApps.map(a => (a.jobs as any)?.compensation_ctc || 0)
      const maxCurrentCtc = Math.max(...currentCtcs)
      
      const multiplier = upgradeConfig.min_multiplier || 1
      const requiredCtc = maxCurrentCtc * multiplier
      
      const newCtc = job.compensation_ctc || 0
      if (newCtc <= maxCurrentCtc || (multiplier > 1 && newCtc < requiredCtc)) {
        return { error: `Upgrade rule not met. Required CTC: ${requiredCtc}, Job CTC: ${newCtc}` }
      }
      
      upgradesUsedToIncrement = 1
    }
    // -----------------------------------------

    // Create the application
    const { error: applyError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        student_id: student.id,
        status: 'applied'
      })

    if (applyError) throw applyError
    
    // Update upgrade counter if used
    if (upgradesUsedToIncrement > 0) {
      const counters = student.policy_counters || {}
      counters.upgrades_used = (counters.upgrades_used || 0) + 1
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

export async function withdrawApplication(applicationId: string) {
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
    const isPostShortlist = ['shortlisted', 'interviewing', 'offered'].includes(currentStatus)
    
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

    // Execute updates
    await supabase
      .from('applications')
      .update({ status: 'dropped', dropped_reason: 'student_withdrew' })
      .eq('id', applicationId)

    const studentUpdatePayload: any = { policy_counters: counters }
    if (autoBlacklistReason) {
      studentUpdatePayload.is_blacklisted = true
      studentUpdatePayload.blacklist_reason = autoBlacklistReason
    }

    await supabase
      .from('students')
      .update(studentUpdatePayload)
      .eq('id', student.id)

    revalidatePath('/student/applications')
    revalidatePath('/student/dashboard')
    
    return { success: 'Application withdrawn successfully.' }
  } catch (error: any) {
    return { error: error.message || 'Failed to withdraw application.' }
  }
}
