'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import Groq from 'groq-sdk'
import Razorpay from 'razorpay'

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not configured in the server environment.')
    return ''
  }
  try {
    const groq = new Groq({ apiKey })
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      temperature: 0.3,
      max_tokens: 3000,
    })
    return completion.choices[0]?.message?.content || ''
  } catch (err: any) {
    console.error('Groq API call error:', err)
    return ''
  }
}

export interface JobInput {
  title: string
  company?: string
  description: string
}

export interface SkillTaxonomyItem {
  name: string
  layer: 'hard' | 'tooling' | 'process' | 'soft'
  importance: 'critical' | 'high' | 'medium'
  typical_study_hours?: number
}

export interface HeatmapItem {
  skill: string
  layer: 'hard' | 'tooling' | 'process' | 'soft'
  haveCount: number
  missingCount: number
  coveragePct: number
  priority: 'CRITICAL' | 'HIGH' | 'HEALTHY'
  typical_study_hours: number
}

export interface StudentTierItem {
  id: string
  name: string
  department?: string
  score: number
  matchedCount: number
  missingCount: number
  missing_skills: string[]
}

export interface CohortTier {
  tier: string
  label: string
  minScore: number
  maxScore: number
  count: number
  percentage: number
  badgeColor: string
  description: string
  action_plan: string
  students: StudentTierItem[]
}

export interface RoadmapStep {
  step: number
  title: string
  layer: string
  prerequisites: string
  duration_hours: number
  week_or_day_breakdown?: string
  key_topics: string
  hands_on_lab?: string
  capstone_deliverable?: string
  faculty_guidance?: string
  curated_resources: string
  expected_uplift: string
}

export interface InterviewQuestion {
  question: string
  category: 'Technical Depth' | 'System & Tooling' | 'Behavioral / STAR'
  job_title?: string
  ideal_answer_framework: string
  evaluator_focus: string
}

export interface CapstoneProjectSpec {
  title: string
  target_deficit: string
  problem_statement: string
  core_stack: string
  key_deliverables: string[]
  submission_timeline: string
}

export interface LearningRoadmapData {
  steps: RoadmapStep[]
  total_hours: number
  recruiter_talking_points: string[]
  interview_question_bank?: InterviewQuestion[]
  ready_capstone_project?: CapstoneProjectSpec
  top_missing_skills?: string[]
  top_missing_ats_keywords?: string[]
}

function calculateRequiredCredits(batchSize: number, mode: 'single_job' | 'pool'): {
  credits: number
  tierLabel: string
} {
  const isPool = mode === 'pool'
  if (batchSize <= 75) {
    return {
      credits: isPool ? 50 : 30,
      tierLabel: 'Class / Branch (Up to 75 Students)',
    }
  } else if (batchSize <= 250) {
    return {
      credits: isPool ? 100 : 60,
      tierLabel: 'Department / Dual Branch (76 – 250 Students)',
    }
  } else if (batchSize <= 600) {
    return {
      credits: isPool ? 160 : 100,
      tierLabel: 'Multi-Branch / Mid-Campus (251 – 600 Students)',
    }
  } else if (batchSize <= 1000) {
    return {
      credits: isPool ? 220 : 140,
      tierLabel: 'Large College / Multi-Stream (601 – 1,000 Students)',
    }
  } else {
    // 1,001 - 2,000 students (University Max Cap)
    return {
      credits: isPool ? 280 : 180,
      tierLabel: 'Mega University / Institutional Campus [Max Cap]',
    }
  }
}

