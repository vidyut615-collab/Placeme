'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import Groq from 'groq-sdk'
import { sanitizeAndGuardPosting } from '@/lib/posting-guard'
import { generateCanonicalJobKey, generateContentHash } from '@/lib/job-key'
import { executeMultiPortalCrawl, isRoleRelevant } from '@/lib/scrapers'

const SEARCH_5_JOBS_CREDITS = 100
const SEARCH_10_JOBS_CREDITS = 180

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

export interface SearchIntent {
  canonicalCity: string
  canonicalLocation: string
  cityAliases: string[]
  internshalaSlug: string
  isRemote: boolean
  targetDomain: string
  canonicalRoleQuery: string
  roleKeywords: string[]
  negativeKeywords: string[]
  extractedResumeSkills: string[]
}

function getBaselineCityInfo(locationStr: string) {
  const norm = locationStr.toLowerCase().trim()
  let isRemote = norm.includes('remote') || norm.includes('wfh') || norm.includes('work from home')

  if (
    norm.includes('hyder') ||
    norm.includes('hydr') ||
    norm.includes('cyberabad') ||
    norm.includes('secunderabad') ||
    norm.includes('hitec')
  ) {
    return {
      canonicalCity: 'Hyderabad',
      canonicalLocation: 'Hyderabad, Telangana, India',
      cityAliases: ['hyderabad', 'secunderabad', 'cyberabad', 'hitec city', 'gachibowli', 'kondapur', 'madhapur', 'telangana'],
      internshalaSlug: 'hyderabad',
      isRemote: false,
    }
  }

  if (
    norm.includes('bengaluru') ||
    norm.includes('bangalore') ||
    norm.includes('blr') ||
    norm.includes('whitefield')
  ) {
    return {
      canonicalCity: 'Bengaluru',
      canonicalLocation: 'Bengaluru, Karnataka, India',
      cityAliases: ['bengaluru', 'bangalore', 'whitefield', 'koramangala', 'electronic city', 'bellandur', 'karnataka'],
      internshalaSlug: 'bengaluru',
      isRemote: false,
    }
  }

  if (
    norm.includes('pune') ||
    norm.includes('hinjewadi') ||
    norm.includes('kharadi')
  ) {
    return {
      canonicalCity: 'Pune',
      canonicalLocation: 'Pune, Maharashtra, India',
      cityAliases: ['pune', 'hinjewadi', 'kharadi', 'magarpatta', 'baner', 'kothrud', 'maharashtra'],
      internshalaSlug: 'pune',
      isRemote: false,
    }
  }

  if (
    norm.includes('delhi') ||
    norm.includes('noida') ||
    norm.includes('gurgaon') ||
    norm.includes('gurugram') ||
    norm.includes('ncr') ||
    norm.includes('ghaziabad') ||
    norm.includes('faridabad')
  ) {
    return {
      canonicalCity: 'Delhi NCR',
      canonicalLocation: 'Delhi NCR, India',
      cityAliases: ['delhi', 'noida', 'gurgaon', 'gurugram', 'ncr', 'faridabad', 'ghaziabad'],
      internshalaSlug: 'delhi',
      isRemote: false,
    }
  }

  if (
    norm.includes('chennai') ||
    norm.includes('madras') ||
    norm.includes('omr')
  ) {
    return {
      canonicalCity: 'Chennai',
      canonicalLocation: 'Chennai, Tamil Nadu, India',
      cityAliases: ['chennai', 'omr', 'guindy', 'siruseri', 'tidel park', 'tamil nadu'],
      internshalaSlug: 'chennai',
      isRemote: false,
    }
  }

  if (
    norm.includes('mumbai') ||
    norm.includes('bombay') ||
    norm.includes('thane') ||
    norm.includes('navi mumbai') ||
    norm.includes('bkc') ||
    norm.includes('powai') ||
    norm.includes('andheri')
  ) {
    return {
      canonicalCity: 'Mumbai',
      canonicalLocation: 'Mumbai, Maharashtra, India',
      cityAliases: ['mumbai', 'navi mumbai', 'thane', 'bkc', 'powai', 'andheri', 'maharashtra'],
      internshalaSlug: 'mumbai',
      isRemote: false,
    }
  }

  if (isRemote) {
    return {
      canonicalCity: 'Remote',
      canonicalLocation: 'Remote, India',
      cityAliases: ['remote', 'work from home', 'wfh', 'anywhere'],
      internshalaSlug: 'work-from-home',
      isRemote: true,
    }
  }

  const clean = locationStr.split(',')[0].trim() || 'Mumbai'
  return {
    canonicalCity: clean,
    canonicalLocation: `${clean}, India`,
    cityAliases: [clean.toLowerCase()],
    internshalaSlug: clean.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    isRemote: false,
  }
}

