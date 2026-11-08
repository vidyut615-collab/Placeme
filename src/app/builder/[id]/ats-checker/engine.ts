import { ProfileData, ResumeDataState } from '../templates/types'

export interface ATSIssue {
  id: string
  category: 'contact' | 'dates' | 'layout' | 'sections' | 'writing' | 'jobMatch'
  severity: 'blocker' | 'warning' | 'tip'
  title: string
  description: string
  canAutoFix: boolean
  fixActionType?: 'clean_bullets' | 'fix_weak_verbs' | 'standardize_dates' | 'fit_to_one_page' | 'clean_linkedin'
  fixLabel?: string
}

export interface ATSCheckResult {
  score: number // 0 to 100
  statusText: string
  issues: ATSIssue[]
  categoryStats: {
    contact: { passed: number; total: number }
    dates: { passed: number; total: number }
    layout: { passed: number; total: number }
    sections: { passed: number; total: number }
    writing: { passed: number; total: number }
  }
  jobMatch: {
    score: number // 0 to 100
    matched: string[]
    missing: string[]
  }
  rawParserText: string
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function standardizeSingleDate(str?: string): string {
  if (!str) return ''
  const trimmed = str.trim()
  if (/^present$/i.test(trimmed)) return 'Present'

  // Match MM/YYYY or M/YYYY
  const slashMatch = trimmed.match(/^(\d{1,3})\/(\d{4})$/)
  if (slashMatch) {
    let m = parseInt(slashMatch[1], 10)
    // Handle typos like 018 -> 1
    if (m > 12) m = parseInt(String(m).slice(-1), 10) || 1
    const y = slashMatch[2]
    return `${MONTH_NAMES[m - 1] || 'Jan'} ${y}`
  }

  // Match YYYY-MM
  const dashMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/)
  if (dashMatch) {
    const y = dashMatch[1]
    const m = parseInt(dashMatch[2], 10)
    return `${MONTH_NAMES[m - 1] || 'Jan'} ${y}`
  }

  return trimmed
}

const WEAK_VERB_MAP: Array<{ regex: RegExp; replacement: string }> = [
  { regex: /\bresponsible for designing\b/gi, replacement: 'Designed' },
  { regex: /\bresponsible for developing\b/gi, replacement: 'Developed' },
  { regex: /\bresponsible for building\b/gi, replacement: 'Built' },
  { regex: /\bresponsible for leading\b/gi, replacement: 'Led' },
  { regex: /\bresponsible for\b/gi, replacement: 'Managed' },
  { regex: /\bworked on developing\b/gi, replacement: 'Developed' },
  { regex: /\bworked on building\b/gi, replacement: 'Engineered' },
  { regex: /\bworked on\b/gi, replacement: 'Engineered' },
  { regex: /\bhelped with\b/gi, replacement: 'Collaborated on' },
  { regex: /\bassisted in\b/gi, replacement: 'Contributed to' },
  { regex: /\bhandled\b/gi, replacement: 'Orchestrated' },
  { regex: /\bwas in charge of\b/gi, replacement: 'Directed' },
]

export function formatBulletLines(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .map(line => {
      let trimmed = line.trim()
      if (!trimmed) return ''
      // Ensure bullet prefix
      trimmed = trimmed.replace(/^[-*•]\s*/, '').trim()
      if (!trimmed) return ''
      // Capitalize first letter
      trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
      // Remove trailing double punctuation
      trimmed = trimmed.replace(/[.,;:]+$/, '')
      return `- ${trimmed}.`
    })
    .filter(Boolean)
    .join('\n')
}

