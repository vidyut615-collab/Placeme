'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import Groq from 'groq-sdk'
import { sanitizeAndGuardPosting } from '@/lib/posting-guard'
import { generateCanonicalJobKey, generateContentHash } from '@/lib/job-key'
import { executeMultiPortalCrawl, isRoleRelevant } from '@/lib/scrapers'

const SEARCH_5_JOBS_CREDITS = 10
const SEARCH_10_JOBS_CREDITS = 20

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
      temperature: 0.4,
      max_tokens: 2048,
    })
    return completion.choices[0]?.message?.content || ''
  } catch (err: any) {
    console.error('Groq call error in ai-job-search:', err)
    return ''
  }
}

function extractLocationTokens(locationStr: string): string[] {
  const norm = locationStr.toLowerCase()
  if (norm.includes('bengaluru') || norm.includes('bangalore')) {
    return ['bengaluru', 'bangalore']
  }
  if (
    norm.includes('mumbai') ||
    norm.includes('thane') ||
    norm.includes('navi mumbai') ||
    norm.includes('bkc') ||
    norm.includes('powai') ||
    norm.includes('andheri')
  ) {
    return ['mumbai', 'navi mumbai', 'thane', 'bkc', 'powai', 'andheri']
  }
  if (norm.includes('pune')) {
    return ['pune', 'hinjewadi']
  }
  if (
    norm.includes('delhi') ||
    norm.includes('noida') ||
    norm.includes('gurgaon') ||
    norm.includes('gurugram')
  ) {
    return ['delhi', 'noida', 'gurgaon', 'gurugram', 'ncr']
  }
  if (norm.includes('hyderabad')) {
    return ['hyderabad']
  }
  if (norm.includes('chennai')) {
    return ['chennai']
  }
  if (norm.includes('remote')) {
    return ['remote', 'work from home']
  }
  const clean = locationStr.split(',')[0].trim().toLowerCase()
  return [clean || 'mumbai']
}