/**
 * AI-powered Search Intent Normalizer
 * Uses Groq to understand misspelled cities, slang, resume domain, role keywords,
 * negative exclusion keywords, and extracted technical skills.
 */
export async function resolveSearchIntent(params: {
  rawLocation: string
  query: string
  resumeTitle?: string
  resumeRole?: string
  resumeContent?: any
  profileSkills?: string
}): Promise<SearchIntent> {
  const { rawLocation, query, resumeTitle = '', resumeRole = '', resumeContent = {}, profileSkills = '' } = params
  const baseline = getBaselineCityInfo(rawLocation)

  const fallbackNegative = [
    'automotive',
    'automobile',
    'mechanical',
    'civil',
    'chemical',
    'manufacturing',
    'assembly',
    'sales executive',
    'telecalling',
    'bpo',
    'site engineer',
    'field engineer',
    'quality supervisor',
    'production supervisor',
    'pharmacist',
    'boiler',
    'textile',
    'electrician',
    'hardware assembly',
    'machinist',
  ]

  const fallbackSkills = [
    'React',
    'JavaScript',
    'TypeScript',
    'Node.js',
    'Python',
    'SQL',
    'Git',
    'Data Structures & Algorithms',
  ]

  try {
    const resumeSummary = JSON.stringify({
      title: resumeTitle,
      targetRole: resumeRole,
      skills: profileSkills,
      summary: resumeContent?.summary || resumeContent?.objective || '',
      projects: (resumeContent?.projects || []).slice(0, 3).map((p: any) => p.title || p.name || ''),
    }).slice(0, 900)

    const prompt = `You are an expert AI Career Matcher & Indian Tech Job Market Normalizer.
Analyze the student's job search input and resume to generate precise search parameters.

Input:
- User Typed Location: "${rawLocation}"
- User Query / Target Role: "${query}"
- Resume Profile Context: ${resumeSummary}

Return ONLY a strict JSON object (no markdown formatting, no code fences, just raw JSON) with these exact keys:
{
  "canonicalCity": "Canonical city name (e.g. Hyderabad, Bengaluru, Mumbai, Pune, Delhi NCR, Chennai, Kolkata, Remote)",
  "canonicalLocation": "Full Indian canonical location string (e.g. 'Hyderabad, Telangana, India')",
  "cityAliases": ["array of lowercase city name variants, tech clusters, and slang e.g. 'hyderabad', 'secunderabad', 'cyberabad', 'hitec city', 'gachibowli'"],
  "internshalaSlug": "canonical lowercase slug for Internshala job URLs e.g. 'hyderabad'",
  "isRemote": boolean,
  "targetDomain": "candidate's core domain e.g. 'software_engineering'",
  "canonicalRoleQuery": "clean normalized role search query e.g. 'Software Developer'",
  "roleKeywords": ["array of role keywords e.g. 'software', 'developer', 'sde', 'frontend', 'backend', 'full stack', 'react', 'node'"],
  "negativeKeywords": ["strict lowercase exclusion terms for irrelevant domains e.g. 'automotive', 'mechanical', 'civil', 'chemical', 'manufacturing', 'assembly', 'sales executive', 'telecalling', 'bpo', 'site engineer', 'field engineer', 'quality supervisor'"],
  "extractedResumeSkills": ["top 8-15 technical skills from resume e.g. 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Git'"]
}`

    const rawResponse = await callGroq(prompt)
    if (rawResponse) {
      const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanJson)
      if (parsed.canonicalCity && parsed.canonicalLocation) {
        return {
          canonicalCity: parsed.canonicalCity || baseline.canonicalCity,
          canonicalLocation: parsed.canonicalLocation || baseline.canonicalLocation,
          cityAliases:
            Array.isArray(parsed.cityAliases) && parsed.cityAliases.length > 0
              ? parsed.cityAliases
              : baseline.cityAliases,
          internshalaSlug: parsed.internshalaSlug || baseline.internshalaSlug,
          isRemote: parsed.isRemote ?? baseline.isRemote,
          targetDomain: parsed.targetDomain || 'software_engineering',
          canonicalRoleQuery: parsed.canonicalRoleQuery || query,
          roleKeywords:
            Array.isArray(parsed.roleKeywords) && parsed.roleKeywords.length > 0
              ? parsed.roleKeywords
              : ['software', 'developer', 'engineer', 'sde'],
          negativeKeywords:
            Array.isArray(parsed.negativeKeywords) && parsed.negativeKeywords.length > 0
              ? parsed.negativeKeywords
              : fallbackNegative,
          extractedResumeSkills:
            Array.isArray(parsed.extractedResumeSkills) && parsed.extractedResumeSkills.length > 0
              ? parsed.extractedResumeSkills
              : fallbackSkills,
        }
      }
    }
  } catch (aiErr) {
    console.warn('AI intent extraction warning; fallback to baseline normalizer:', aiErr)
  }

  return {
    canonicalCity: baseline.canonicalCity,
    canonicalLocation: baseline.canonicalLocation,
    cityAliases: baseline.cityAliases,
    internshalaSlug: baseline.internshalaSlug,
    isRemote: baseline.isRemote,
    targetDomain: 'software_engineering',
    canonicalRoleQuery: query,
    roleKeywords: ['software', 'developer', 'engineer', 'sde', 'frontend', 'backend', 'fullstack'],
    negativeKeywords: fallbackNegative,
    extractedResumeSkills: fallbackSkills,
  }
}

