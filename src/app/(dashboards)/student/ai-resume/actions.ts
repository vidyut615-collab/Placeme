'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import Groq from 'groq-sdk'
import {
  PROMPT_SHORTEN_JD,
  PROMPT_WORK_HISTORY,
  PROMPT_PROJECT,
  PROMPT_CAREER_OBJECTIVE,
  PROMPT_ATS_KEYWORD_MATCH,
} from './prompts'

const AI_RESUME_CREDIT_COST = 50

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function callGroq(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    temperature: 0.5,
    max_tokens: 2048,
  })
  return completion.choices[0]?.message?.content || ''
}

function parseLLMJsonArray(text: string): string[] {
  try {
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim()

    try {
      const parsed = JSON.parse(cleanText)
      if (parsed && Array.isArray(parsed.options)) return parsed.options
      if (Array.isArray(parsed)) return parsed
    } catch {
      const stringMatches = cleanText.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)
      if (stringMatches && stringMatches.length > 0) {
        return stringMatches.map((m) => m.substring(1, m.length - 1))
      }

      if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
        const inner = cleanText.substring(1, cleanText.length - 1).trim()
        const options = inner.split(/["'],\s*["']/)
        return options.map((o) => o.replace(/^["']/, '').replace(/["']$/, ''))
      }
    }

    if (cleanText.includes('- ')) {
      return cleanText
        .split('\n')
        .filter((l) => l.trim().startsWith('-'))
        .map((l) => l.replace(/^-/, '').trim())
    }

    return [cleanText]
  } catch (e) {
    console.error('Failed to parse LLM JSON:', text, e)
    return ['Option 1 (Raw output): ' + text]
  }
}

/**
 * Creates an AI Resume by running the JD shortener upfront.
 * Deducts 50 credits and initializes work histories and projects from DigiProfile.
 */
export async function createAIResume(formData: {
  title: string
  employer: string
  role: string
  jd: string
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: student } = await supabase
      .from('students')
      .select('credit_balance, access_end_date, profile_data')
      .eq('user_id', user.id)
      .single()

    if (!student) throw new Error('Student profile not found')
    if (!student.access_end_date || new Date(student.access_end_date) < new Date()) {
      throw new Error('Subscription inactive or expired')
    }
    if ((student.credit_balance || 0) < AI_RESUME_CREDIT_COST) {
      throw new Error('Insufficient AI credits')
    }

    const profileData = (student.profile_data as Record<string, unknown>) || {}
    const experience = Array.isArray(profileData.experience) ? profileData.experience : []
    const projects = Array.isArray(profileData.projects) ? profileData.projects : []

    const shortenPrompt = PROMPT_SHORTEN_JD.replace('{{JOB_DESCRIPTION}}', formData.jd)
    const shortenedJd = await callGroq(shortenPrompt)

    const initialContent = {
      settings: {
        template: 'classic',
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        lineHeight: 1.4,
        margin: 14,
        accentColor: '#0F766E',
        pageFit: 'auto',
      },
      work_histories: experience.map((w: Record<string, string>, i: number) => ({
        profile_work_id: `work_${i}`,
        role: w.role || '',
        company: w.company || '',
        start_date: w.start_date || '',
        end_date: w.end_date || '',
        tech: w.tech || '',
        original_description: w.description || '',
        is_tailored: false,
        is_saved: false,
        ai_options: [],
        final_edited_text: w.description || '',
      })),
      projects: projects.map((p: Record<string, string>, i: number) => ({
        profile_project_id: `proj_${i}`,
        title: p.title || '',
        tech: p.tech || '',
        original_description: p.description || '',
        is_tailored: false,
        is_saved: false,
        ai_options: [],
        final_edited_text: p.description || '',
      })),
      career_objective: {
        is_generated: false,
        is_saved: false,
        ai_options: [],
        final_edited_text: '',
      },
    }

    const { error: deductError } = await supabase
      .from('students')
      .update({ credit_balance: student.credit_balance - AI_RESUME_CREDIT_COST })
      .eq('user_id', user.id)
      .gte('credit_balance', AI_RESUME_CREDIT_COST)

    if (deductError) throw new Error('Unable to deduct credits for resume generation')

    const { data: resume, error: resumeError } = await supabase
      .from('ai_resumes')
      .insert({
        user_id: user.id,
        title: formData.title.trim(),
        target_employer: formData.employer.trim(),
        target_role: formData.role.trim(),
        job_description: formData.jd.trim(),
        shortened_jd: shortenedJd,
        content: initialContent,
      })
      .select('id')
      .single()

    if (resumeError) {
      // Refund credits if inserting the resume record fails
      await supabase
        .from('students')
        .update({ credit_balance: student.credit_balance })
        .eq('user_id', user.id)
      throw resumeError
    }

    await supabase.from('credit_ledgers').insert({
      user_id: user.id,
      amount: -AI_RESUME_CREDIT_COST,
      description: `AI Resume Creation: ${formData.role} at ${formData.employer}`,
    })

    revalidatePath('/student/ai-resume')
    revalidatePath('/student/dashboard')
    return { success: true, resumeId: resume.id }
  } catch (error: unknown) {
    console.error('AI Resume Creation Error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to create AI Resume'
    return { success: false, error: msg }
  }
}

/**
 * Permanently deletes a compiled AI Resume owned by the current student.
 */
export async function deleteAIResumeAction(resumeId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('ai_resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/student/ai-resume')
    revalidatePath('/student/dashboard')
    return { success: true }
  } catch (error: unknown) {
    console.error('deleteAIResumeAction error:', error)
    const msg = error instanceof Error ? error.message : 'Failed to delete resume'
    return { success: false, error: msg }
  }
}

/**
 * On-demand AI tailoring for a single work history (1-time generation per entry).
 */
export async function tailorSingleWorkHistoryAction(resumeId: string, workIndex: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: resume, error: fetchError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) throw new Error('Resume not found')

    const content =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}
    const workHistories = content.work_histories || []
    const targetWork = workHistories[workIndex]

    if (!targetWork) throw new Error('Work history item not found')

    if (targetWork.is_tailored) {
      return {
        success: false,
        error: 'This work experience has already been tailored. Edit the text directly below.',
      }
    }

    const prompt = PROMPT_WORK_HISTORY.replace('{{JOB_TITLE}}', targetWork.role || '')
      .replace('{{COMPANY_NAME}}', targetWork.company || '')
      .replace('{{TECHNOLOGY_USED}}', targetWork.tech || '')
      .replace('{{SHORTENED_JD}}', resume.shortened_jd || resume.job_description || '')

    const rawResponse = await callGroq(prompt)
    const options = parseLLMJsonArray(rawResponse)

    targetWork.is_tailored = true
    targetWork.ai_options = options
    if (
      !targetWork.final_edited_text ||
      targetWork.final_edited_text === targetWork.original_description
    ) {
      targetWork.final_edited_text = options[0] || targetWork.original_description
    }
    workHistories[workIndex] = targetWork
    content.work_histories = workHistories

    const { error: updateError } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    revalidatePath('/student/ai-resume')
    return { success: true, options, updatedContent: content }
  } catch (err: unknown) {
    console.error('tailorSingleWorkHistoryAction error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to tailor work history'
    return { success: false, error: msg }
  }
}