export async function runBatchReadinessAnalysisAction(formData: {
  mode: 'single_job' | 'pool'
  jobs: JobInput[]
  years?: string[]
  degrees?: string[]
  departments?: string[]
}) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let collegeId = user.app_metadata?.college_id
    if (!collegeId) {
      const { data: userRow } = await adminDb
        .from('users')
        .select('college_id')
        .eq('id', user.id)
        .maybeSingle()
      collegeId = userRow?.college_id
    }

    if (!collegeId) throw new Error('College affiliation not found')

    if (!formData.jobs || formData.jobs.length === 0 || !formData.jobs[0].description.trim()) {
      throw new Error('Please provide at least one job description to analyze.')
    }

    // 0. Fetch college credit balance
    const { data: collegeRow } = await adminDb
      .from('colleges')
      .select('credit_balance')
      .eq('id', collegeId)
      .maybeSingle()

    const currentBalance = collegeRow?.credit_balance ?? 500

    // Fetch students belonging to this college
    const { data: students, error: studentErr } = await adminDb
      .from('students')
      .select('id, profile_data')
      .eq('college_id', collegeId)

    if (studentErr || !students || students.length === 0) {
      throw new Error('No students found in your institution to analyze.')
    }

    // Filter students by selected passing years, degrees, and departments
    const filteredStudents = students.filter((s: any) => {
      const prof = s.profile_data || {}

      // Year filter
      if (formData.years && formData.years.length > 0 && !formData.years.includes('all')) {
        const sYear = String(prof.year || prof.academic_year || prof.graduation_year || prof.academics?.graduation_year || '').trim()
        if (sYear && !formData.years.includes(sYear)) return false
      }

      // Degree filter
      if (formData.degrees && formData.degrees.length > 0 && !formData.degrees.includes('all')) {
        const sDegree = String(prof.type || prof.degree || prof.academics?.degree || '').toLowerCase().trim()
        const match = formData.degrees.some((d) => sDegree.includes(d.toLowerCase().trim()))
        if (!match) return false
      }

      // Department filter
      if (formData.departments && formData.departments.length > 0 && !formData.departments.includes('all')) {
        const sDept = String(prof.department || prof.branch || prof.academics?.department || '').toLowerCase().trim()
        const isMatch = formData.departments.some((d) => {
          const filterVal = d.toLowerCase().trim()
          return (
            sDept.includes(filterVal) ||
            (filterVal === 'cmpn' && (sDept.includes('computer') || sDept.includes('cmpn') || sDept.includes('cs'))) ||
            (filterVal === 'it' && (sDept.includes('information') || sDept.includes('it'))) ||
            (filterVal === 'mech' && (sDept.includes('mechanical') || sDept.includes('mech'))) ||
            (filterVal === 'civil' && sDept.includes('civil'))
          )
        })
        if (!isMatch) return false
      }

      return true
    })

    const poolToAnalyze = filteredStudents.length > 0 ? filteredStudents : students
    const batchSize = poolToAnalyze.length

    // Credit validation
    const { credits: requiredCredits } = calculateRequiredCredits(batchSize, formData.mode)
    if (currentBalance < requiredCredits) {
      throw new Error(`Insufficient institutional credits. This analysis requires ${requiredCredits} credits, but your college balance is ${currentBalance} credits. Please top up your credits to proceed.`)
    }

    // Deduct credits
    const updatedBalance = Math.max(0, currentBalance - requiredCredits)
    await adminDb
      .from('colleges')
      .update({ credit_balance: updatedBalance })
      .eq('id', collegeId)

    // 1. Multi-Layer Domain-Agnostic Taxonomy Extraction (Pass 1)
    const jobsSummary = formData.jobs
      .map((j, i) => `Job #${i + 1} (${j.title} at ${j.company || 'Visiting Recruiter'}):\n${j.description}`)
      .join('\n\n---\n\n')

    const extractPrompt = `You are a Senior Campus Placement Intelligence Analyst.
Analyze the target job description(s) across ANY college domain (Engineering, IT, Commerce, BBA, Finance, Marketing, Operations, Arts, or Science).
Extract 10 to 14 core skills, tools, workflows, and standards demanded by the employer.

CRITICAL NAMING RULE:
Each skill "name" MUST be a CONCISE, 1-to-3 word standard industry term (e.g. "OOP", "Microservices", "Docker", "Kubernetes", "Spring Boot", "REST APIs", "SQL", "Git", "Agile", "Prompt Engineering", "Problem Solving", "Java", "Python", "React", "Financial Modeling", "TallyPrime", "Data Analysis").
NEVER output long sentences, compound phrases with parentheses, or fluff words like "principles", "concepts", "basics", "intensive", or "practices".

Categorize each into one of these 4 distinct layers:
1. "hard": Core functional, technical, or analytical domain knowledge (e.g. OOP, Microservices, Python, React, Financial Modeling).
2. "tooling": Software, tools, ERPs, and platforms (e.g. Docker, Kubernetes, Git, SQL, Postman, PowerBI).
3. "process": Industry workflows, architecture, compliance, and standards (e.g. Agile, CI/CD, Code Review, Ind AS, REST APIs).
4. "soft": Client communication, presentation, problem solving, or behavioral skills (e.g. Problem Solving, Communication, Analytical Thinking).

Format strictly as JSON:
{
  "skills": [
    {
      "name": "Docker",
      "layer": "tooling",
      "importance": "critical",
      "typical_study_hours": 15
    },
    {
      "name": "OOP",
      "layer": "hard",
      "importance": "critical",
      "typical_study_hours": 20
    }
  ]
}

[Job Descriptions]
${jobsSummary}`

    const rawSkills = await callGroq(extractPrompt)
    let extractedSkills: SkillTaxonomyItem[] = []
    try {
      const clean = rawSkills.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      extractedSkills = Array.isArray(parsed.skills) ? parsed.skills : []
    } catch {
      // Sensible domain fallbacks
      extractedSkills = [
        { name: 'Core Domain Knowledge', layer: 'hard', importance: 'critical', typical_study_hours: 20 },
        { name: 'Problem Solving & Analytics', layer: 'hard', importance: 'high', typical_study_hours: 15 },
        { name: 'Advanced Excel & Documentation', layer: 'tooling', importance: 'critical', typical_study_hours: 12 },
        { name: 'Industry Software & Tools', layer: 'tooling', importance: 'high', typical_study_hours: 15 },
        { name: 'Workflow & Quality Standards', layer: 'process', importance: 'medium', typical_study_hours: 10 },
        { name: 'Professional Communication', layer: 'soft', importance: 'high', typical_study_hours: 8 },
      ]
    }

    if (extractedSkills.length === 0) {
      extractedSkills = [
        { name: 'Core Domain Knowledge', layer: 'hard', importance: 'critical', typical_study_hours: 20 },
        { name: 'Tooling & Software', layer: 'tooling', importance: 'high', typical_study_hours: 15 },
        { name: 'Process & Workflows', layer: 'process', importance: 'medium', typical_study_hours: 10 },
      ]
    }

    // Helper function for intelligent alias matching against student resumes & projects
    function getSkillSearchTerms(skillName: string): string[] {
      const s = skillName.toLowerCase().trim()
      const terms = [s]

      const cleaned = s.replace(/[()[\],/\\-]/g, ' ').replace(/\s+/g, ' ').trim()
      if (cleaned && cleaned !== s) terms.push(cleaned)

      if (s.includes('oop') || s.includes('object-oriented') || s.includes('object oriented')) {
        terms.push('oop', 'object oriented', 'object-oriented', 'classes', 'polymorphism', 'inheritance', 'encapsulation', 'java', 'c++')
      }
      if (s.includes('microservice')) {
        terms.push('microservice', 'microservices', 'distributed system')
      }
      if (s.includes('docker') || s.includes('container')) {
        terms.push('docker', 'container', 'containerization', 'dockerfile', 'containers')
      }
      if (s.includes('kubernetes') || s.includes('k8s')) {
        terms.push('kubernetes', 'k8s', 'kubectl')
      }
      if (s.includes('agile') || s.includes('scrum') || s.includes('kanban')) {
        terms.push('agile', 'scrum', 'kanban', 'sprint')
      }
      if (s.includes('prompt') || s.includes('llm') || s.includes('genai')) {
        terms.push('prompt', 'llm', 'llms', 'chatgpt', 'openai', 'gemini', 'copilot', 'genai', 'langchain')
      }
      if (s.includes('rest') || s.includes('api')) {
        terms.push('rest', 'api', 'apis', 'restful', 'endpoints', 'postman')
      }
      if (s.includes('sql') || s.includes('database') || s.includes('relational')) {
        terms.push('sql', 'mysql', 'postgresql', 'postgres', 'database', 'sqlite', 'oracle', 'rdbms')
      }
      if (s.includes('git') || s.includes('version control')) {
        terms.push('git', 'github', 'gitlab', 'version control')
      }
      if (s.includes('problem solving') || s.includes('dsa') || s.includes('algorithm')) {
        terms.push('problem solving', 'dsa', 'data structures', 'algorithm', 'algorithms', 'leetcode', 'hackerrank', 'codeforces')
      }
      if (s.includes('spring')) {
        terms.push('spring', 'spring boot', 'springboot')
      }
      if (s.includes('react')) {
        terms.push('react', 'react.js', 'reactjs')
      }
      if (s.includes('node')) {
        terms.push('node', 'node.js', 'nodejs', 'express')
      }
      if (s.includes('excel')) {
        terms.push('excel', 'vlookup', 'pivot', 'spreadsheet', 'sheets')
      }
      if (s.includes('tally')) {
        terms.push('tally', 'tallyprime', 'erp')
      }
      if (s.includes('cloud') || s.includes('aws') || s.includes('azure') || s.includes('gcp')) {
        terms.push('aws', 'azure', 'gcp', 'cloud', 's3', 'ec2')
      }

      const stopWords = new Set(['and', 'the', 'for', 'with', 'tools', 'skills', 'concepts', 'basics', 'principles', 'level', 'practices'])
      cleaned.split(' ').forEach((w) => {
        if (w.length >= 3 && !stopWords.has(w)) terms.push(w)
      })

      return Array.from(new Set(terms))
    }

    const skillCounts: Record<string, number> = {}
    extractedSkills.forEach((s) => {
      skillCounts[s.name] = 0
    })

    const evaluatedStudents: StudentTierItem[] = []
    let totalScoreSum = 0

    poolToAnalyze.forEach((student: any) => {
      const prof = student.profile_data || {}
      const studentName = prof.full_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'Student'
      const studentDept = prof.department || prof.branch || prof.academics?.department || 'General'

      const studentSkillsText = [
        prof.skills?.languages || '',
        prof.skills?.tools || '',
        prof.skills?.frameworks || '',
        typeof prof.skills === 'string' ? prof.skills : '',
        JSON.stringify(prof.skills || {}),
        JSON.stringify(prof.projects || []),
        JSON.stringify(prof.experience || []),
        JSON.stringify(prof.education || []),
        JSON.stringify(prof.activities || []),
        JSON.stringify(prof.recognitions || []),
      ]
        .join(' ')
        .toLowerCase()

      let rawSkillScore = 0
      let totalSkillWeight = 0
      let matchedCount = 0
      const missingSkills: string[] = []

      extractedSkills.forEach((skill) => {
        const layerWeight =
          skill.layer === 'hard' ? 1.4 :
          skill.layer === 'tooling' ? 1.2 :
          skill.layer === 'process' ? 1.0 : 0.8

        totalSkillWeight += layerWeight

        const searchTerms = getSkillSearchTerms(skill.name)
        let hasMatch = false
        for (const term of searchTerms) {
          if (studentSkillsText.includes(term)) {
            hasMatch = true
            break
          }
        }

        if (hasMatch) {
          skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1
          matchedCount++
          rawSkillScore += layerWeight
        } else {
          missingSkills.push(skill.name)
        }
      })

      // Multi-factor balanced scoring model
      // 1. Skill coverage ratio (0 to 65 points)
      const skillRatio = totalSkillWeight > 0 ? (rawSkillScore / totalSkillWeight) * 65 : 30

      // 2. Practical project depth (0 to 15 points)
      const projectsCount = Array.isArray(prof.projects) ? prof.projects.length : (prof.projects ? 1 : 0)
      const projectBonus = Math.min(15, projectsCount * 5)

      // 3. Internship & professional experience (0 to 10 points)
      const experiencesCount = Array.isArray(prof.experience) ? prof.experience.length : (prof.experience ? 1 : 0)
      const internBonus = Math.min(10, experiencesCount * 5)

      // 4. Academic performance & competitive coding / awards (0 to 10 points)
      const cgpaStr = String(prof.academics?.cgpa || prof.cgpa || prof.gpa || '7.5')
      const parsedCgpa = parseFloat(cgpaStr) || 7.5
      const academicBaseline = Math.min(6, Math.max(2, (parsedCgpa - 5.0) * 1.5))
      const awardsCount = Array.isArray(prof.recognitions) ? prof.recognitions.length : (prof.recognitions ? 1 : 0)
      const recognitionBonus = Math.min(4, awardsCount * 2)

      // Deterministic small student variance (-3 to +3)
      let hash = 0
      const idStr = String(student.id || studentName)
      for (let i = 0; i < idStr.length; i++) {
        hash = (hash << 5) - hash + idStr.charCodeAt(i)
        hash |= 0
      }
      const variance = (Math.abs(hash) % 7) - 3

      let finalScore = Math.round(skillRatio + projectBonus + internBonus + academicBaseline + recognitionBonus + variance)
      finalScore = Math.max(25, Math.min(96, finalScore))
      totalScoreSum += finalScore

      evaluatedStudents.push({
        id: student.id,
        name: studentName,
        department: studentDept,
        score: finalScore,
        matchedCount,
        missingCount: missingSkills.length,
        missing_skills: missingSkills,
      })
    })

    // Sort evaluated students by match score descending
    evaluatedStudents.sort((a, b) => b.score - a.score)

    const avgMatchScore = Number((totalScoreSum / batchSize).toFixed(1))

    // 5. Construct 4-Layer Heatmap with priority and hours
    const heatmap: HeatmapItem[] = extractedSkills.map((s) => {
      const haveCount = skillCounts[s.name] || 0
      const missingCount = Math.max(0, batchSize - haveCount)
      const coveragePct = Math.round((haveCount / batchSize) * 100)
      return {
        skill: s.name,
        layer: s.layer,
        haveCount,
        missingCount,
        coveragePct,
        typical_study_hours: s.typical_study_hours || 15,
        priority: coveragePct < 35 ? 'CRITICAL' : coveragePct < 65 ? 'HIGH' : 'HEALTHY',
      }
    })

    // Sort heatmap by lowest coverage first (highest deficit)
    heatmap.sort((a, b) => a.coveragePct - b.coveragePct)

    // 6. Segment into 4-Tier Student Cohort Model
    const tier1Students = evaluatedStudents.filter((s) => s.score >= 75)
    const tier2Students = evaluatedStudents.filter((s) => s.score >= 60 && s.score < 75)
    const tier3Students = evaluatedStudents.filter((s) => s.score >= 45 && s.score < 60)
    const tier4Students = evaluatedStudents.filter((s) => s.score < 45)

    const cohortTiers: CohortTier[] = [
      {
        tier: 'tier_1',
        label: 'Tier 1: Marquee / Day-1 Ready',
        minScore: 75,
        maxScore: 100,
        count: tier1Students.length,
        percentage: Math.round((tier1Students.length / batchSize) * 100),
        badgeColor: 'emerald',
        description: 'Candidates who exceed technical & domain screening; ready for high-package Day-1 shortlists.',
        action_plan: 'Fast-track for immediate corporate shortlisting, high-value technical interviews, and executive briefing.',
        students: tier1Students,
      },
      {
        tier: 'tier_2',
        label: 'Tier 2: Core Placement Qualified',
        minScore: 60,
        maxScore: 74,
        count: tier2Students.length,
        percentage: Math.round((tier2Students.length / batchSize) * 100),
        badgeColor: 'blue',
        description: 'Strong candidates clearing primary technical criteria; ready with minimal mock polish.',
        action_plan: 'Schedule 2-3 company-specific mock interview sessions and culture briefing prior to campus recruitment.',
        students: tier2Students,
      },
      {
        tier: 'tier_3',
        label: 'Tier 3: Quick-Win Bootcamp Cohort',
        minScore: 45,
        maxScore: 59,
        count: tier3Students.length,
        percentage: Math.round((tier3Students.length / batchSize) * 100),
        badgeColor: 'amber',
        description: 'High-potential candidates missing 1–2 specific tooling, cloud, or process frameworks.',
        action_plan: 'Enroll in high-ROI 3–5 day intensive bootcamps to elevate candidates into Tier 1/2 before recruitment day.',
        students: tier3Students,
      },
      {
        tier: 'tier_4',
        label: 'Tier 4: Foundational Intervention Track',
        minScore: 0,
        maxScore: 44,
        count: tier4Students.length,
        percentage: Math.round((tier4Students.length / batchSize) * 100),
        badgeColor: 'rose',
        description: 'Students requiring fundamental domain training, structured project building, and resume reconstruction.',
        action_plan: 'Assign mentor-led capstone project tracks, coding fundamentals, and portfolio reconstruction.',
        students: tier4Students,
      },
    ]

    const readyCount = tier1Students.length + tier2Students.length

    // 7. Synthesize In-Depth Upskilling Roadmap, 10 Interview Questions, and Top Missing Skills
    const criticalGaps = heatmap.filter((h) => h.coveragePct < 60).slice(0, 6)
    const topDeficitSkill = criticalGaps[0]?.skill || extractedSkills[0]?.name || 'Modern Core Stack'
    const jobsList = formData.jobs

    const roadmapPrompt = `You are a Senior Corporate Placement Director designing an institutional upskilling curriculum and pre-interview preparation package for a college Training & Placement Officer (TPO).
Target Roles: ${jobsList.map((j) => `${j.title} at ${j.company || 'Visiting Recruiter'}`).join(', ')}
Batch Size: ${batchSize} students.
Placement Ready (>=60%): ${readyCount} students (${Math.round((readyCount / batchSize) * 100)}%).
Key Batch Deficits: ${criticalGaps.map((g) => `${g.skill} [${g.layer.toUpperCase()}, ${g.coveragePct}% coverage]`).join(', ')}.

Return a comprehensive JSON with:
1. "roadmap": 3 to 4 sequenced modular steps presented as a chronological roadmap. Include timeline schedule, key topics, hands-on lab, deliverable, and faculty notes. DO NOT use emojis. Keep language professional and institutional.
2. "recruiter_talking_points": 2 to 3 high-impact executive soundbites for the TPO to pitch to visiting corporate HR.
3. "workshops": 2 targeted high-ROI bootcamps for student intervention.
4. "interview_question_bank": EXACTLY 10 relevant company-specific technical & behavioral interview questions tailored to the target role(s). If multiple jobs were analyzed (${jobsList.map((j) => j.title).join(', ')}), distribute the questions across the analyzed roles (e.g. 5 questions for each job or a balanced mix). Include:
   - "question": The exact interview question
   - "category": 'Technical Depth' | 'System & Tooling' | 'Behavioral / STAR'
   - "job_title": Which target job role this question is for
   - "ideal_answer_framework": STAR method guidance or technical nuances the candidate must articulate
   - "evaluator_focus": What the interviewer is evaluating
5. "top_missing_skills": 5 to 8 concise critical skills demanded by employers that currently have high deficit in the student batch. DO NOT include emojis.

Format strictly as JSON:
{
  "roadmap": [
    {
      "step": 1,
      "title": "Module Title",
      "layer": "tooling",
      "prerequisites": "None (Foundational)",
      "duration_hours": 12,
      "week_or_day_breakdown": "Days 1-2: Architecture & Setup | Days 3-4: Hands-on Lab | Day 5: Mini-Sprint Evaluation",
      "key_topics": "Key skills and hands-on exercises",
      "hands_on_lab": "Step-by-step practical implementation lab for students",
      "capstone_deliverable": "Working GitHub repository or live deployed service",
      "faculty_guidance": "Notes for department professors on software setup and evaluation criteria",
      "curated_resources": "Official documentation and curated video tutorials",
      "expected_uplift": "+35% Batch Readiness"
    }
  ],
  "total_training_hours": 42,
  "recruiter_talking_points": [
    "Pre-screened candidates against your technical requirements with verified project competencies.",
    "Active upskilling sprint underway to prepare high-potential students in missing tooling areas."
  ],
  "workshops": [
    {
      "topic": "Name of Workshop",
      "duration": "2-Day Weekend Bootcamp",
      "target_tier": "Tier 3 & Tier 4",
      "potential_uplift_pct": "35%"
    }
  ],
  "interview_question_bank": [
    {
      "question": "Interview Question Text",
      "category": "Technical Depth",
      "job_title": "${jobsList[0]?.title || 'Software Engineer'}",
      "ideal_answer_framework": "STAR approach and technical nuances candidate should demonstrate",
      "evaluator_focus": "What the interviewer is evaluating"
    }
  ],
  "top_missing_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
}`

    const rawRoadmap = await callGroq(roadmapPrompt)
    const defaultJobTitle = jobsList[0]?.title || 'Target Role'

    // Default 10 interview questions covering all analyzed jobs
    const defaultInterviewQuestions: InterviewQuestion[] = [
      {
        question: `How would you approach designing and optimizing a scalable production workflow using ${topDeficitSkill}?`,
        category: 'Technical Depth',
        job_title: defaultJobTitle,
        ideal_answer_framework: 'Candidate should articulate core architectural principles, common bottlenecks, and mitigation strategies.',
        evaluator_focus: 'Evaluates hands-on engineering maturity versus theoretical memorization.',
      },
      {
        question: 'Explain the difference between synchronous and asynchronous processing. When would you choose one over the other?',
        category: 'Technical Depth',
        job_title: defaultJobTitle,
        ideal_answer_framework: 'Compare blocking I/O with event-driven architectures (message queues, async/await, worker pools).',
        evaluator_focus: 'Core systems comprehension and real-world trade-off analysis.',
      },
      {
        question: 'How do you handle database transaction management and data consistency across distributed services?',
        category: 'System & Tooling',
        job_title: defaultJobTitle,
        ideal_answer_framework: 'Discuss ACID properties, two-phase commits vs saga patterns, and idempotency.',
        evaluator_focus: 'Database reliability and backend architecture skills.',
      },
      {
        question: 'Describe your workflow for writing automated unit and integration tests. What coverage metrics do you aim for?',
        category: 'System & Tooling',
        job_title: defaultJobTitle,
        ideal_answer_framework: 'Discuss test pyramids, mocking external APIs, and preventing regressions in CI pipelines.',
        evaluator_focus: 'Code hygiene and professional engineering standards.',
      },
      {
        question: 'Describe a situation where a technical project hit a critical roadblock or unexpected bug. How did you diagnose and overcome it?',
        category: 'Behavioral / STAR',
        job_title: defaultJobTitle,
        ideal_answer_framework: 'STAR: Situation, Task, Action taken with methodical root cause analysis, and measurable Result achieved.',
        evaluator_focus: 'Problem-solving resilience, root cause analysis, and composure under pressure.',
      },
      {
        question: 'How do you prioritize competing deadlines when multiple critical tasks require immediate attention?',
        category: 'Behavioral / STAR',
        job_title: jobsList[1]?.title || defaultJobTitle,
        ideal_answer_framework: 'STAR framework demonstrating impact-versus-urgency matrix, stakeholder communication, and delivery.',
        evaluator_focus: 'Time management and professional stakeholder communication.',
      },
      {
        question: 'Walk us through the architecture and data flow of the most complex project you built during your degree.',
        category: 'Technical Depth',
        job_title: jobsList[1]?.title || defaultJobTitle,
        ideal_answer_framework: 'High-level component diagram, database schema choices, API boundaries, and key technical challenges.',
        evaluator_focus: 'Authentic project ownership and technical communication.',
      },
      {
        question: 'How do you ensure security best practices (such as input validation, auth token storage, and secret management) in your codebase?',
        category: 'System & Tooling',
        job_title: jobsList[1]?.title || defaultJobTitle,
        ideal_answer_framework: 'OWASP top 10 awareness, parameterized queries, JWT handling, and environment secret hygiene.',
        evaluator_focus: 'Security posture and enterprise readiness.',
      },
      {
        question: 'Tell me about a time you had to learn an unfamiliar technology or framework on a short deadline.',
        category: 'Behavioral / STAR',
        job_title: defaultJobTitle,
        ideal_answer_framework: 'STAR approach highlighting self-directed learning speed, reading official documentation, and building a POC.',
        evaluator_focus: 'Learning agility and continuous improvement attitude.',
      },
      {
        question: 'If this service experienced a sudden 10x surge in incoming traffic, what would break first and how would you scale it?',
        category: 'Technical Depth',
        job_title: defaultJobTitle,
        ideal_answer_framework: 'Identify database connection pool limits, introduce Redis caching, horizontal pod autoscaling, and CDNs.',
        evaluator_focus: 'Scalability awareness and systems engineering perspective.',
      },
    ]

    const fallbackMissingSkills = criticalGaps.map((g) => g.skill).slice(0, 6)

    let learningRoadmap: LearningRoadmapData = {
      steps: [],
      total_hours: 40,
      recruiter_talking_points: [
        `Pre-screened ${batchSize} candidates: ${readyCount} meet Top-Tier placement criteria today.`,
        'Active upskilling bootcamps underway to qualify remaining candidates before final round interviews.',
      ],
      interview_question_bank: defaultInterviewQuestions,
      top_missing_skills: fallbackMissingSkills,
      top_missing_ats_keywords: fallbackMissingSkills,
    }
    let workshops = []

    try {
      const clean = rawRoadmap.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      const parsedQuestions = Array.isArray(parsed.interview_question_bank) ? parsed.interview_question_bank : []
      const mergedQuestions = parsedQuestions.length >= 10
        ? parsedQuestions.slice(0, 10)
        : [...parsedQuestions, ...defaultInterviewQuestions.slice(parsedQuestions.length, 10)]

      const parsedMissingSkills = Array.isArray(parsed.top_missing_skills) && parsed.top_missing_skills.length > 0
        ? parsed.top_missing_skills
        : Array.isArray(parsed.top_missing_ats_keywords) && parsed.top_missing_ats_keywords.length > 0
        ? parsed.top_missing_ats_keywords
        : fallbackMissingSkills

      learningRoadmap = {
        steps: Array.isArray(parsed.roadmap) ? parsed.roadmap : [],
        total_hours: parsed.total_training_hours || 40,
        recruiter_talking_points: Array.isArray(parsed.recruiter_talking_points)
          ? parsed.recruiter_talking_points
          : [
              `Pre-screened ${batchSize} candidates with verified match criteria.`,
              'Cohort-level workshop scheduled for high-deficit tooling areas.',
            ],
        interview_question_bank: mergedQuestions,
        top_missing_skills: parsedMissingSkills,
        top_missing_ats_keywords: parsedMissingSkills,
      }
      workshops = Array.isArray(parsed.workshops) ? parsed.workshops : []
    } catch {
      learningRoadmap.steps = criticalGaps.slice(0, 3).map((g, idx) => ({
        step: idx + 1,
        title: `${g.skill} Practical Upskilling Module`,
        layer: g.layer,
        prerequisites: idx === 0 ? 'None (Foundational)' : `Module ${idx}`,
        duration_hours: g.typical_study_hours || 15,
        week_or_day_breakdown: `Days 1-2: Core Architecture & Setup | Days 3-4: Hands-on Lab | Day 5: Sprint Assessment`,
        key_topics: `Hands-on industry workflows, real-world scenarios, and practical implementation for ${g.skill}.`,
        hands_on_lab: `Guided practical exercises building live components with ${g.skill}.`,
        capstone_deliverable: `Production-ready codebase published on GitHub with documentation.`,
        faculty_guidance: `Conduct code walkthrough and evaluate repository structure against industry checklists.`,
        curated_resources: 'Official documentation and structured technical tutorials.',
        expected_uplift: '+30% Cohort Readiness',
      }))
      workshops = criticalGaps.slice(0, 2).map((g) => ({
        topic: `${g.skill} Fast-Track Bootcamp`,
        duration: '2-Day Weekend Intensive',
        target_tier: 'Tier 3 & Tier 4',
        potential_uplift_pct: '+35%',
      }))
    }

    // 8. Save Comprehensive Report to Supabase
    const targetBatchYear = formData.years?.[0] ? parseInt(formData.years[0]) : new Date().getFullYear() + 1
    const targetBranches = formData.departments && formData.departments.length > 0 ? formData.departments : ['All Departments']
    const targetDegrees = formData.degrees && formData.degrees.length > 0 ? formData.degrees : ['All Degrees']

    const { data: savedReport, error: saveErr } = await adminDb
      .from('tpo_readiness_reports')
      .insert({
        college_id: collegeId,
        created_by: user.id,
        report_mode: formData.mode,
        target_batch_year: targetBatchYear,
        target_branches: targetBranches,
        target_degrees: targetDegrees,
        analyzed_jobs: formData.jobs,
        batch_size: batchSize,
        ready_count: readyCount,
        avg_match_score: avgMatchScore,
        skill_coverage_heatmap: heatmap,
        recommended_workshops: workshops,
        cohort_tiers: cohortTiers,
        learning_roadmap: learningRoadmap,
        credits_spent: requiredCredits,
      })
      .select('*')
      .maybeSingle()

    if (saveErr) {
      console.warn('Save report warning:', saveErr)
    }

    return {
      success: true,
      report: savedReport || {
        college_id: collegeId,
        report_mode: formData.mode,
        target_batch_year: targetBatchYear,
        target_branches: targetBranches,
        target_degrees: targetDegrees,
        analyzed_jobs: formData.jobs,
        batch_size: batchSize,
        ready_count: readyCount,
        avg_match_score: avgMatchScore,
        skill_coverage_heatmap: heatmap,
        recommended_workshops: workshops,
        cohort_tiers: cohortTiers,
        learning_roadmap: learningRoadmap,
        credits_spent: requiredCredits,
        created_at: new Date().toISOString(),
      },
      updatedBalance,
      creditsSpent: requiredCredits,
    }
  } catch (err: any) {
    console.error('runBatchReadinessAnalysisAction error:', err)
    return { success: false, error: err.message || 'Failed to generate readiness report' }
  }
}

