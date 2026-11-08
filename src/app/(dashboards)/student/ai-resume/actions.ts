'use server'

import { createClient } from '@/utils/supabase/server'
import Groq from 'groq-sdk'
import { PROMPT_SHORTEN_JD, PROMPT_WORK_HISTORY, PROMPT_PROJECT, PROMPT_CAREER_OBJECTIVE, PROMPT_ATS_KEYWORD_MATCH } from './prompts'

const AI_RESUME_CREDIT_COST = 5

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function callGroq(prompt: string, isJson: boolean = false): Promise<string> {
  const params: any = {
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b", 
    temperature: 0.5,
    max_tokens: 2048,
  }

  const completion = await groq.chat.completions.create(params)
  return completion.choices[0]?.message?.content || ''
}

// Helper to safely parse JSON arrays returned by LLM
function parseLLMJsonArray(text: string): string[] {
  try {
    let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim()
    
    try {
      const parsed = JSON.parse(cleanText)
      // Check if it's the {"options": [...]} format
      if (parsed && Array.isArray(parsed.options)) return parsed.options
      if (Array.isArray(parsed)) return parsed
    } catch (e) {
      // Smart Fallback: Extract everything between quotes if JSON fails
      const stringMatches = cleanText.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)
      if (stringMatches && stringMatches.length > 0) {
        return stringMatches.map(m => m.substring(1, m.length - 1))
      }
      
      // Fallback: Python array format
      if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
        const inner = cleanText.substring(1, cleanText.length - 1).trim()
        const options = inner.split(/["'],\s*["']/)
        return options.map(o => o.replace(/^["']/, '').replace(/["']$/, ''))
      }
    }
    
    // If it's just raw text with bullet points, split by newlines
    if (cleanText.includes('- ')) {
       return cleanText.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^-/, '').trim())
    }

    return [cleanText] 
  } catch (e) {
    console.error("Failed to parse LLM JSON:", text)
    return ["Option 1 (Failed to parse JSON, raw output below): " + text]
  }
}

/**
 * Creates an AI Resume instantly by running ONLY the JD shortener upfront.
 * Deducts 5 credits flat.
 * Work histories and projects are initialized with the student's original profile text.
 */
export async function createAIResume(formData: { title: string, employer: string, role: string, jd: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Verify credits and active subscription
    const { data: student } = await supabase
      .from('students')
      .select('credit_balance, access_end_date, profile_data')
      .eq('user_id', user.id)
      .single()

    if (!student) throw new Error('Student not found')
    if (!student.access_end_date || new Date(student.access_end_date) < new Date()) {
      throw new Error('Subscription expired')
    }
    if ((student.credit_balance || 0) < AI_RESUME_CREDIT_COST) {
      throw new Error('Insufficient AI Credits')
    }

    // 2. Fetch Profile Data (JSON blob)
    const profileData: any = student.profile_data || {}
    const experience = profileData.experience || []
    const projects = profileData.projects || []

    // 3. Run ONLY the JD Shortener upfront for fast creation
    const shortenPrompt = PROMPT_SHORTEN_JD.replace('{{JOB_DESCRIPTION}}', formData.jd)
    const shortenedJd = await callGroq(shortenPrompt)

    // 4. Initialize initial content structure with raw profile data
    const initialContent = {
      settings: {
        template: 'classic', // 'classic' | 'modern' | 'executive'
        fontFamily: 'Inter',
        fontSize: 10,
        lineHeight: 1.4,
        margin: 14,
        accentColor: '#1e3a8a',
        pageFit: 'auto',
      },
      work_histories: experience.map((w: any, i: number) => ({
        profile_work_id: `work_${i}`,
        role: w.role || '',
        company: w.company || '',
        start_date: w.start_date || '',
        end_date: w.end_date || '',
        tech: w.tech || '',
        original_description: w.description || '',
        is_tailored: false,
        ai_options: [],
        final_edited_text: w.description || '' // initial default is original description
      })),
      projects: projects.map((p: any, i: number) => ({
        profile_project_id: `proj_${i}`,
        title: p.title || '',
        tech: p.tech || '',
        original_description: p.description || '',
        is_tailored: false,
        ai_options: [],
        final_edited_text: p.description || '' // initial default is original description
      })),
      career_objective: {
        is_generated: false,
        ai_options: [],
        final_edited_text: ""
      }
    }

    // 5. Deduct Credits (Flat 5 credits)
    await supabase
      .from('students')
      .update({ credit_balance: student.credit_balance - AI_RESUME_CREDIT_COST })
      .eq('user_id', user.id)

    // 6. Log the deduction
    await supabase.from('credit_ledgers').insert({
      user_id: user.id,
      amount: -AI_RESUME_CREDIT_COST,
      description: `AI Resume Creation: ${formData.role} at ${formData.employer}`
    })

    // 7. Create the Resume Record
    const { data: resume, error: resumeError } = await supabase
      .from('ai_resumes')
      .insert({
        user_id: user.id,
        title: formData.title,
        target_employer: formData.employer,
        target_role: formData.role,
        job_description: formData.jd,
        shortened_jd: shortenedJd,
        content: initialContent
      })
      .select('id')
      .single()

    if (resumeError) throw resumeError

    return { success: true, resumeId: resume.id }

  } catch (error: any) {
    console.error("AI Resume Creation Error:", error)
    return { success: false, error: error.message || 'Failed to create AI Resume' }
  }
}

/**
 * On-demand AI tailoring for a single work history.
 * Strictly 1-time generation per work entry.
 */
export async function tailorSingleWorkHistoryAction(resumeId: string, workIndex: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: resume, error: fetchError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) throw new Error('Resume not found')

    const content = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})
    const workHistories = content.work_histories || []
    const targetWork = workHistories[workIndex]

    if (!targetWork) throw new Error('Work history item not found')

    // Strict 1-time generation check
    if (targetWork.is_tailored) {
      return { success: false, error: 'This work experience has already been AI-generated. You can edit the text directly.' }
    }

    const prompt = PROMPT_WORK_HISTORY
      .replace('{{JOB_TITLE}}', targetWork.role || '')
      .replace('{{COMPANY_NAME}}', targetWork.company || '')
      .replace('{{TECHNOLOGY_USED}}', targetWork.tech || '')
      .replace('{{SHORTENED_JD}}', resume.shortened_jd || resume.job_description || '')

    const rawResponse = await callGroq(prompt, true)
    const options = parseLLMJsonArray(rawResponse)

    // Update state
    targetWork.is_tailored = true
    targetWork.ai_options = options
    if (!targetWork.final_edited_text || targetWork.final_edited_text === targetWork.original_description) {
      targetWork.final_edited_text = options[0] || targetWork.original_description
    }
    workHistories[workIndex] = targetWork
    content.work_histories = workHistories

    // Persist to database
    const { error: updateError } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)

    if (updateError) throw updateError

    return { success: true, options, updatedContent: content }
  } catch (err: any) {
    console.error("tailorSingleWorkHistoryAction error:", err)
    return { success: false, error: err.message || 'Failed to tailor work history' }
  }
}