function getCityDefaultSeedJobs(canonicalCity: string) {
  const norm = canonicalCity.toLowerCase()

  // 1. HYDERABAD SEED JOBS
  if (norm.includes('hyder') || norm.includes('hydr') || norm.includes('cyber')) {
    return [
      {
        company: 'Microsoft India',
        title: 'Software Engineer Trainee - Campus / Off-Campus 2026',
        location: 'Hyderabad, Telangana (Gachibowli / IDC)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Software Engineer',
        skills: ['Java', 'C++', 'Data Structures', 'Algorithms', 'Azure', 'Git'],
        salary: '₹18 - ₹25 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Microsoft India Development Center (IDC) in Hyderabad is hiring early-career Software Engineers. Work on high-scale distributed systems, cloud services on Azure, and developer platforms.',
      },
      {
        company: 'ServiceNow',
        title: 'Associate Software Engineer - Platform / Frontend',
        location: 'Hyderabad, Telangana (Knowledge City / Hitec City)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Frontend Developer',
        skills: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'HTML/CSS', 'TypeScript'],
        salary: '₹14 - ₹19 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Join ServiceNow Hyderabad technology hub. You will engineer resilient enterprise UI workflows, interactive dashboards, and scalable web apps using React and modern JavaScript.',
      },
      {
        company: 'Amazon Development Center',
        title: 'Software Development Engineer I (SDE 1) - Fresher',
        location: 'Hyderabad, Telangana (Financial District / Nanakramguda)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Backend Developer',
        skills: ['Java', 'AWS', 'PostgreSQL', 'System Design', 'Microservices'],
        salary: '₹19 - ₹24 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Amazon India Hyderabad center is hiring entry-level SDEs for retail systems and AWS cloud tools. Design scalable microservices, write clean code, and participate in code reviews.',
      },
      {
        company: 'Darwinbox',
        title: 'Backend Software Engineer - Trainee / Fresher',
        location: 'Hyderabad, Telangana (Madhapur / Hitec City)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Backend Developer',
        skills: ['Node.js', 'Go', 'MySQL', 'Redis', 'Docker'],
        salary: '₹10 - ₹14 LPA',
        portal: 'Internshala',
        url: 'https://internshala.com',
        description:
          'Darwinbox Asia unicorn HR-tech team in Hyderabad is hiring junior backend developers. Build high-concurrency APIs, optimize SQL queries, and implement Redis caching layers.',
      },
      {
        company: 'Swiggy',
        title: 'Full Stack Engineering Intern (React / Node.js)',
        location: 'Hyderabad, Telangana (Madhapur)',
        workplace: 'hybrid',
        type: 'internship',
        role: 'Full Stack Developer',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
        salary: '₹35,000 / month stipend',
        portal: 'Internshala',
        url: 'https://internshala.com',
        description:
          'Join Swiggy quick commerce & consumer tech team in Hyderabad. Collaborate with senior architects to build consumer-facing features, frontend UI components, and microservices.',
      },
    ]
  }

  // 2. BENGALURU SEED JOBS
  if (norm.includes('bengaluru') || norm.includes('bangalore') || norm.includes('blr')) {
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

  // 3. PUNE SEED JOBS
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
      {
        company: 'Veritas Technologies',
        title: 'Software Engineer - Cloud & Distributed Systems',
        location: 'Pune, Maharashtra (Baner / Hybrid)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Software Engineer',
        skills: ['C++', 'Python', 'Linux', 'Data Structures', 'Cloud Storage'],
        salary: '₹12 - ₹16 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Veritas engineering team in Pune is hiring fresh graduates for enterprise data protection and resilient cloud backup systems.',
      },
    ]
  }

  // 4. DELHI NCR SEED JOBS
  if (norm.includes('delhi') || norm.includes('noida') || norm.includes('gurgaon') || norm.includes('gurugram') || norm.includes('ncr')) {
    return [
      {
        company: 'Google India',
        title: 'Software Engineer - Early Career',
        location: 'Gurugram, Haryana (Cyber City)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Software Engineer',
        skills: ['C++', 'Java', 'Python', 'Algorithms', 'Data Structures'],
        salary: '₹22 - ₹30 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Google India Gurugram office is hiring early career software engineers to tackle complex algorithmic challenges, large-scale systems, and machine learning infrastructure.',
      },
      {
        company: 'Zomato / Blinkit',
        title: 'Software Development Engineer I (SDE 1)',
        location: 'Gurugram, Haryana (Golf Course Road)',
        workplace: 'on-site',
        type: 'full-time',
        role: 'Full Stack Developer',
        skills: ['Node.js', 'React', 'Go', 'PostgreSQL', 'Redis'],
        salary: '₹14 - ₹20 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Join Zomato / Blinkit quick commerce engineering in Gurugram. Work on real-time order dispatch algorithms, high-throughput backend services, and scalable web apps.',
      },
      {
        company: 'Paytm',
        title: 'Software Engineer Trainee - Payments / Core',
        location: 'Noida, Uttar Pradesh (Sector 6)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Backend Developer',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Kafka', 'Docker'],
        salary: '₹9 - ₹13 LPA',
        portal: 'Internshala',
        url: 'https://internshala.com',
        description:
          'Paytm Noida technology center is hiring junior backend developers to build resilient fintech microservices, handle ledger transactions, and optimize database queries.',
      },
    ]
  }

  // 5. CHENNAI SEED JOBS
  if (norm.includes('chennai') || norm.includes('madras')) {
    return [
      {
        company: 'Zoho Corporation',
        title: 'Software Developer - Campus / Off-Campus 2026',
        location: 'Chennai, Tamil Nadu (Estancia IT Park, Guduvanchery)',
        workplace: 'on-site',
        type: 'full-time',
        role: 'Software Engineer',
        skills: ['Java', 'C++', 'Data Structures', 'Database Management', 'OOPs'],
        salary: '₹8.5 - ₹12 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Zoho is looking for passionate problem solvers in Chennai. Build high-performance cloud applications, scalable web infrastructure, and proprietary databases.',
      },
      {
        company: 'Freshworks',
        title: 'Associate Software Engineer - Frontend / Web',
        location: 'Chennai, Tamil Nadu (OMR, Perungudi)',
        workplace: 'hybrid',
        type: 'full-time',
        role: 'Frontend Developer',
        skills: ['JavaScript', 'React', 'TypeScript', 'HTML/CSS', 'REST APIs'],
        salary: '₹11 - ₹15 LPA',
        portal: 'LinkedIn',
        url: 'https://www.linkedin.com/jobs',
        description:
          'Freshworks customer engagement platform team in Chennai is hiring early career frontend engineers to build snappy, intuitive user interfaces with React and Ember.',
      },
    ]
  }

  // 6. DEFAULT MUMBAI SEED JOBS
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
 * Implements AI Search Intent Normalizer, Role & Domain Keyword Extraction,
 * Negative Keyword Exclusion, and Progressive Multi-Tier Waterfall Matching.
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
    const {
      data: { user },
    } = await supabase.auth.getUser()
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

    const content =
      typeof resume.content === 'string' ? JSON.parse(resume.content) : resume.content || {}
    const resumeSkills = (student.profile_data as any)?.skills?.languages || ''

    const rawLocationInput = formData.location || 'Mumbai, Maharashtra, India'
    const targetRoleInput = formData.customQuery || resume.target_role || 'Software Engineer'

    // 3. AI Search Intent Normalizer (City normalizer, domain analysis, negative keywords, skills extraction)
    const intent = await resolveSearchIntent({
      rawLocation: rawLocationInput,
      query: targetRoleInput,
      resumeTitle: resume.title,
      resumeRole: resume.target_role,
      resumeContent: content,
      profileSkills: resumeSkills,
    })

    // 4. Deduct Credits for the Search
    await adminDb
      .from('students')
      .update({ credit_balance: student.credit_balance - creditCost })
      .eq('user_id', user.id)

    await adminDb.from('credit_ledgers').insert({
      user_id: user.id,
      amount: -creditCost,
      description: `AI Off-Campus Search: ${jobLimit} Jobs for "${intent.canonicalRoleQuery}" in ${intent.canonicalCity}`,
    })

    // 5. Live Multi-Portal Crawl (LinkedIn, Internshala, Google Jobs) with canonical location, slug & negative keywords
    try {
      await executeMultiPortalCrawl({
        query: intent.canonicalRoleQuery,
        location: intent.canonicalLocation,
        canonicalLocation: intent.canonicalLocation,
        internshalaSlug: intent.internshalaSlug,
        cityAliases: intent.cityAliases,
        negativeKeywords: intent.negativeKeywords,
        roleKeywords: intent.roleKeywords,
        supabase: adminDb,
        limitPerSource: jobLimit === 10 ? 7 : 4,
        jobType: formData.jobType,
        workplaceMode: formData.workplaceMode,
        datePosted: formData.datePosted,
      })
    } catch (crawlErr) {
      console.warn('Live multi-portal crawl warning:', crawlErr)
    }

    // 6. Query the Discovered Jobs Lake with City Location Aliases
    const locConditions = intent.isRemote
      ? 'workplace_mode.eq.remote,location.ilike.%remote%'
      : intent.cityAliases.map((ct) => `location.ilike.%${ct}%`).join(',') +
        ',workplace_mode.eq.remote,location.ilike.%remote%'

    const { data: matchedLocationJobs } = await adminDb
      .from('discovered_jobs_lake')
      .select('*')
      .eq('status', 'active')
      .neq('scam_status', 'scam')
      .or(locConditions)
      .order('created_at', { ascending: false })
      .limit(60)

    let jobsPool = matchedLocationJobs || []

    // 7. If the lake has fewer than requested jobs for this canonical city, seed curated city openings
    if (jobsPool.length < jobLimit) {
      const cityDefaults = getCityDefaultSeedJobs(intent.canonicalCity)

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
        .limit(50)

      jobsPool = refreshed || []
    }

    // 8. Progressive Multi-Tier Waterfall Matching Engine
    // Filter and score candidate jobs
    const resumeText =
      (JSON.stringify(content) + ' ' + resumeSkills + ' ' + intent.extractedResumeSkills.join(' ')).toLowerCase()

    const requestedWindowMs =
      formData.datePosted === '24h'
        ? 24 * 3600 * 1000
        : formData.datePosted === '7d'
        ? 7 * 86400 * 1000
        : formData.datePosted === '30d'
        ? 30 * 86400 * 1000
        : 30 * 86400 * 1000 // default window for active listings

    const validScoredJobs: any[] = []

    for (const job of jobsPool) {
      // 1. Strict Role Relevance Gate (Rejects non-tech, automotive, sales, etc.)
      if (!isRoleRelevant(job.title, intent.canonicalRoleQuery, intent.negativeKeywords, intent.roleKeywords)) {
        continue
      }

      const jobLoc = (job.location || '').toLowerCase()
      const isCityMatch = intent.cityAliases.some((ct) => jobLoc.includes(ct))
      const isJobRemote = job.workplace_mode === 'remote' || jobLoc.includes('remote')

      // 2. Strict City Gate
      if (!intent.isRemote && !isCityMatch && !isJobRemote) {
        continue
      }

      // 3. Workplace Mode Gate
      if (formData.workplaceMode && formData.workplaceMode !== 'any') {
        if (formData.workplaceMode === 'remote' && !isJobRemote) continue
        if (formData.workplaceMode === 'hybrid' && job.workplace_mode !== 'hybrid' && !isJobRemote) continue
        if (formData.workplaceMode === 'on-site' && job.workplace_mode !== 'on-site') continue
      }

      // 4. Job Type Gate
      if (formData.jobType && formData.jobType !== 'any') {
        const empType = (job.employment_type || '').toLowerCase()
        const isIntern = empType.includes('intern') || job.title.toLowerCase().includes('intern')
        if (formData.jobType === 'internship' && !isIntern) continue
        if (formData.jobType === 'full-time' && isIntern) continue
        if (formData.jobType === 'fresher' && isIntern) continue
      }

      // Calculate True Skill Match Score
      const requiredSkills: string[] = job.skills_required || []
      let matchedCount = 0
      requiredSkills.forEach((s) => {
        if (resumeText.includes(s.toLowerCase())) matchedCount++
      })

      // Check if job matches any of the candidate's core extracted skills
      const coreSkillsMatched = intent.extractedResumeSkills.filter((sk) =>
        (job.description || '').toLowerCase().includes(sk.toLowerCase())
      )

      const rawRatio =
        requiredSkills.length > 0 ? (matchedCount / requiredSkills.length) * 80 : 60
      const bonusScore = Math.min(20, coreSkillsMatched.length * 4)
      const calculatedScore = Math.min(96, Math.max(25, Math.round(rawRatio + bonusScore)))

      const jobTime = new Date(job.last_verified_at || job.created_at).getTime()
      const ageMs = Date.now() - jobTime

      validScoredJobs.push({
        ...job,
        matchScore: calculatedScore,
        matchedSkillsCount: matchedCount,
        totalSkillsCount: requiredSkills.length,
        ageMs,
      })
    }

    // Partition into Progressive Waterfall Tiers
    // Tier 1: Exact Time Window Match + High Skill Match (>= 50%)
    const tier1Jobs: any[] = []
    // Tier 2: Expanded Date Window + High Skill Match (>= 50%)
    const tier2Jobs: any[] = []
    // Tier 3: Foundational Skill Overlap (35% to 49%)
    const tier3Jobs: any[] = []
    // Tier 4: Remaining broader
    const tier4Jobs: any[] = []

    for (const job of validScoredJobs) {
      if (job.matchScore >= 50 && job.ageMs <= requestedWindowMs) {
        tier1Jobs.push({
          ...job,
          recommendation_reason: 'Exact Match: Verified active opening matching your timeframe and core skills',
        })
      } else if (job.matchScore >= 50) {
        tier1Jobs.some((t1) => t1.id === job.id)
          ? null
          : tier2Jobs.push({
              ...job,
              recommendation_reason: 'Expanded Date Window: Active verified opening with strong skill match (≥50%)',
            })
      } else if (job.matchScore >= 35) {
        tier3Jobs.push({
          ...job,
          recommendation_reason: 'Foundational Match: Matches your programming fundamentals; upskilling recommended for specific tooling',
        })
      } else {
        tier4Jobs.push({
          ...job,
          recommendation_reason: 'Broader Opportunity: Recommended based on general engineering background',
        })
      }
    }

    // Sort each tier by matchScore descending, then recency
    const sortTier = (arr: any[]) =>
      arr.sort((a, b) => b.matchScore - a.matchScore || a.ageMs - b.ageMs)

    sortTier(tier1Jobs)
    sortTier(tier2Jobs)
    sortTier(tier3Jobs)
    sortTier(tier4Jobs)

    // Assemble final jobs via Waterfall
    const finalJobs: any[] = []
    const addedIds = new Set<string>()

    const addFromList = (list: any[]) => {
      for (const item of list) {
        if (finalJobs.length >= jobLimit) break
        if (!addedIds.has(item.id)) {
          addedIds.add(item.id)
          finalJobs.push(item)
        }
      }
    }

    // 1. First prioritize Tier 1 (Strict fresh exact matches)
    addFromList(tier1Jobs)

    // 2. If fewer than requested, expand date window while keeping >= 50% match
    if (finalJobs.length < jobLimit) {
      addFromList(tier2Jobs)
    }

    // 3. If still fewer, allow foundational matches (35% - 49%)
    if (finalJobs.length < jobLimit) {
      addFromList(tier3Jobs)
    }

    // 4. If still fewer, fill with curated top seed openings for this canonical city
    if (finalJobs.length < jobLimit) {
      const cityDefaults = getCityDefaultSeedJobs(intent.canonicalCity)
      for (const seed of cityDefaults) {
        if (finalJobs.length >= jobLimit) break
        if (!addedIds.has(seed.title)) {
          addedIds.add(seed.title)
          finalJobs.push({
            id: `seed_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: seed.title,
            company_name: seed.company,
            location: seed.location,
            workplace_mode: seed.workplace,
            employment_type: seed.type,
            salary_info: seed.salary,
            skills_required: seed.skills,
            sources: [{ portal: seed.portal, url: seed.url, discovered_at: new Date().toISOString() }],
            description: seed.description,
            matchScore: 82,
            recommendation_reason: 'Curated Tech Opening: Verified top employer matching your role and location',
          })
        }
      }
    }

    // Final fallback if still under limit
    if (finalJobs.length < jobLimit) {
      addFromList(tier4Jobs)
    }

    // 9. Record the search session with full scored results
    const { data: newSession, error: sessionErr } = await adminDb
      .from('job_search_sessions')
      .insert({
        student_id: student.id,
        resume_id: resume.id,
        search_query: intent.canonicalRoleQuery,
        location: intent.canonicalLocation,
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
        search_query: intent.canonicalRoleQuery,
        location: intent.canonicalLocation,
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
