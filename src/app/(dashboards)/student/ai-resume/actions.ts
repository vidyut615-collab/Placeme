'use server'

import { createClient } from '@/utils/supabase/server'

const AI_RESUME_CREDIT_COST = 5

export async function createAIResume(formData: { title: string, employer: string, role: string, jd: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // 1. Verify credits again on the server
    const { data: student } = await supabase
      .from('students')
      .select('credit_balance, access_end_date')
      .eq('user_id', user.id)
      .single()

    if (!student) throw new Error('Student not found')
    if (!student.access_end_date || new Date(student.access_end_date) < new Date()) {
      throw new Error('Subscription expired')
    }
    if ((student.credit_balance || 0) < AI_RESUME_CREDIT_COST) {
      throw new Error('Insufficient AI Credits')
    }

    // 2. Fetch Profile Data (Work Histories & Projects)
    const { data: workHistories } = await supabase
      .from('student_work_histories')
      .select('*')
      .eq('user_id', user.id)
      
    const { data: projects } = await supabase
      .from('student_projects')
      .select('*')
      .eq('user_id', user.id)

    // ------------------------------------------------------------------
    // TODO: AI GENERATION PIPELINE GOES HERE
    // Step A: Shorten JD
    // const shortenedJd = await callOpenAI(PROMPT_1, formData.jd)
    //
    // Step B: Loop Work Histories
    // const generatedWorks = await Promise.all(workHistories.map(w => callOpenAI(PROMPT_2, shortenedJd, w)))
    //
    // Step C: Loop Projects
    // const generatedProjects = await Promise.all(projects.map(p => callOpenAI(PROMPT_3, shortenedJd, p)))
    // ------------------------------------------------------------------
    
    // MOCK DATA for now until we plug in the real prompts
    const mockShortenedJd = "MOCK SHORTENED JD: " + formData.jd.substring(0, 50) + "..."
    
    const mockWorkHistories = (workHistories || []).map(w => ({
      profile_work_id: w.id,
      ai_options: [
        `[Generated Option 1 for ${w.job_title} at ${w.company_name}] Aligned with ${formData.employer}.`,
        `[Generated Option 2 for ${w.job_title} at ${w.company_name}] Focused on leadership.`,
        `[Generated Option 3 for ${w.job_title} at ${w.company_name}] Focused on metrics.`
      ],
      selected_option: null,
      final_edited_text: ""
    }))

    const mockProjects = (projects || []).map(p => ({
      profile_project_id: p.id,
      ai_options: [
        `[Generated Option 1 for ${p.title}] Built with modern tech.`,
        `[Generated Option 2 for ${p.title}] Solved complex problems.`,
        `[Generated Option 3 for ${p.title}] Delivered high impact.`
      ],
      selected_option: null,
      final_edited_text: ""
    }))

    const initialContent = {
      work_histories: mockWorkHistories,
      projects: mockProjects,
      career_objective: {
        is_generated: false,
        ai_options: [],
        final_edited_text: ""
      }
    }

    // 3. Deduct Credits
    await supabase
      .from('students')
      .update({ credit_balance: student.credit_balance - AI_RESUME_CREDIT_COST })
      .eq('user_id', user.id)

    // 4. Log the deduction
    await supabase.from('credit_ledgers').insert({
      user_id: user.id,
      amount: -AI_RESUME_CREDIT_COST,
      description: `AI Resume Generation: ${formData.role} at ${formData.employer}`
    })

    // 5. Create the Resume Record
    const { data: resume, error: resumeError } = await supabase
      .from('ai_resumes')
      .insert({
        user_id: user.id,
        title: formData.title,
        target_employer: formData.employer,
        target_role: formData.role,
        job_description: formData.jd,
        shortened_jd: mockShortenedJd,
        content: initialContent
      })
      .select('id')
      .single()

    if (resumeError) throw resumeError

    return { resumeId: resume.id }

  } catch (error: any) {
    console.error("AI Resume Creation Error:", error)
    return { error: error.message || 'Failed to create AI Resume' }
  }
}