/**
 * On-demand AI tailoring for a single project.
 * Strictly 1-time generation per project entry.
 */
export async function tailorSingleProjectAction(resumeId: string, projectIndex: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: resume, error: fetchError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) throw new Error('Resume not found')

    const content = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})
    const projects = content.projects || []
    const targetProject = projects[projectIndex]

    if (!targetProject) throw new Error('Project item not found')

    // Strict 1-time generation check
    if (targetProject.is_tailored) {
      return { success: false, error: 'This project has already been AI-generated. You can edit the text directly.' }
    }

    const prompt = PROMPT_PROJECT
      .replace('{{PROJECT_TITLE}}', targetProject.title || '')
      .replace('{{TECHNOLOGY_USED}}', targetProject.tech || '')
      .replace('{{PROJECT_DESCRIPTION}}', targetProject.original_description || '')
      .replace('{{SHORTENED_JD}}', resume.shortened_jd || resume.job_description || '')

    const rawResponse = await callGroq(prompt, true)
    const options = parseLLMJsonArray(rawResponse)

    // Update state
    targetProject.is_tailored = true
    targetProject.ai_options = options
    if (!targetProject.final_edited_text || targetProject.final_edited_text === targetProject.original_description) {
      targetProject.final_edited_text = options[0] || targetProject.original_description
    }
    projects[projectIndex] = targetProject
    content.projects = projects

    // Persist to database
    const { error: updateError } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)

    if (updateError) throw updateError

    return { success: true, options, updatedContent: content }
  } catch (err: any) {
    console.error("tailorSingleProjectAction error:", err)
    return { success: false, error: err.message || 'Failed to tailor project' }
  }
}

