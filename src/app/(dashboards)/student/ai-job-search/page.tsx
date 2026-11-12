import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { JobSearchClient } from './JobSearchClient'
import { sanitizeAndGuardPosting } from '@/lib/posting-guard'
import { generateCanonicalJobKey, generateContentHash } from '@/lib/job-key'

export default async function AIJobSearchPage() {
  const supabase = await createClient()
  const adminDb = getAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // 1. Fetch student credits, access, and profile
  const { data: student } = await adminDb
    .from('students')
    .select('id, credit_balance, access_end_date, profile_data')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div className="p-8 text-sm text-[#78716C] dark:text-[#8A847A] font-mono">Error loading candidate profile.</div>
  }

  // 2. Fetch all student's previously generated AI resumes
  const { data: resumes } = await adminDb
    .from('ai_resumes')
    .select('id, title, target_role, target_employer, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 3. Fetch past search sessions conducted by this student
  const { data: pastSessions } = await adminDb
    .from('job_search_sessions')
    .select('*, ai_resumes(title, target_role)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // 4. Fetch all past analyses for this student to pre-fill client memory across reloads
  const { data: pastAnalyses } = await adminDb
    .from('job_match_analyses')
    .select('*')
    .eq('student_id', student.id)

  // 4. Ensure initial seed jobs exist in the lake
  const { count } = await adminDb
    .from('discovered_jobs_lake')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (!count || count < 3) {
    const defaultSeedJobs = [
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

    for (const item of defaultSeedJobs) {
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
  }

  const isActive = Boolean(student.access_end_date && new Date(student.access_end_date) >= new Date())

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <JobSearchClient
        resumes={resumes || []}
        creditBalance={student.credit_balance || 0}
        isActive={isActive}
        initialSessions={pastSessions || []}
        initialAnalyses={pastAnalyses || []}
      />
    </div>
  )
}
