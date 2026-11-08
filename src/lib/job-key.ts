import { createHash } from 'crypto'

/**
 * Normalizes a company name by stripping legal suffixes and special characters.
 */
export function normalizeCompany(name: string): string {
  if (!name) return 'unknown-company'
  return name
    .toLowerCase()
    .replace(/\b(pvt\.?|ltd\.?|private limited|limited|inc\.?|llc|corp\.?|corporation|technologies|solutions|services)\b/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'company'
}

/**
 * Normalizes a job title by collapsing punctuation and standardizing whitespace.
 */
export function normalizeTitle(title: string): string {
  if (!title) return 'job-role'
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove parenthetical notes
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'role'
}

/**
 * Computes a deterministic canonical deduplication key for a job posting.
 * Format: company-slug_title-slug_hash6
 * E.g., 'razorpay_frontend-engineer_a9f1b2'
 */
export function generateCanonicalJobKey(company: string, title: string, portalId?: string): string {
  const compSlug = normalizeCompany(company)
  const titleSlug = normalizeTitle(title)

  const hashInput = `${compSlug}::${titleSlug}::${portalId || ''}`
  const hash = createHash('sha256').update(hashInput).digest('hex').slice(0, 8)

  return `${compSlug}_${titleSlug}_${hash}`
}

/**
 * Computes an MD5 content hash of the sanitized job description to track live drifts/updates.
 */
export function generateContentHash(description: string): string {
  return createHash('md5').update(description.trim()).digest('hex')
}