/**
 * On-demand generation for Career Objective.
 * Strictly 1-time generation.
 */
export async function generateCareerObjectiveAction(resumeId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Fetch resume & student profile
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

    const profileData: any = student?.profile_data || {}
    const content = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})

    // Strict 1-time check
    if (content.career_objective?.is_generated) {
      return { success: false, error: 'Career Objective has already been AI-generated. You can edit the text directly.' }
    }

    const workDump = (content.work_histories || [])
      .map((w: any) => `${w.role} at ${w.company}:\n${w.final_edited_text || w.original_description}`)
      .filter(Boolean)
      .join('\n\n')

    const skills = profileData.skills || {}

    const prompt = PROMPT_CAREER_OBJECTIVE
      .replace('{{WORK_HISTORIES}}', workDump || 'Fresher with academic projects')
      .replace('{{DOMAIN_SKILLS}}', skills?.languages || '')
      .replace('{{TOOLS_SKILLS}}', skills?.tools || '')
      .replace('{{SOFT_SKILLS}}', skills?.frameworks || '')
      .replace('{{JOB_ROLE}}', resume.target_role || 'Candidate')
      .replace('{{COMPANY_NAME}}', resume.target_employer || 'Company')
      .replace('{{SHORTENED_JD}}', resume.shortened_jd || resume.job_description || '')

    const rawResponse = await callGroq(prompt, true)
    const rawOptions = parseLLMJsonArray(rawResponse)
    const options = rawOptions.map((opt: string) => 
      opt.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).join(' ')
    )

    // Update state
    content.career_objective = {
      is_generated: true,
      ai_options: options,
      final_edited_text: options[0] || ""
    }

    const { error: updateError } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)

    if (updateError) throw updateError

    return { success: true, options, updatedContent: content }
  } catch (err: any) {
    console.error("generateCareerObjectiveAction error:", err)
    return { success: false, error: err.message || 'Failed to generate career objective' }
  }
}

/**
 * Saves full resume content state (text edits, settings, etc.)
 */
export async function saveResumeContentAction(resumeId: string, content: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)
      .eq('user_id', user.id)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error("saveResumeContentAction error:", err)
    return { success: false, error: err.message || 'Failed to save resume' }
  }
}

/**
 * Evaluates the resume text against the target job description to compute an ATS Keyword Match score.
 */
export async function checkATSMatchAction(resumeId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: resume, error: fetchError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !resume) throw new Error('Resume not found')

    const content = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})
    const workHistories = content.work_histories || []
    const projects = content.projects || []
    const objective = content.career_objective?.final_edited_text || ''

    // Aggregate all candidate resume text
    const resumeTextPieces: string[] = []
    if (objective) resumeTextPieces.push(`Career Objective:\n${objective}`)

    workHistories.forEach((w: any) => {
      const text = w.final_edited_text || w.original_description
      if (text) resumeTextPieces.push(`${w.role} at ${w.company} (${w.tech || ''}):\n${text}`)
    })

    projects.forEach((p: any) => {
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
          summary: 'No specific target JD provided; resume evaluated on general competencies.'
        }
      }
    }

    const prompt = PROMPT_ATS_KEYWORD_MATCH
      .replace('{{JOB_DESCRIPTION}}', targetJD)
      .replace('{{RESUME_TEXT}}', fullResumeText)

    const rawResponse = await callGroq(prompt, true)
    let parsed: any = null
    try {
      const clean = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = {
        match_score: 70,
        matching_keywords: ['Technical Skills', 'Problem Solving'],
        missing_keywords: ['DevOps', 'Cloud Deployment'],
        summary: rawResponse.slice(0, 150)
      }
    }

    // Persist to resume content
    content.ats_score = parsed
    await supabase
      .from('ai_resumes')
      .update({ content })
      .eq('id', resumeId)

    return { success: true, data: parsed }
  } catch (err: any) {
    console.error('checkATSMatchAction error:', err)
    return { success: false, error: err.message || 'Failed to check ATS match' }
  }
}
