import { searchLinkedInGuest, fetchLinkedInDetail } from './linkedin'
import { searchGoogleJobs } from './serper'
import { searchInternshalaPublic } from './internshala'
import { sanitizeAndGuardPosting } from '@/lib/posting-guard'
import { generateCanonicalJobKey, generateContentHash } from '@/lib/job-key'

export interface CrawlResult {
  totalDiscovered: number
  lakeUpserted: number
  jobs: any[]
}

const TECH_SYNONYMS = new Set([
  'software',
  'developer',
  'engineer',
  'frontend',
  'backend',
  'fullstack',
  'full-stack',
  'web',
  'programmer',
  'coding',
  'coder',
  'tech',
  'technical',
  'technology',
  'system',
  'analyst',
  'qa',
  'tester',
  'testing',
  'devops',
  'cloud',
  'data',
  'ai',
  'ml',
  'intern',
  'trainee',
  'react',
  'node',
  'java',
  'python',
  'javascript',
  'typescript',
  'c++',
  '.net',
  'ui',
  'ux',
])

export function isRoleRelevant(jobTitle: string, query: string): boolean {
  const titleNorm = jobTitle.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  const titleWords = titleNorm.split(/\s+/).filter((w) => w.length > 2)
  const queryNorm = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  const queryWords = queryNorm.split(/\s+/).filter((w) => w.length > 2)

  // Direct word overlap with user query
  const hasDirectMatch = queryWords.some((qw) => titleWords.includes(qw))
  if (hasDirectMatch) return true

  // Tech domain synonym overlap
  const isQueryTech = queryWords.some((qw) => TECH_SYNONYMS.has(qw))
  const isTitleTech = titleWords.some((tw) => TECH_SYNONYMS.has(tw))

  return isQueryTech && isTitleTech
}

function extractSkillsForRole(title: string, roleQuery: string): string[] {
  const t = title.toLowerCase()
  const q = roleQuery.toLowerCase()
  const skills = new Set<string>()

  if (t.includes('react') || q.includes('react')) {
    skills.add('React')
    skills.add('JavaScript')
    skills.add('TypeScript')
  }
  if (t.includes('next') || q.includes('next')) {
    skills.add('Next.js')
    skills.add('React')
  }
  if (t.includes('frontend') || q.includes('frontend') || t.includes('ui')) {
    skills.add('JavaScript')
    skills.add('React')
    skills.add('HTML & CSS')
  }
  if (t.includes('backend') || q.includes('backend')) {
    skills.add('Node.js')
    skills.add('REST APIs')
    skills.add('SQL Databases')
  }
  if (t.includes('full stack') || t.includes('fullstack') || q.includes('full')) {
    skills.add('JavaScript')
    skills.add('React')
    skills.add('Node.js')
    skills.add('PostgreSQL')
  }
  if (t.includes('java') || q.includes('java')) {
    skills.add('Java')
    skills.add('Spring Boot')
    skills.add('OOPs')
  }
  if (t.includes('python') || q.includes('python')) {
    skills.add('Python')
    skills.add('Django / Flask')
  }
  if (t.includes('.net') || t.includes('c#')) {
    skills.add('.NET Core')
    skills.add('C#')
    skills.add('SQL Server')
  }
  if (t.includes('tester') || t.includes('testing') || t.includes('qa')) {
    skills.add('Software Testing')
    skills.add('Test Automation')
    skills.add('Selenium / Cypress')
  }
  if (t.includes('intern') || t.includes('trainee')) {
    skills.add('Git & GitHub')
  }

  // Foundational engineering skills
  skills.add('Problem Solving')
  skills.add('Data Structures & Algorithms')

  return Array.from(skills).slice(0, 5)
}

/**
 * Orchestrates multi-portal search across LinkedIn, Internshala, and Google Jobs (Naukri/Indeed).
 * Applies Posting Guard (anti-scam), Role Relevance Filtering, and Canonical Deduplication.
 */