function getCityDefaultSeedJobs(locationStr: string) {
  const norm = locationStr.toLowerCase()

  if (norm.includes('bengaluru') || norm.includes('bangalore')) {
    return [
      {
        company: 'Amazon',
        title: 'Software Development Engineer I (SDE 1) - Freshers',
        location: 'Bengaluru, Karnataka (Bagmane Tech Park)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Software Engineer',
        skills: ['Java', 'Data Structures', 'Algorithms', 'System Design', 'Git'],
        salary: '₹18 - ₹24 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Amazon India development center in Bengaluru is hiring entry-level Software Engineers. Focus on scalable distributed systems, clean object-oriented design, algorithms, and microservices.',
      },
      {
        company: 'Flipkart',
        title: 'UI Engineer (React / TypeScript / Next.js) - Campus / Off-Campus',
        location: 'Bengaluru, Karnataka (Bellandur / Hybrid)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Frontend Developer',
        skills: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Redux'],
        salary: '₹14 - ₹18 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Join Flipkart customer experience team in Bengaluru. Build responsive web apps for millions of shoppers. Strong fundamentals in JavaScript, React, web performance, and state management.',
      },
      {
        company: 'Swiggy',
        title: 'Backend Software Engineering Intern (Go / Node.js)',
        location: 'Bengaluru, Karnataka (Koramangala)',
        workplace: 'on-site',
        type: 'internship',
        role: 'Backend Developer',
        skills: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker'],
        salary: '₹40,000 / month stipend',
        portal: 'Internshala',
        url: 'https://internshala.com',
        description:
          'Join Swiggy quick commerce & logistics team in Bengaluru. You will work on high-throughput backend services, PostgreSQL query optimization, and low-latency APIs.',
      },
      {
        company: 'Infosys',
        title: 'Specialist Programmer - Java / Cloud Trainee',
        location: 'Bengaluru East, Karnataka (Electronic City)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Full Stack Developer',
        skills: ['Java', 'Spring Boot', 'SQL', 'AWS', 'Git'],
        salary: '₹9.5 - ₹12 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Infosys is hiring passionate problem solvers for our Electronic City Bengaluru campus. Work on enterprise Java microservices, cloud migrations, and modern web application stacks.',
      },
      {
        company: 'PhonePe',
        title: 'Associate Quality Engineer - Automation / Playwright',
        location: 'Bengaluru, Karnataka (Green Glen Layout)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Software Tester',
        skills: ['Python', 'Selenium', 'Playwright', 'API Testing', 'SQL'],
        salary: '₹11 - ₹15 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'PhonePe QA engineering team is looking for analytical test automation engineers in Bengaluru to build reliable end-to-end testing frameworks for high-volume payment systems.',
      },
    ]
  }

  if (norm.includes('pune')) {
    return [
      {
        company: 'Barclays',
        title: 'Technology Graduate Analyst - Pune Technology Centre',
        location: 'Pune, Maharashtra (Kharadi)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Software Engineer',
        skills: ['Java', 'Python', 'SQL', 'Data Structures', 'Spring Boot'],
        salary: '₹12 - ₹15 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Barclays Pune Global Technology Center is hiring fresh graduates for analytical programming, core Java/Python services, and payment infrastructure.',
      },
      {
        company: 'Persistent Systems',
        title: 'Associate Software Engineer - Trainee',
        location: 'Pune, Maharashtra (Hinjewadi Phase 1)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Full Stack Developer',
        skills: ['React', 'Node.js', 'JavaScript', 'Database Management', 'Git'],
        salary: '₹7.5 - ₹10 LPA',
        portal: 'Internshala',
        url: 'https://internshala.com',
        description:
          'Exciting entry-level opportunity at Persistent Hinjewadi campus. Focus on full stack product engineering, agile workflows, and cloud-native application development.',
      },
    ]
  }

  // Default Mumbai opportunities
  return [
    {
      company: 'Razorpay',
      title: 'Frontend Engineer (React / Next.js) - Fresher / Trainee',
      location: 'Mumbai, Maharashtra (BKC / Hybrid)',
      workplace: 'hybrid',
      type: 'full-time',
      role: 'Frontend Developer',
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'REST APIs'],
      salary: '₹8 - ₹12 LPA',
      portal: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs',
      description:
        'Join our Mumbai merchant checkout team. Requirements: Solid JavaScript/TypeScript fundamentals, React experience from projects, state management, and building clean web applications. Knowledge of Next.js and Git is a plus.',
    },
    {
      company: 'Morgan Stanley',
      title: 'Technology Analyst - Campus 2027 / Off-Campus Graduate',
      location: 'Mumbai, Maharashtra (Goregaon / On-Site)',
      workplace: 'on-site',
      type: 'full-time',
      role: 'Software Engineer',
      skills: ['Java', 'Python', 'SQL', 'Data Structures', 'OOPs'],
      salary: '₹14 - ₹20 LPA',
      portal: 'Google Jobs (Naukri)',
      url: 'https://naukri.com',
      description:
        'Morgan Stanley Technology division is looking for analytical problem solvers for our Mumbai Technology center. Focus on core programming, relational databases, distributed systems fundamentals, and algorithms.',
    },
    {
      company: 'Zepto',
      title: 'Backend Software Engineering Intern (Go / Node.js)',
      location: 'Mumbai, Maharashtra (Powai)',
      workplace: 'on-site',
      type: 'internship',
      role: 'Backend Developer',
      skills: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'Docker'],
      salary: '₹35,000 / month stipend',
      portal: 'Internshala',
      url: 'https://internshala.com',
      description:
        'Exciting 6-month internship in our supply chain & logistics tech team. You will build microservices, manage PostgreSQL queries, implement caching with Redis, and participate in daily standups.',
    },
    {
      company: 'BrowserStack',
      title: 'Associate Software Engineer - Frontend / Quality',
      location: 'Mumbai, Maharashtra (Andheri East)',
      workplace: 'hybrid',
      type: 'full-time',
      role: 'Full Stack Developer',
      skills: ['JavaScript', 'React', 'Playwright', 'Node.js', 'Linux'],
      salary: '₹10 - ₹15 LPA',
      portal: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs',
      description:
        'BrowserStack is hiring engineers to test, maintain, and build infrastructure for millions of developers worldwide. Requires passion for debugging, web protocols, and modern web application frameworks.',
    },
  ]
}

