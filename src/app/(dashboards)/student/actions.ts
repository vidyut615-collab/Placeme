'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_POLICY_CONFIG, gatherStudentContext, gatherJobContext, evaluatePolicies } from '@/lib/policy-engine'

export async function applyForJob(jobId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.app_metadata.role !== 'student') {
      return { error: 'Unauthorized. Only students can apply for jobs.' }
    }

    // Get the student's record ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, college_id')
      .eq('user_id', user.id)
      .single()

    if (studentError || !student) {
      return { error: 'Student profile not found.' }
    }

    // Verify the job is active and either global or belongs to the student's college
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, college_id, status')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return { error: 'Job not found.' }
    }

    if (job.status !== 'active') {
      return { error: 'This job is no longer active.' }
    }

    if (job.college_id && job.college_id !== student.college_id) {
      return { error: 'You are not eligible to apply for this college-specific job.' }
    }

    // Check if already applied
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('student_id', student.id)
      .maybeSingle()

    if (existingApp) {
      return { error: 'You have already applied for this job.' }
    }

    // --- POLICY ENGINE EVALUATION ---
    // Only evaluate policies if the job belongs to a college.
    // Global jobs might bypass college policies, or we might apply them. Let's apply them based on the student's college.
    const { data: policyRow } = await supabase
      .from('placement_policies')
      .select('config')
      .eq('college_id', student.college_id)
      .single()

    const config = policyRow?.config
      ? { ...DEFAULT_POLICY_CONFIG, ...(policyRow.config as any) }
      : DEFAULT_POLICY_CONFIG

    const studentCtx = await gatherStudentContext(supabase, student.id, student.college_id, jobId)
    const jobCtx = await gatherJobContext(supabase, jobId)

    const result = evaluatePolicies(config, studentCtx, jobCtx)

    if (!result.allowed) {
      return { 
        error: 'Application rejected by placement policies:\n' + result.violations.map(v => `• ${v}`).join('\n') 
      }
    }
    // --------------------------------

    // Create the application
    const { error: applyError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        student_id: student.id,
        status: 'applied'
      })

    if (applyError) throw applyError

    revalidatePath('/student/jobs')
    revalidatePath('/student/applications')
    revalidatePath('/student/dashboard')

    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Failed to apply for job.' }
  }
}