export function evaluateResumeQuality(
  profile: ProfileData,
  resumeData: ResumeDataState,
  targetJdText: string = ''
): ATSCheckResult {
  const issues: ATSIssue[] = []

  let contactPassed = 0
  const contactTotal = 5

  let datesPassed = 0
  const datesTotal = 4

  let layoutPassed = 0
  const layoutTotal = 4

  let sectionsPassed = 0
  const sectionsTotal = 5

  let writingPassed = 0
  const writingTotal = 5

  // 1. CONTACT CHECKS
  const email = profile.basic?.email || profile.email
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    contactPassed++
  } else {
    issues.push({
      id: 'contact_email',
      category: 'contact',
      severity: 'blocker',
      title: 'Valid email address missing',
      description: 'ATS parsers discard applications without a verifiable contact email address.',
      canAutoFix: false
    })
  }

  const phone = profile.basic?.phone || profile.phone
  if (phone && /\d{7,}/.test(phone.replace(/\D/g, ''))) {
    contactPassed++
  } else {
    issues.push({
      id: 'contact_phone',
      category: 'contact',
      severity: 'blocker',
      title: 'Phone number missing or too short',
      description: 'A valid telephone number is required by recruiters and ATS parsers.',
      canAutoFix: false
    })
  }

  const linkedin = resumeData.profile_overrides?.linkedin || profile.links?.linkedin
  if (linkedin && linkedin.trim().length > 0) {
    contactPassed++
    if (linkedin.includes('http') || linkedin.includes('?')) {
      issues.push({
        id: 'contact_linkedin_clean',
        category: 'contact',
        severity: 'tip',
        title: 'LinkedIn URL has extra prefix/trackers',
        description: 'Recruiters prefer clean handles like linkedin.com/in/username over long URLs with query parameters.',
        canAutoFix: true,
        fixActionType: 'clean_linkedin',
        fixLabel: 'Clean LinkedIn Handle'
      })
    } else {
      contactPassed++
    }
  } else {
    issues.push({
      id: 'contact_linkedin',
      category: 'contact',
      severity: 'warning',
      title: 'No LinkedIn link detected',
      description: 'Over 85% of tech recruiters look for a verified LinkedIn profile.',
      canAutoFix: false
    })
  }

  const fullName = profile.basic?.full_name || profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  if (fullName && fullName.length > 2) {
    contactPassed++
  } else {
    issues.push({
      id: 'contact_name',
      category: 'contact',
      severity: 'blocker',
      title: 'Full candidate name missing',
      description: 'Resume header must clearly identify the candidate.',
      canAutoFix: false
    })
  }

  // 2. DATES CHECKS
  let hasInconsistentDates = false
  let allDatesPresent = true

  resumeData.work_histories.forEach(w => {
    if (!w.start_date) allDatesPresent = false
    if (w.start_date && !/^[A-Z][a-z]{2}\s\d{4}$/.test(w.start_date.trim())) {
      hasInconsistentDates = true
    }
    if (w.end_date && w.end_date !== 'Present' && !/^[A-Z][a-z]{2}\s\d{4}$/.test(w.end_date.trim())) {
      hasInconsistentDates = true
    }
  })

  if (allDatesPresent) datesPassed += 2
  else {
    issues.push({
      id: 'dates_missing',
      category: 'dates',
      severity: 'warning',
      title: 'Missing timeline dates',
      description: 'One or more work experiences is missing start or end dates.',
      canAutoFix: false
    })
  }

  if (!hasInconsistentDates) datesPassed += 2
  else {
    issues.push({
      id: 'dates_format',
      category: 'dates',
      severity: 'warning',
      title: 'Inconsistent date formatting',
      description: 'Dates should follow the standard Mon YYYY format (e.g. Sep 2025 – Dec 2025) for chronological parsing.',
      canAutoFix: true,
      fixActionType: 'standardize_dates',
      fixLabel: 'Standardize All Dates'
    })
  }

  // 3. LAYOUT & PAGE FIT CHECKS
  if (resumeData.settings.margin >= 8 && resumeData.settings.margin <= 20) {
    layoutPassed++
  }
  if (resumeData.settings.fontSize >= 9 && resumeData.settings.fontSize <= 12) {
    layoutPassed++
  }

  // Check if content is dense and could overflow into an awkward 2nd page
  const totalEntries = resumeData.work_histories.length + resumeData.projects.length
  if (totalEntries <= 4 && resumeData.settings.pageFit !== '1-page') {
    issues.push({
      id: 'layout_fit_1_page',
      category: 'layout',
      severity: 'tip',
      title: 'Fit comfortably onto 1 page',
      description: 'Your resume has 1-4 key entries which is ideal for a clean, recruiter-preferred single page layout.',
      canAutoFix: true,
      fixActionType: 'fit_to_one_page',
      fixLabel: 'Fit to 1 Page'
    })
    layoutPassed++
  } else {
    layoutPassed += 2
  }

  // 4. SECTIONS CHECKS
  if (resumeData.career_objective.final_edited_text?.trim()) sectionsPassed++
  else issues.push({ id: 'sec_obj', category: 'sections', severity: 'warning', title: 'Missing Career Objective', description: 'A tailored summary anchors your resume for the target job role.', canAutoFix: false })

  if (profile.type || profile.department) sectionsPassed++
  else issues.push({ id: 'sec_edu', category: 'sections', severity: 'blocker', title: 'Missing Education Details', description: 'Academic degree and branch are required for placement screening.', canAutoFix: false })

  if (resumeData.work_histories.length > 0) sectionsPassed++
  if (resumeData.projects.length > 0) sectionsPassed++
  if (profile.skills?.languages || profile.skills?.tools || profile.skills?.frameworks) sectionsPassed++

  // 5. WRITING & BULLETS CHECKS
  let hasWeakVerbs = false
  let hasUnformattedBullets = false

  const allTexts: string[] = [
    ...resumeData.work_histories.map(w => w.final_edited_text || ''),
    ...resumeData.projects.map(p => p.final_edited_text || '')
  ]

  allTexts.forEach(text => {
    if (!text) return
    WEAK_VERB_MAP.forEach(item => {
      if (item.regex.test(text)) hasWeakVerbs = true
    })
    // Check if lines start with lowercase or miss dashes
    const lines = text.split('\n').filter(Boolean)
    lines.forEach(l => {
      const clean = l.trim()
      if (!clean.startsWith('- ') || /^[a-z]/.test(clean.replace(/^[-*•]\s*/, ''))) {
        hasUnformattedBullets = true
      }
    })
  })

  if (!hasWeakVerbs) writingPassed += 2
  else {
    issues.push({
      id: 'writing_weak_verbs',
      category: 'writing',
      severity: 'warning',
      title: 'Passive phrasing detected',
      description: 'Found passive expressions like "responsible for" or "worked on". High-performing resumes use active power verbs (Engineered, Developed, Orchestrated).',
      canAutoFix: true,
      fixActionType: 'fix_weak_verbs',
      fixLabel: 'Replace with Action Verbs'
    })
  }

  if (!hasUnformattedBullets) writingPassed += 3
  else {
    issues.push({
      id: 'writing_bullets',
      category: 'writing',
      severity: 'tip',
      title: 'Bullet point formatting inconsistencies',
      description: 'Some bullet points miss bullet prefixes or start with lowercase characters.',
      canAutoFix: true,
      fixActionType: 'clean_bullets',
      fixLabel: 'Format Bullets Cleanly'
    })
  }

  // 6. JOB MATCH KEYWORD CHECK
  const fullResumeText = [
    fullName,
    profile.skills?.languages,
    profile.skills?.tools,
    profile.skills?.frameworks,
    resumeData.career_objective.final_edited_text,
    ...resumeData.work_histories.map(w => `${w.role} ${w.company} ${w.tech} ${w.final_edited_text}`),
    ...resumeData.projects.map(p => `${p.title} ${p.tech} ${p.final_edited_text}`)
  ].filter(Boolean).join(' ').toLowerCase()

  const rawKeywords = (targetJdText || '')
    .split(/[\s,.;:()\/\[\]]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 3 && !['and', 'the', 'for', 'with', 'that', 'this', 'from', 'have', 'will', 'you', 'are'].includes(w))

  const uniqueJdKeywords = Array.from(new Set(rawKeywords)).slice(0, 20)

  const matchedKeywords: string[] = []
  const missingKeywords: string[] = []

  uniqueJdKeywords.forEach(kw => {
    if (fullResumeText.includes(kw)) {
      matchedKeywords.push(kw)
    } else {
      missingKeywords.push(kw)
    }
  })

  const jobMatchScore = uniqueJdKeywords.length > 0 
    ? Math.round((matchedKeywords.length / uniqueJdKeywords.length) * 100) 
    : 100

  // Total Score Calculation
  const totalChecks = contactTotal + datesTotal + layoutTotal + sectionsTotal + writingTotal
  const passedChecks = contactPassed + datesPassed + layoutPassed + sectionsPassed + writingPassed
  
  // Deduct penalty based on blockers and warnings
  const blockerCount = issues.filter(i => i.severity === 'blocker').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const rawScore = Math.max(0, Math.min(100, Math.round((passedChecks / totalChecks) * 100) - (blockerCount * 15) - (warningCount * 5)))

  let statusText = 'Reads cleanly'
  if (rawScore < 75) statusText = 'Action required'
  else if (rawScore < 90) statusText = 'Good - minor improvements'

  // Construct raw ATS parser text representation
  const rawParserText = `========================================================
             ATS EXTRACTED TEXT STREAM SIMULATOR
========================================================
[CANDIDATE IDENTIFICATION]
Name: ${fullName.toUpperCase()}
Email: ${email || 'N/A'}
Phone: ${phone || 'N/A'}
LinkedIn: ${linkedin || 'N/A'}

[SECTION: CAREER OBJECTIVE]
${resumeData.career_objective.final_edited_text || 'None specified'}

[SECTION: EDUCATION]
Degree: ${profile.type || 'N/A'}
Department: ${profile.department || 'N/A'}
Year: ${profile.year || 'N/A'} | GPA: ${profile.gpa || 'N/A'}

[SECTION: WORK EXPERIENCE]
${resumeData.work_histories.map(w => `
ROLE: ${w.role} | COMPANY: ${w.company}
PERIOD: ${w.start_date || ''} - ${w.end_date || 'Present'}
TECHNOLOGIES: ${w.tech || 'None'}
RESPONSIBILITIES & IMPACT:
${w.final_edited_text || w.original_description}
`).join('\n--------------------------------------------------------\n')}

[SECTION: PROJECTS]
${resumeData.projects.map(p => `
PROJECT: ${p.title}
TECHNOLOGIES: ${p.tech || 'None'}
DETAILS:
${p.final_edited_text || p.original_description}
`).join('\n--------------------------------------------------------\n')}

[SECTION: SKILLS]
Languages: ${profile.skills?.languages || 'N/A'}
Frameworks: ${profile.skills?.frameworks || 'N/A'}
Tools: ${profile.skills?.tools || 'N/A'}
========================================================`

  return {
    score: rawScore,
    statusText,
    issues,
    categoryStats: {
      contact: { passed: contactPassed, total: contactTotal },
      dates: { passed: datesPassed, total: datesTotal },
      layout: { passed: layoutPassed, total: layoutTotal },
      sections: { passed: sectionsPassed, total: sectionsTotal },
      writing: { passed: writingPassed, total: writingTotal }
    },
    jobMatch: {
      score: jobMatchScore,
      matched: matchedKeywords,
      missing: missingKeywords
    },
    rawParserText
  }
}

