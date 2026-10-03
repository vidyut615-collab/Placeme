'use server'

import { createClient } from '@/utils/supabase/server'
import Groq from 'groq-sdk'
import { PROMPT_SHORTEN_JD, PROMPT_WORK_HISTORY, PROMPT_PROJECT, PROMPT_CAREER_OBJECTIVE } from './prompts'

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
      // Check if it's the new {"options": [...]} format
      if (parsed && Array.isArray(parsed.options)) return parsed.options
      if (Array.isArray(parsed)) return parsed
    } catch (e) {
      // Smart Fallback: Extract everything between quotes if JSON fails (e.g. truncated JSON)
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

export async function createAIResume(formData: { title: string, employer: string, role: string, jd: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Verify credits again on the server
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
    const skills = profileData.skills || {}

    // 3. AI PIPELINE: Step A - Shorten JD
    const shortenPrompt = PROMPT_SHORTEN_JD.replace('{{JOB_DESCRIPTION}}', formData.jd)
    const shortenedJd = await callGroq(shortenPrompt)

    // AI PIPELINE: Step B - Work Histories (Sequential to avoid 429 TPM rate limits)
    const generatedWorkHistories = []
    for (let i = 0; i < experience.length; i++) {
      const w = experience[i]
      const prompt = PROMPT_WORK_HISTORY
        .replace('{{JOB_TITLE}}', w.role || '')
        .replace('{{COMPANY_NAME}}', w.company || '')
        .replace('{{TECHNOLOGY_USED}}', w.tech || '')
        .replace('{{SHORTENED_JD}}', shortenedJd)

      
      const res = await callGroq(prompt, true)
      const options = parseLLMJsonArray(res)
      
      generatedWorkHistories.push({
        profile_work_id: `work_${i}`,
        ai_options: options,
        selected_option: null,
        final_edited_text: ""
      })
    }

    // AI PIPELINE: Step C - Projects (Sequential)
    const generatedProjects = []
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i]
      const prompt = PROMPT_PROJECT
        .replace('{{PROJECT_TITLE}}', p.title || '')
        .replace('{{TECHNOLOGY_USED}}', p.tech || '')
        .replace('{{PROJECT_DESCRIPTION}}', p.description || '')
        .replace('{{SHORTENED_JD}}', shortenedJd)
      
      const res = await callGroq(prompt, true)
      const options = parseLLMJsonArray(res)

      generatedProjects.push({
        profile_project_id: `proj_${i}`,
        ai_options: options,
        selected_option: null,
        final_edited_text: ""
      })
    }

    const initialContent = {
      work_histories: generatedWorkHistories,
      projects: generatedProjects,
      career_objective: {
        is_generated: false,
        ai_options: [],
        final_edited_text: ""
      }
    }

    // 4. Deduct Credits
    await supabase
      .from('students')
      .update({ credit_balance: student.credit_balance - AI_RESUME_CREDIT_COST })
      .eq('user_id', user.id)

    // 5. Log the deduction
    await supabase.from('credit_ledgers').insert({
      user_id: user.id,
      amount: -AI_RESUME_CREDIT_COST,
      description: `AI Resume Generation: ${formData.role} at ${formData.employer}`
    })

    // 6. Create the Resume Record
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



export async function generateCareerObjectiveAction(workHistoryDump: string, skills: any, jobRole: string, employer: string, jdText: string) {
  try {
    const shortenPrompt = PROMPT_SHORTEN_JD.replace('{{JOB_DESCRIPTION}}', jdText)
    const shortenedJd = await callGroq(shortenPrompt)

    const objectivePrompt = PROMPT_CAREER_OBJECTIVE
      .replace('{{WORK_HISTORIES}}', workHistoryDump || 'Fresher')
      .replace('{{DOMAIN_SKILLS}}', skills?.languages || '')
      .replace('{{TOOLS_SKILLS}}', skills?.tools || '')
      .replace('{{SOFT_SKILLS}}', skills?.frameworks || '')
      .replace('{{JOB_ROLE}}', jobRole)
      .replace('{{COMPANY_NAME}}', employer)
      .replace('{{SHORTENED_JD}}', shortenedJd)

    const objRes = await callGroq(objectivePrompt, true)
    const objOptions = parseLLMJsonArray(objRes)
    return { options: objOptions }
  } catch (err: any) {
    console.error(err)
    return { error: err.message || 'Failed to generate career objective' }
  }
}