/**
 * On-demand AI tailoring for a single project (1-time generation per entry).
 */
export async function tailorSingleProjectAction(resumeId: string, projectIndex: number) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: resume, error: fetchError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) throw new Error('Resume not found')

    const content =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}
    const projects = content.projects || []
    const targetProject = projects[projectIndex]

    if (!targetProject) throw new Error('Project item not found')

    if (targetProject.is_tailored) {
      return {
        success: false,
        error: 'This project has already been tailored. Edit the text directly below.',
      }
    }

    const prompt = PROMPT_PROJECT.replace('{{PROJECT_TITLE}}', targetProject.title || '')
      .replace('{{TECHNOLOGY_USED}}', targetProject.tech || '')
      .replace('{{PROJECT_DESCRIPTION}}', targetProject.original_description || '')
      .replace('{{SHORTENED_JD}}', resume.shortened_jd || resume.job_description || '')

    const rawResponse = await callGroq(prompt)
    const options = parseLLMJsonArray(rawResponse)

    targetProject.is_tailored = true
    targetProject.ai_options = options
    if (
      !targetProject.final_edited_text ||
      targetProject.final_edited_text === targetProject.original_description
    ) {
      targetProject.final_edited_text = options[0] || targetProject.original_description
    }
    projects[projectIndex] = targetProject
    content.projects = projects

    const { error: updateError } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    revalidatePath('/student/ai-resume')
    return { success: true, options, updatedContent: content }
  } catch (err: unknown) {
    console.error('tailorSingleProjectAction error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to tailor project'
    return { success: false, error: msg }
  }
}

/**
 * On-demand generation for Career Objective (1-time generation).
 */