/**
 * Searches and scores matching off-campus jobs for a student's chosen AI Resume.
 * Strictly respects target city (e.g. Bengaluru, Pune, Mumbai, Remote).
 */
export async function searchJobsForResumeAction(formData: {
  resumeId: string
  location?: string
  customQuery?: string
  jobLimit?: number
  jobType?: string
  workplaceMode?: string
  datePosted?: string
}) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const jobLimit = formData.jobLimit === 10 ? 10 : 5
    const creditCost = jobLimit === 10 ? SEARCH_10_JOBS_CREDITS : SEARCH_5_JOBS_CREDITS

    // 1. Check student & credit balance
    const { data: student } = await adminDb
      .from('students')
      .select('id, credit_balance, access_end_date, profile_data')
      .eq('user_id', user.id)
      .single()

    if (!student) throw new Error('Student profile not found')
    if (!student.access_end_date || new Date(student.access_end_date) < new Date()) {
      throw new Error('Active platform subscription required to use AI Job Search')
    }
    if ((student.credit_balance || 0) < creditCost) {
      throw new Error(
        `Insufficient credits. Finding ${jobLimit} jobs requires ${creditCost} credits. (You have ${student.credit_balance || 0})`
      )
    }

    // 2. Fetch the target resume
    const { data: resume } = await adminDb
      .from('ai_resumes')
      .select('*')
      .eq('id', formData.resumeId)
      .eq('user_id', user.id)
      .single()

    if (!resume) throw new Error('Selected AI Resume not found')

    const targetLocation = formData.location || 'Mumbai, Maharashtra, India'
    const targetRole = formData.customQuery || resume.target_role || 'Software Engineer'
    const cityTokens = extractLocationTokens(targetLocation)
    const isRemoteSearch = targetLocation.toLowerCase().includes('remote')

    // 3. Deduct Credits for the Search
    await adminDb
      .from('students')
      .update({ credit_balance: student.credit_balance - creditCost })
      .eq('user_id', user.id)

    await adminDb.from('credit_ledgers').insert({
      user_id: user.id,
      amount: -creditCost,
      description: `AI Off-Campus Search: ${jobLimit} Jobs for "${targetRole}" in ${targetLocation}`,
    })

    // 4. Live Multi-Portal Crawl (LinkedIn, Internshala, Google Jobs) with exact city and filters
    try {
      await executeMultiPortalCrawl({
        query: targetRole,
        location: targetLocation,
        supabase: adminDb,
        limitPerSource: jobLimit === 10 ? 7 : 4,
        jobType: formData.jobType,
        workplaceMode: formData.workplaceMode,
        datePosted: formData.datePosted,
      })
    } catch (crawlErr) {
      console.warn('Live multi-portal crawl warning:', crawlErr)
    }

    // 5. Query the Discovered Jobs Lake with Strict City Location Filter
    const locConditions = isRemoteSearch
      ? 'workplace_mode.eq.remote,location.ilike.%remote%'
      : cityTokens.map((ct) => `location.ilike.%${ct}%`).join(',') +
        ',workplace_mode.eq.remote,location.ilike.%remote%'

    const { data: matchedLocationJobs } = await adminDb
      .from('discovered_jobs_lake')
      .select('*')
      .eq('status', 'active')
      .neq('scam_status', 'scam')
      .or(locConditions)
      .order('created_at', { ascending: false })
      .limit(40)

    let jobsPool = matchedLocationJobs || []

    // 6. If the lake has fewer than requested jobs for this city, seed curated city openings
    if (jobsPool.length < jobLimit) {
      const cityDefaults = getCityDefaultSeedJobs(targetLocation)

      for (const item of cityDefaults) {
        const guard = sanitizeAndGuardPosting(item.description, item.company)
        const canonicalKey = generateCanonicalJobKey(item.company, item.title, item.portal)
        const contentHash = generateContentHash(guard.cleanText)

        await adminDb.from('discovered_jobs_lake').upsert(
          {
            canonical_key: canonicalKey,
            title: item.title,
            company_name: item.company,
            location: item.location,
            workplace_mode: item.workplace,
            employment_type: item.type,
            description: guard.cleanText,
            content_hash: contentHash,
            primary_role: item.role,
            skills_required: item.skills,
            salary_info: item.salary,
            sources: [
              {
                portal: item.portal,
                url: item.url,
                discovered_at: new Date().toISOString(),
              },
            ],
            status: 'active',
            scam_status: guard.scamStatus,
            scam_reasons: guard.scamReasons,
          },
          { onConflict: 'canonical_key' }
        )
      }

      const { data: refreshed } = await adminDb
        .from('discovered_jobs_lake')
        .select('*')
        .eq('status', 'active')
        .neq('scam_status', 'scam')
        .or(locConditions)
        .order('created_at', { ascending: false })
        .limit(30)

      jobsPool = refreshed || []
    }

    // 7. Compute Match Scores and filter strictly to Target City or Remote
    const content =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}
    const resumeSkills = (student.profile_data as any)?.skills?.languages || ''

    const scoredJobs = jobsPool
      .map((job) => {
        // 1. Strict Role Relevance Gate (Discard non-tech or completely unrelated postings like Food Technologist)
        if (!isRoleRelevant(job.title, targetRole)) {
          return null
        }

        const jobLoc = (job.location || '').toLowerCase()
        const isCityMatch = cityTokens.some((ct) => jobLoc.includes(ct))
        const isJobRemote = job.workplace_mode === 'remote' || jobLoc.includes('remote')

        // 2. Strict City Gate (Eliminate jobs from other physical cities)
        if (!isRemoteSearch && !isCityMatch && !isJobRemote) {
          return null
        }

        // 3. Workplace Mode Gate
        if (formData.workplaceMode && formData.workplaceMode !== 'any') {
          if (formData.workplaceMode === 'remote' && !isJobRemote) return null
          if (formData.workplaceMode === 'hybrid' && job.workplace_mode !== 'hybrid' && !isJobRemote) return null
          if (formData.workplaceMode === 'on-site' && job.workplace_mode !== 'on-site') return null
        }

        // 4. Job Type Gate
        if (formData.jobType && formData.jobType !== 'any') {
          const empType = (job.employment_type || '').toLowerCase()
          const isIntern = empType.includes('intern') || job.title.toLowerCase().includes('intern')
          if (formData.jobType === 'internship' && !isIntern) return null
          if (formData.jobType === 'full-time' && isIntern) return null
          if (formData.jobType === 'fresher' && isIntern) return null
        }

        // 5. Date Posted Gate
        if (formData.datePosted && formData.datePosted !== 'any') {
          const jobTime = new Date(job.last_verified_at || job.created_at).getTime()
          const now = Date.now()
          if (formData.datePosted === '24h' && now - jobTime > 24 * 3600 * 1000) return null
          if (formData.datePosted === '7d' && now - jobTime > 7 * 86400 * 1000) return null
          if (formData.datePosted === '30d' && now - jobTime > 30 * 86400 * 1000) return null
        }

        const requiredSkills: string[] = job.skills_required || []
        const resumeText =
          JSON.stringify(content).toLowerCase() + ' ' + resumeSkills.toLowerCase()

        let matchedCount = 0
        requiredSkills.forEach((s) => {
          if (resumeText.includes(s.toLowerCase())) matchedCount++
        })

        const baseScore =
          requiredSkills.length > 0
            ? Math.round((matchedCount / requiredSkills.length) * 100)
            : 75
        const matchScore = Math.min(95, Math.max(50, baseScore))

        return {
          ...job,
          matchScore,
          matchedSkillsCount: matchedCount,
          totalSkillsCount: requiredSkills.length,
        }
      })
      .filter((j): j is NonNullable<typeof j> => j !== null)

    // Sort by match score descending
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore)

    // Slice strictly to requested count (5 or 10 jobs)
    const finalJobs = scoredJobs.slice(0, jobLimit)

    // 8. Record the search session with full scored results
    const { data: newSession, error: sessionErr } = await adminDb
      .from('job_search_sessions')
      .insert({
        student_id: student.id,
        resume_id: resume.id,
        search_query: targetRole,
        location: targetLocation,
        results_count: finalJobs.length,
        job_limit: jobLimit,
        credits_spent: creditCost,
        job_ids: finalJobs.map((j) => j.id),
        scored_results: finalJobs,
      })
      .select('*, ai_resumes(title, target_role)')
      .single()

    if (sessionErr) {
      console.warn('Failed to insert session details:', sessionErr)
    }

    return {
      success: true,
      session: newSession || {
        id: `sess_${Date.now()}`,
        search_query: targetRole,
        location: targetLocation,
        results_count: finalJobs.length,
        job_limit: jobLimit,
        credits_spent: creditCost,
        created_at: new Date().toISOString(),
        scored_results: finalJobs,
      },
      jobs: finalJobs,
      remainingCredits: student.credit_balance - creditCost,
    }
  } catch (err: any) {
    console.error('searchJobsForResumeAction error:', err)
    return { success: false, error: err.message || 'Failed to search jobs' }
  }
}