export async function executeMultiPortalCrawl(options: {
  query: string
  location?: string
  supabase: any
  limitPerSource?: number
  jobType?: string
  workplaceMode?: string
  datePosted?: string
}): Promise<CrawlResult> {
  const {
    query,
    location = 'Mumbai, Maharashtra, India',
    supabase,
    limitPerSource = 5,
    jobType,
    workplaceMode,
    datePosted,
  } = options

  // 1. Run multi-source crawlers in parallel with graceful error isolation
  const [linkedInJobs, googleJobs, internshalaJobs] = await Promise.all([
    searchLinkedInGuest({
      query,
      location,
      limit: limitPerSource,
      jobType,
      workplaceMode,
      datePosted,
    }).catch((e) => {
      console.warn('LinkedIn crawler error:', e)
      return []
    }),
    searchGoogleJobs({ query, location, limit: limitPerSource }).catch((e) => {
      console.warn('Google Jobs crawler error:', e)
      return []
    }),
    searchInternshalaPublic({
      query,
      location,
      limit: limitPerSource,
      jobType,
      workplaceMode,
    }).catch((e) => {
      console.warn('Internshala crawler error:', e)
      return []
    }),
  ])

  const rawCandidates: any[] = []

  // Format LinkedIn results
  linkedInJobs.forEach((j) => {
    rawCandidates.push({
      title: j.title,
      company: j.company || 'Tech Employer',
      location: j.location || location,
      portal: 'LinkedIn',
      url: j.url,
      portalId: j.id,
      description: `${j.title} opening at ${j.company || 'Tech Employer'} in ${j.location || location}. Key technical competencies: ${query}.`,
      salary: 'Competitive / As per industry standards',
    })
  })

  // Format Google Jobs results (Naukri, Indeed, Glassdoor)
  googleJobs.forEach((j) => {
    rawCandidates.push({
      title: j.title,
      company: j.company,
      location: j.location,
      portal: j.source,
      url: j.url,
      portalId: j.id,
      description: j.description || `${j.title} role at ${j.company}. Relevant skills: ${query}.`,
      salary: j.salary || 'Best in Industry',
    })
  })

  // Format Internshala results
  internshalaJobs.forEach((j) => {
    rawCandidates.push({
      title: j.title,
      company: j.company,
      location: j.location,
      portal: 'Internshala',
      url: j.url,
      portalId: j.id,
      description: `${j.title} fresher/internship position at ${j.company} in ${j.location}. Monthly stipend: ${j.stipend}.`,
      salary: j.stipend,
    })
  })

  let upsertedCount = 0
  const processedJobs: any[] = []

  // 2. Sanitize with Posting Guard and write to Discovered Jobs Lake
  for (const item of rawCandidates) {
    // A. Strict Role Relevance Gate (Rejects promoted unrelated postings like Food Technologist, Delivery, Chef, Sales)
    if (!isRoleRelevant(item.title, query)) {
      continue
    }

    const guard = sanitizeAndGuardPosting(item.description, item.company)

    // Skip malicious injection payloads or high-confidence scams
    if (guard.hasPromptInjection || guard.scamStatus === 'scam') {
      continue
    }

    const canonicalKey = generateCanonicalJobKey(item.company, item.title, item.portal)
    const contentHash = generateContentHash(guard.cleanText)
    const skills = extractSkillsForRole(item.title, query)

    const payload = {
      canonical_key: canonicalKey,
      title: item.title,
      company_name: item.company,
      location: item.location,
      workplace_mode: item.title.toLowerCase().includes('remote') ? 'remote' : 'hybrid',
      employment_type: item.title.toLowerCase().includes('intern') ? 'internship' : 'full-time',
      description: guard.cleanText,
      content_hash: contentHash,
      primary_role: query,
      skills_required: skills,
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
    }

    const { data, error } = await supabase
      .from('discovered_jobs_lake')
      .upsert(payload, { onConflict: 'canonical_key' })
      .select('*')
      .single()

    if (!error && data) {
      upsertedCount++
      processedJobs.push(data)
    }
  }

  return {
    totalDiscovered: rawCandidates.length,
    lakeUpserted: upsertedCount,
    jobs: processedJobs,
  }
}