export async function deleteReadinessReportAction(reportId: string) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let collegeId = user.app_metadata?.college_id
    if (!collegeId) {
      const { data: userRow } = await adminDb
        .from('users')
        .select('college_id')
        .eq('id', user.id)
        .maybeSingle()
      collegeId = userRow?.college_id
    }

    if (!collegeId) throw new Error('College affiliation not found')

    const { error } = await adminDb
      .from('tpo_readiness_reports')
      .delete()
      .eq('id', reportId)
      .eq('college_id', collegeId)

    if (error) throw error

    return { success: true }
  } catch (err: any) {
    console.error('deleteReadinessReportAction error:', err)
    return { success: false, error: err.message || 'Failed to delete report' }
  }
}

/**
 * Creates a Razorpay order for College Institutional Credit Top-up.
 */
export async function createCollegeCreditTopupOrderAction(params: {
  planId: string
  amountInr: number
  credits: number
}) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let collegeId = user.app_metadata?.college_id
    if (!collegeId) {
      const { data: userRow } = await adminDb
        .from('users')
        .select('college_id')
        .eq('id', user.id)
        .maybeSingle()
      collegeId = userRow?.college_id
    }

    if (!collegeId) throw new Error('College affiliation not found')

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpayKeyId || !razorpaySecret) {
      throw new Error('Razorpay is not configured on the server.')
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpaySecret,
    })

    const options = {
      amount: params.amountInr * 100, // in paise
      currency: 'INR',
      receipt: `rcpt_clg_${collegeId.substring(0, 8)}_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    await adminDb.from('payment_requests').insert({
      user_id: user.id,
      college_id: collegeId,
      razorpay_order_id: order.id,
      amount: params.amountInr,
      type: 'college_credit_topup',
      status: 'pending',
      payload: {
        credits_included: params.credits,
        plan_id: params.planId,
      },
    })

    return { orderId: order.id, amount: options.amount }
  } catch (error: any) {
    console.error('College credit order creation failed:', error)
    return { error: error.message || 'Failed to create payment order' }
  }
}

/**
 * Confirms payment and credits the College balance.
 */
export async function confirmCollegeCreditTopupAction(params: {
  orderId: string
  paymentId: string
  credits: number
  planId: string
}) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    let collegeId = user.app_metadata?.college_id
    if (!collegeId) {
      const { data: userRow } = await adminDb
        .from('users')
        .select('college_id')
        .eq('id', user.id)
        .maybeSingle()
      collegeId = userRow?.college_id
    }

    if (!collegeId) throw new Error('College affiliation not found')

    // 1. Fetch current college credit balance
    const { data: college } = await adminDb
      .from('colleges')
      .select('credit_balance')
      .eq('id', collegeId)
      .single()

    const currentBal = college?.credit_balance || 0
    const newBal = currentBal + params.credits

    // 2. Update college balance
    await adminDb
      .from('colleges')
      .update({ credit_balance: newBal })
      .eq('id', collegeId)

    // 3. Mark payment request as paid
    await adminDb
      .from('payment_requests')
      .update({
        status: 'paid',
        razorpay_payment_id: params.paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', params.orderId)

    // 4. Audit ledger entry
    await adminDb.from('credit_ledgers').insert({
      user_id: user.id,
      amount: params.credits,
      description: `Institutional Top-up: ${params.credits} Credits (${params.planId})`,
    })

    return { success: true, newBalance: newBal }
  } catch (error: any) {
    console.error('Confirm college credit top-up failed:', error)
    return { success: false, error: error.message || 'Failed to confirm credit top-up' }
  }
}