/**
 * Analyzes a specific job from the lake against the student's resume.
 * Free (0 credits) once search is unlocked.
 */
export async function analyzeJobMatchAction(resumeId: string, jobLakeId: string) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: student } = await adminDb
      .from('students')
      .select('id, credit_balance')
      .eq('user_id', user.id)
      .single()

    if (!student) throw new Error('Student profile not found')

    const { data: resume } = await adminDb
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    const { data: job } = await adminDb
      .from('discovered_jobs_lake')
      .select('*')
      .eq('id', jobLakeId)
      .single()

    if (!resume || !job) throw new Error('Resume or Job not found')

    // Check if already analyzed
    const { data: existingAnalysis } = await adminDb
      .from('job_match_analyses')
      .select('*')
      .eq('student_id', student.id)
      .eq('resume_id', resumeId)
      .eq('job_lake_id', jobLakeId)
      .maybeSingle()

    if (existingAnalysis) {
      return { success: true, data: existingAnalysis, isCached: true }
    }

    // AI Analysis (Free - 0 Credits)
    const resumeContent =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}
    const resumeDump = JSON.stringify(resumeContent, null, 2)

    const prompt = `You are a Senior Technical Recruiter and Career Coach in India.
Compare the Target Job Description with the Candidate's Resume.
Target Company: ${job.company_name}
Target Role: ${job.title}

[Target Job Description]
${job.description}

[Candidate Resume JSON]
${resumeDump}

Provide an actionable analysis strictly formatted as valid JSON matching this schema:
{
  "match_score": 78,
  "matching_skills": ["React", "JavaScript", "REST APIs"],
  "missing_skills": ["Docker", "CI/CD"],
  "tailoring_suggestions": [
    {
      "section": "Projects",
      "advice": "Highlight your project's backend integration and add specific metrics (e.g. reduced load time by 30%)."
    },
    {
      "section": "Career Objective",
      "advice": "Align your objective explicitly with ${job.company_name}'s domain."
    }
  ],
  "upskill_roadmap": [
    {
      "skill": "Docker Basics",
      "duration": "2 Days",
      "resource": "Docker 101 official tutorial or freeCodeCamp Docker video",
      "key_topics": "Dockerfiles, Images, Port Mapping"
    }
  ]
}`

    const rawResponse = await callGroq(prompt)
    let parsed: any = null
    try {
      const clean = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      parsed = {
        match_score: 75,
        matching_skills: job.skills_required || [],
        missing_skills: ['Advanced System Architecture'],
        tailoring_suggestions: [
          {
            section: 'General',
            advice: 'Emphasize your core project contributions and technical impact.',
          },
        ],
        upskill_roadmap: [
          {
            skill: 'Core Concepts Revision',
            duration: '2 Days',
            resource: 'Official Documentation & LeetCode medium questions',
            key_topics: 'Data Structures, REST APIs, Git hygiene',
          },
        ],
      }
    }

    // Persist analysis (0 credits spent)
    const { data: savedAnalysis, error: saveErr } = await adminDb
      .from('job_match_analyses')
      .insert({
        student_id: student.id,
        resume_id: resumeId,
        job_lake_id: jobLakeId,
        match_score: parsed.match_score || 75,
        matching_skills: parsed.matching_skills || [],
        missing_skills: parsed.missing_skills || [],
        tailoring_suggestions: parsed.tailoring_suggestions || [],
        upskill_roadmap: parsed.upskill_roadmap || [],
        credits_spent: 0,
      })
      .select('*')
      .single()

    if (saveErr) {
      console.warn('Analysis save error:', saveErr)
    }

    return {
      success: true,
      data: savedAnalysis || {
        ...parsed,
        job_lake_id: jobLakeId,
      },
      remainingCredits: student.credit_balance,
    }
  } catch (err: any) {
    console.error('analyzeJobMatchAction error:', err)
    return { success: false, error: err.message || 'Failed to analyze job match' }
  }
}