/**
 * Executes a deterministic one-click auto-fix on the resume data
 */
export function executeOneClickFix(
  resumeData: ResumeDataState,
  profile: ProfileData,
  fixActionType: ATSIssue['fixActionType']
): { updatedResume: ResumeDataState; updatedProfile: ProfileData } {
  const updatedResume: ResumeDataState = JSON.parse(JSON.stringify(resumeData))
  const updatedProfile: ProfileData = JSON.parse(JSON.stringify(profile))

  switch (fixActionType) {
    case 'clean_bullets': {
      updatedResume.work_histories = updatedResume.work_histories.map(w => ({
        ...w,
        final_edited_text: formatBulletLines(w.final_edited_text || w.original_description || ''),
        is_saved: true
      }))
      updatedResume.projects = updatedResume.projects.map(p => ({
        ...p,
        final_edited_text: formatBulletLines(p.final_edited_text || p.original_description || ''),
        is_saved: true
      }))
      break
    }

    case 'fix_weak_verbs': {
      const applyVerbFix = (text: string) => {
        let res = text
        WEAK_VERB_MAP.forEach(item => {
          res = res.replace(item.regex, item.replacement)
        })
        return res
      }
      updatedResume.work_histories = updatedResume.work_histories.map(w => ({
        ...w,
        final_edited_text: applyVerbFix(w.final_edited_text || w.original_description || ''),
        is_saved: true
      }))
      updatedResume.projects = updatedResume.projects.map(p => ({
        ...p,
        final_edited_text: applyVerbFix(p.final_edited_text || p.original_description || ''),
        is_saved: true
      }))
      break
    }

    case 'standardize_dates': {
      updatedResume.work_histories = updatedResume.work_histories.map(w => ({
        ...w,
        start_date: standardizeSingleDate(w.start_date),
        end_date: standardizeSingleDate(w.end_date),
        is_saved: true
      }))
      break
    }

    case 'fit_to_one_page': {
      updatedResume.settings = {
        ...updatedResume.settings,
        pageFit: '1-page',
        margin: 11,
        fontSize: 9.5,
        lineHeight: 1.3
      }
      break
    }

    case 'clean_linkedin': {
      const rawLinkedin = updatedResume.profile_overrides?.linkedin || profile.links?.linkedin || ''
      if (rawLinkedin) {
        let clean = rawLinkedin
          .replace(/^https?:\/\/(www\.)?/, '')
          .replace(/\?.*$/, '')
          .replace(/\/$/, '')
        updatedResume.profile_overrides = {
          ...(updatedResume.profile_overrides || {}),
          linkedin: clean
        }
      }
      break
    }
  }

  return { updatedResume, updatedProfile }
}