export async function generateCareerObjectiveAction(resumeId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: resume, error: fetchError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) throw new Error('Resume not found')

    const { data: student } = await supabase
      .from('students')
      .select('profile_data')
      .eq('user_id', user.id)
      .single()

    const profileData = (student?.profile_data as Record<string, unknown>) || {}
    const content =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}

    if (content.career_objective?.is_generated) {
      return {
        success: false,
        error: 'Career Objective has already been generated. You can edit the text directly.',
      }
    }

    const workDump = (content.work_histories || [])
      .map(
        (w: Record<string, string>) =>
          `${w.role} at ${w.company}:\n${w.final_edited_text || w.original_description}`
      )
      .filter(Boolean)
      .join('\n\n')

    const skills = (profileData.skills as Record<string, string> | undefined) || {}

    const prompt = PROMPT_CAREER_OBJECTIVE.replace(
      '{{WORK_HISTORIES}}',
      workDump || 'Graduate with academic projects'
    )
      .replace('{{DOMAIN_SKILLS}}', skills?.languages || '')
      .replace('{{TOOLS_SKILLS}}', skills?.tools || '')
      .replace('{{SOFT_SKILLS}}', skills?.frameworks || '')
      .replace('{{JOB_ROLE}}', resume.target_role || 'Candidate')
      .replace('{{COMPANY_NAME}}', resume.target_employer || 'Company')
      .replace('{{SHORTENED_JD}}', resume.shortened_jd || resume.job_description || '')

    const rawResponse = await callGroq(prompt)
    const rawOptions = parseLLMJsonArray(rawResponse)
    const options = rawOptions.map((opt: string) =>
      opt
        .split('\n')
        .map((l) => l.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean)
        .join(' ')
    )

    content.career_objective = {
      is_generated: true,
      is_saved: false,
      ai_options: options,
      final_edited_text: options[0] || '',
    }

    const { error: updateError } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    revalidatePath('/student/ai-resume')
    return { success: true, options, updatedContent: content }
  } catch (err: unknown) {
    console.error('generateCareerObjectiveAction error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to generate career objective'
    return { success: false, error: msg }
  }
}

/**
 * Saves full resume content state (text edits, settings, overrides, optional ATS metadata).
 */
export async function saveResumeContentAction(resumeId: string, content: unknown) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/student/ai-resume')
    return { success: true }
  } catch (err: unknown) {
    console.error('saveResumeContentAction error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to save resume'
    return { success: false, error: msg }
  }
}

/**
 * Evaluates the resume text against the target job description via Groq to compute deep ATS Keyword Match.
 */
export async function checkATSMatchAction(resumeId: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: resume, error: fetchError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) throw new Error('Resume not found')

    const content =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}
    const workHistories = content.work_histories || []
    const projects = content.projects || []
    const objective = content.career_objective?.final_edited_text || ''

    const resumeTextPieces: string[] = []
    if (objective) resumeTextPieces.push(`Career Objective:\n${objective}`)

    workHistories.forEach((w: Record<string, string>) => {
      const text = w.final_edited_text || w.original_description
      if (text) resumeTextPieces.push(`${w.role} at ${w.company} (${w.tech || ''}):\n${text}`)
    })

    projects.forEach((p: Record<string, string>) => {
      const text = p.final_edited_text || p.original_description
      if (text) resumeTextPieces.push(`${p.title} (${p.tech || ''}):\n${text}`)
    })

    const fullResumeText = resumeTextPieces.join('\n\n')
    const targetJD = resume.job_description || resume.shortened_jd || ''

    if (!targetJD.trim()) {
      return {
        success: true,
        data: {
          match_score: 80,
          matching_keywords: ['General Technical Experience'],
          missing_keywords: [],
          summary: 'No specific target JD provided; resume evaluated on general competencies.',
        },
      }
    }

    const prompt = PROMPT_ATS_KEYWORD_MATCH.replace('{{JOB_DESCRIPTION}}', targetJD).replace(
      '{{RESUME_TEXT}}',
      fullResumeText
    )

    const rawResponse = await callGroq(prompt)
    let parsed: {
      match_score: number
      matching_keywords: string[]
      missing_keywords: string[]
      summary: string
    }
    try {
      const clean = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = {
        match_score: 70,
        matching_keywords: ['Technical Skills', 'Problem Solving'],
        missing_keywords: [],
        summary: rawResponse.slice(0, 180),
      }
    }

    content.ats_score = parsed
    await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)
      .eq('user_id', user.id)

    revalidatePath('/student/ai-resume')
    return { success: true, data: parsed }
  } catch (err: unknown) {
    console.error('checkATSMatchAction error:', err)
    const msg = err instanceof Error ? err.message : 'Failed to check ATS match'
    return { success: false, error: msg }
  }
}