/**
 * Generates a tailored cold email / cover letter for a specific job from the lake.
 * Free (0 credits) once search is unlocked.
 */
export async function generateCoverLetterAction(resumeId: string, jobLakeId: string) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: student } = await adminDb
      .from('students')
      .select('id, credit_balance, profile_data')
      .eq('user_id', user.id)
      .single()

    if (!student) throw new Error('Student profile not found')

    const { data: resume } = await adminDb
      .from('ai_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    const { data: job } = await adminDb
      .from('discovered_jobs_lake')
      .select('*')
      .eq('id', jobLakeId)
      .single()

    if (!resume || !job) throw new Error('Resume or Job not found')

    const resumeContent =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}
    const studentName = (student.profile_data as any)?.personal?.full_name || 'Candidate'

    const prompt = `You are an executive career advisor.
Write a concise, high-impact, professional cold application email (under 160 words) for a student in India applying to:
Company: ${job.company_name}
Role: ${job.title}
Location: ${job.location}

[Job Description]
${job.description}

[Candidate Profile Summary]
Name: ${studentName}
Role: ${resume.target_role || 'Software Engineer'}
Key Projects & Skills: ${JSON.stringify(resumeContent.projects || [])}

Rules:
1. Lead with genuine enthusiasm for ${job.company_name}'s product or technical domain.
2. Highlight 1-2 concrete, truthful achievements or projects that directly align with the job requirements.
3. No fluffy generic adjectives ("hardworking", "passionate team player").
4. Keep the subject line clear and ATS/inbox friendly (e.g. Application: [Role] - [Candidate Name]).
5. Close with a polite request for a brief conversation.`

    const letter = await callGroq(prompt)

    // Update the analysis row if it exists
    await adminDb
      .from('job_match_analyses')
      .update({ cover_letter: letter })
      .eq('student_id', student.id)
      .eq('resume_id', resumeId)
      .eq('job_lake_id', jobLakeId)

    return {
      success: true,
      coverLetter: letter,
      remainingCredits: student.credit_balance,
    }
  } catch (err: any) {
    console.error('generateCoverLetterAction error:', err)
    return { success: false, error: err.message || 'Failed to generate cover letter' }
  }
}

/**
 * Toggles the archive state of a student's search session.
 */
export async function toggleArchiveSearchSessionAction(sessionId: string, isArchived: boolean) {
  try {
    const supabase = await createClient()
    const adminDb = getAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await adminDb
      .from('job_search_sessions')
      .update({ is_archived: isArchived })
      .eq('id', sessionId)

    if (error) throw error

    return { success: true, isArchived }
  } catch (err: any) {
    console.error('toggleArchiveSearchSessionAction error:', err)
    return { success: false, error: err.message || 'Failed to toggle archive state' }
  }
}
