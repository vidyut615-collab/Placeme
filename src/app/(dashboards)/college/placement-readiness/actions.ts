'use server'

import { createClient } from '@/utils/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function callGroq(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    max_tokens: 2048,
  })
  return completion.choices[0]?.message?.content || ''
}

export interface JobInput {
  title: string
  company?: string
  description: string
}

export async function runBatchReadinessAnalysisAction(formData: {
  mode: 'single_job' | 'pool'
  jobs: JobInput[]
  batchYear?: number
  department?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const collegeId = user.app_metadata?.college_id || (
      await supabase.from('users').select('college_id').eq('id', user.id).single()
    ).data?.college_id

    if (!collegeId) throw new Error('College affiliation not found')

    if (!formData.jobs || formData.jobs.length === 0 || !formData.jobs[0].description.trim()) {
      throw new Error('Please provide at least one job description to analyze.')
    }

    // 1. Extract required skills using LLM
    const jobsSummary = formData.jobs
      .map((j, i) => `Job #${i + 1} (${j.title} at ${j.company || 'Company'}):\n${j.description}`)
      .join('\n\n---\n\n')

    const extractPrompt = `You are a placement intelligence analyst.
Analyze the following ${formData.jobs.length} target job description(s).
Extract the most critical 8 to 15 hard skills, technologies, frameworks, and tools required across these roles.

Format your output STRICTLY as valid JSON:
{
  "skills": [
    { "name": "React.js", "frequency": 1, "importance": "high" },
    { "name": "Node.js", "frequency": 1, "importance": "high" },
    { "name": "SQL", "frequency": 1, "importance": "medium" }
  ]
}

[Job Descriptions]
${jobsSummary}`

    const rawSkills = await callGroq(extractPrompt)
    let extractedSkills: Array<{ name: string; frequency?: number; importance?: string }> = []
    try {
      const clean = rawSkills.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      extractedSkills = Array.isArray(parsed.skills) ? parsed.skills : []
    } catch {
      extractedSkills = [
        { name: 'JavaScript', frequency: 1, importance: 'high' },
        { name: 'Python', frequency: 1, importance: 'high' },
        { name: 'SQL', frequency: 1, importance: 'medium' },
        { name: 'Git', frequency: 1, importance: 'medium' },
        { name: 'REST APIs', frequency: 1, importance: 'high' },
      ]
    }

    if (extractedSkills.length === 0) {
      extractedSkills = [
        { name: 'Core Programming', frequency: 1, importance: 'high' },
        { name: 'Database Management', frequency: 1, importance: 'medium' },
        { name: 'Data Structures', frequency: 1, importance: 'high' },
      ]
    }

    // 2. Fetch students belonging to this college
    const { data: students, error: studentErr } = await supabase
      .from('students')
      .select('id, profile_data')
      .eq('college_id', collegeId)

    if (studentErr || !students || students.length === 0) {
      throw new Error('No students found in your institution to analyze.')
    }

    // 3. Filter students by batch year & department if specified
    const filteredStudents = students.filter((s: any) => {
      const prof = s.profile_data || {}
      if (formData.batchYear) {
        const yr = prof.academics?.graduation_year || prof.academic_year
        if (yr && Number(yr) !== Number(formData.batchYear)) return false
      }
      if (formData.department && formData.department !== 'all') {
        const dept = (prof.academics?.department || prof.department || '').toLowerCase()
        if (!dept.includes(formData.department.toLowerCase())) return false
      }
      return true
    })

    const batchSize = filteredStudents.length > 0 ? filteredStudents.length : students.length
    const poolToAnalyze = filteredStudents.length > 0 ? filteredStudents : students

    // 4. Calculate skill coverage heatmap
    const skillCounts: Record<string, number> = {}
    extractedSkills.forEach((s) => {
      skillCounts[s.name] = 0
    })

    let readyCount = 0
    let totalScoreSum = 0

    poolToAnalyze.forEach((student: any) => {
      const prof = student.profile_data || {}
      const studentSkillsText = [
        prof.skills?.languages || '',
        prof.skills?.tools || '',
        prof.skills?.frameworks || '',
        JSON.stringify(prof.projects || []),
        JSON.stringify(prof.experience || []),
      ]
        .join(' ')
        .toLowerCase()

      let studentMatchCount = 0

      extractedSkills.forEach((skill) => {
        if (studentSkillsText.includes(skill.name.toLowerCase())) {
          skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1
          studentMatchCount++
        }
      })

      const score = Math.round((studentMatchCount / extractedSkills.length) * 100)
      totalScoreSum += score
      if (score >= 65) {
        readyCount++
      }
    })

    const avgMatchScore = Number((totalScoreSum / batchSize).toFixed(1))

    const heatmap = extractedSkills.map((s) => {
      const haveCount = skillCounts[s.name] || 0
      const missingCount = Math.max(0, batchSize - haveCount)
      const coveragePct = Math.round((haveCount / batchSize) * 100)
      return {
        skill: s.name,
        haveCount,
        missingCount,
        coveragePct,
        frequency: s.frequency || 1,
        priority: coveragePct < 30 ? 'CRITICAL' : coveragePct < 60 ? 'HIGH' : 'HEALTHY',
      }
    })

    heatmap.sort((a, b) => a.coveragePct - b.coveragePct)

    // 5. Generate high-impact workshop recommendations
    const missingSkillsTop = heatmap
      .filter((h) => h.coveragePct < 50)
      .slice(0, 3)
      .map((h) => h.skill)

    const workshopPrompt = `Based on a college batch analysis where students lack: ${missingSkillsTop.join(', ')}.
Target role context: ${formData.jobs.map((j) => j.title).join(', ')}.
Suggest 3 concise, high-impact training workshops the Training & Placement Officer (TPO) should organize.
Format as JSON:
{
  "workshops": [
    { "topic": "Docker & Containerization Bootcamp", "duration": "3-Day Intensive", "potential_uplift_pct": "40%" },
    { "topic": "Relational Database & SQL Indexing Masterclass", "duration": "2-Day Weekend", "potential_uplift_pct": "35%" }
  ]
}`

    const rawWorkshops = await callGroq(workshopPrompt)
    let workshops = []
    try {
      const clean = rawWorkshops.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      workshops = parsed.workshops || []
    } catch {
      workshops = missingSkillsTop.map((s) => ({
        topic: `${s} Practical Training Program`,
        duration: '2-Day Bootcamp',
        potential_uplift_pct: '35%',
      }))
    }

    // 6. Save Report to Database
    const { data: savedReport, error: saveErr } = await supabase
      .from('tpo_readiness_reports')
      .insert({
        college_id: collegeId,
        created_by: user.id,
        report_mode: formData.mode,
        target_batch_year: formData.batchYear || new Date().getFullYear() + 1,
        target_branches: formData.department ? [formData.department] : ['All Branches'],
        analyzed_jobs: formData.jobs,
        batch_size: batchSize,
        ready_count: readyCount,
        avg_match_score: avgMatchScore,
        skill_coverage_heatmap: heatmap,
        recommended_workshops: workshops,
      })
      .select('*')
      .single()

    if (saveErr) throw saveErr

    return {
      success: true,
      report: savedReport,
    }
  } catch (err: any) {
    console.error('runBatchReadinessAnalysisAction error:', err)
    return { success: false, error: err.message || 'Failed to generate readiness report' }
  }
}
