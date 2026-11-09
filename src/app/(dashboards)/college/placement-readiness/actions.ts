'use server'

import { createClient } from '@/utils/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function callGroq(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    max_tokens: 3000,
  })
  return completion.choices[0]?.message?.content || ''
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
  key_topics: string
  curated_resources: string
  expected_uplift: string
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

    // 1. Multi-Layer Domain-Agnostic Taxonomy Extraction (Pass 1)
    const jobsSummary = formData.jobs
      .map((j, i) => `Job #${i + 1} (${j.title} at ${j.company || 'Visiting Recruiter'}):\n${j.description}`)
      .join('\n\n---\n\n')

    const extractPrompt = `You are a Senior Campus Placement Intelligence Analyst.
Analyze the target job description(s) across ANY college domain (Engineering, IT, Commerce, BBA, Finance, Marketing, Operations, Arts, or Science).
Extract 10 to 16 required and preferred skills, tools, workflows, and standards.

Categorize each into one of these 4 distinct layers:
1. "hard": Core functional, technical, or analytical domain knowledge (e.g. React, Financial Modeling, Balance Sheet, Python, Circuit Design, Market Research, Pharmacovigilance).
2. "tooling": Software, tools, ERPs, and platforms (e.g. Docker, Git, Advanced Excel / VLOOKUP, TallyPrime, Salesforce, PowerBI, SAP, Figma).
3. "process": Industry workflows, architecture, compliance, and standards (e.g. CI/CD, GST/TDS Return Filing, System Architecture, Ind AS, B2B Sales Pipeline, Agile).
4. "soft": Client communication, presentation, problem solving, or behavioral skills (e.g. Technical Communication, Client Presentation, Objection Handling).

Format strictly as JSON:
{
  "skills": [
    {
      "name": "Advanced Excel (Pivot, VLOOKUP)",
      "layer": "tooling",
      "importance": "critical",
      "typical_study_hours": 15
    },
    {
      "name": "Financial Statement Analysis",
      "layer": "hard",
      "importance": "high",
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
        const yr = prof.academics?.graduation_year || prof.graduation_year || prof.academic_year || prof.year
        if (yr && Number(yr) !== Number(formData.batchYear)) return false
      }
      if (formData.department && formData.department !== 'all') {
        const filterVal = formData.department.toLowerCase().trim()
        const dept = (prof.academics?.department || prof.department || prof.branch || '').toLowerCase()
        const isMatch =
          dept.includes(filterVal) ||
          (filterVal === 'cmpn' && (dept.includes('computer') || dept.includes('cmpn') || dept.includes('cs'))) ||
          (filterVal === 'it' && (dept.includes('information') || dept.includes('it'))) ||
          (filterVal === 'mech' && (dept.includes('mechanical') || dept.includes('mech'))) ||
          (filterVal === 'civil' && dept.includes('civil'))
        if (!isMatch) return false
      }
      return true
    })

    const poolToAnalyze = filteredStudents.length > 0 ? filteredStudents : students
    const batchSize = poolToAnalyze.length

    // 4. Calculate skill coverage heatmap & student match scores
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
      ]
        .join(' ')
        .toLowerCase()

      let matchedCount = 0
      const missingSkills: string[] = []

      extractedSkills.forEach((skill) => {
        const needle = skill.name.toLowerCase()
        // Check full skill name or major keyword match
        const parts = needle.split(/[\s(/,)]+/).filter((w) => w.length > 2)
        const hasMatch =
          studentSkillsText.includes(needle) ||
          parts.some((p) => studentSkillsText.includes(p))

        if (hasMatch) {
          skillCounts[skill.name] = (skillCounts[skill.name] || 0) + 1
          matchedCount++
        } else {
          missingSkills.push(skill.name)
        }
      })

      const score = Math.round((matchedCount / extractedSkills.length) * 100)
      totalScoreSum += score

      evaluatedStudents.push({
        id: student.id,
        name: studentName,
        department: studentDept,
        score,
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

    // 6. Segment into 3 Actionable Student Cohort Tiers
    const tier1Students = evaluatedStudents.filter((s) => s.score >= 70)
    const tier2Students = evaluatedStudents.filter((s) => s.score >= 45 && s.score < 70)
    const tier3Students = evaluatedStudents.filter((s) => s.score < 45)

    const cohortTiers: CohortTier[] = [
      {
        tier: 'tier_1',
        label: 'Tier 1: Placement Ready',
        minScore: 70,
        maxScore: 100,
        count: tier1Students.length,
        percentage: Math.round((tier1Students.length / batchSize) * 100),
        badgeColor: 'emerald',
        description: 'Candidates who clear the technical & domain screening threshold today.',
        action_plan: 'Fast-track for immediate company shortlist; provide mock interview polish and company-specific briefing.',
        students: tier1Students,
      },
      {
        tier: 'tier_2',
        label: 'Tier 2: Quick-Win Upskill Cohort',
        minScore: 45,
        maxScore: 69,
        count: tier2Students.length,
        percentage: Math.round((tier2Students.length / batchSize) * 100),
        badgeColor: 'amber',
        description: 'Strong candidates missing 1–2 specific tooling or process requirements.',
        action_plan: 'Enroll in high-ROI 1–2 week targeted workshops to shift them into Tier 1 before recruitment day.',
        students: tier2Students,
      },
      {
        tier: 'tier_3',
        label: 'Tier 3: Foundational Re-build',
        minScore: 0,
        maxScore: 44,
        count: tier3Students.length,
        percentage: Math.round((tier3Students.length / batchSize) * 100),
        badgeColor: 'blue',
        description: 'Students requiring structured fundamental training and portfolio/project enhancement.',
        action_plan: 'Assign core capstone projects and mentor-led foundational tracks before external submissions.',
        students: tier3Students,
      },
    ]

    const readyCount = tier1Students.length

    // 7. Synthesize Dependency-Aware Learning Roadmap (Pass 2)
    const criticalGaps = heatmap.filter((h) => h.coveragePct < 55).slice(0, 6)

    const roadmapPrompt = `You are a Senior Corporate Placement Director designing an upskilling curriculum for a college Training & Placement Officer (TPO).
Target Roles: ${formData.jobs.map((j) => `${j.title} at ${j.company || 'Recruiter'}`).join(', ')}
Batch Size: ${batchSize} students.
Placement Ready (>=70%): ${readyCount} students (${Math.round((readyCount / batchSize) * 100)}%).
Key Batch Deficits: ${criticalGaps.map((g) => `${g.skill} [${g.layer.toUpperCase()}, ${g.coveragePct}% coverage]`).join(', ')}.

Design a sequenced 3-to-4 step curriculum. Topics MUST follow prerequisites (e.g. fundamentals/tools first, then advanced workflows, then mock practice).
Also provide 2 concise recruiter talking points for the TPO when speaking to visiting HR teams.

Format strictly as JSON:
{
  "roadmap": [
    {
      "step": 1,
      "title": "Module Title",
      "layer": "tooling",
      "prerequisites": "None (Foundational)",
      "duration_hours": 12,
      "key_topics": "Key skills and hands-on exercises",
      "curated_resources": "Free practical tutorials, official docs, or problem sets",
      "expected_uplift": "+35% Batch Readiness"
    }
  ],
  "total_training_hours": 42,
  "recruiter_talking_points": [
    "We have screened our batch against your exact JD requirements and identified our top candidates.",
    "A structured workshop on missing tooling skills is actively bridging the remaining gap."
  ],
  "workshops": [
    {
      "topic": "Name of Workshop",
      "duration": "2-Day Weekend Bootcamp",
      "target_tier": "Tier 2 & 3",
      "potential_uplift_pct": "35%"
    }
  ]
}`

    const rawRoadmap = await callGroq(roadmapPrompt)
    let learningRoadmap: {
      steps: RoadmapStep[]
      total_hours: number
      recruiter_talking_points: string[]
    } = {
      steps: [],
      total_hours: 40,
      recruiter_talking_points: [
        `Pre-screened ${batchSize} students: ${readyCount} candidates currently meet top-tier criteria.`,
        'Active upskilling bootcamps underway to qualify remaining candidates before final round interviews.',
      ],
    }
    let workshops = []

    try {
      const clean = rawRoadmap.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(clean)
      learningRoadmap = {
        steps: Array.isArray(parsed.roadmap) ? parsed.roadmap : [],
        total_hours: parsed.total_training_hours || 40,
        recruiter_talking_points: Array.isArray(parsed.recruiter_talking_points)
          ? parsed.recruiter_talking_points
          : [
              `Pre-screened ${batchSize} candidates with verified match criteria.`,
              'Cohort-level workshop scheduled for high-deficit tooling areas.',
            ],
      }
      workshops = Array.isArray(parsed.workshops) ? parsed.workshops : []
    } catch {
      learningRoadmap.steps = criticalGaps.slice(0, 3).map((g, idx) => ({
        step: idx + 1,
        title: `${g.skill} Intensive Practical Module`,
        layer: g.layer,
        prerequisites: idx === 0 ? 'None (Foundational)' : `Module ${idx}`,
        duration_hours: g.typical_study_hours || 15,
        key_topics: `Hands-on industry workflows, real-world scenarios, and practical implementation for ${g.skill}.`,
        curated_resources: 'Industry documentation and free structured video tutorials.',
        expected_uplift: '+30% Cohort Readiness',
      }))
      workshops = criticalGaps.slice(0, 2).map((g) => ({
        topic: `${g.skill} Hands-On Bootcamp`,
        duration: '2-Day Intensive',
        target_tier: 'Tier 2 & Tier 3',
        potential_uplift_pct: '35%',
      }))
    }

    // 8. Save Comprehensive Report to Supabase
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
        cohort_tiers: cohortTiers,
        learning_roadmap: learningRoadmap,
      })
      .select('*')
      .single()

    if (saveErr) {
      console.warn('Save report warning:', saveErr)
    }

    return {
      success: true,
      report: savedReport || {
        college_id: collegeId,
        report_mode: formData.mode,
        target_batch_year: formData.batchYear,
        target_branches: formData.department ? [formData.department] : ['All Branches'],
        analyzed_jobs: formData.jobs,
        batch_size: batchSize,
        ready_count: readyCount,
        avg_match_score: avgMatchScore,
        skill_coverage_heatmap: heatmap,
        recommended_workshops: workshops,
        cohort_tiers: cohortTiers,
        learning_roadmap: learningRoadmap,
        created_at: new Date().toISOString(),
      },
    }
  } catch (err: any) {
    console.error('runBatchReadinessAnalysisAction error:', err)
    return { success: false, error: err.message || 'Failed to generate readiness report' }
  }
}
