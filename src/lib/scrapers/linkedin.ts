/**
 * LinkedIn Guest API Scraper
 * Ported directly from ai-job-search/linkedin-search
 * No credentials required. Uses public unauthenticated endpoints.
 */

export const SEARCH_URL =
  'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search'
export const DETAIL_URL =
  'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export interface LinkedInJobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  )
}

/**
 * Parses job cards from LinkedIn's guest search HTML response
 */
export function parseLinkedInCards(html: string): LinkedInJobCard[] {
  const results: LinkedInJobCard[] = []
  const chunks = html.split(/data-entity-urn="urn:li:jobPosting:/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^(\d+)/)
    if (!idMatch) continue
    const id = idMatch[1]

    const linkMatch = chunk.match(/class="base-card__full-link[^"]*"[^>]*href="([^"]+)"/i)
    const url = linkMatch ? decodeHtmlEntities(linkMatch[1]).split('?')[0] : `https://www.linkedin.com/jobs/view/${id}`

    let title: string | null = null
    const h3 = chunk.match(/class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i)
    if (h3) title = stripTags(h3[1])
    if (!title) {
      const sr = chunk.match(/class="sr-only"[^>]*>([\s\S]*?)<\/span>/i)
      if (sr) title = stripTags(sr[1])
    }
    if (!title) continue

    let company: string | null = null
    const sub = chunk.match(/class="base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/i)
    if (sub) {
      company = stripTags(sub[1]) || null
    }

    const loc = chunk.match(/class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i)
    const location = loc ? stripTags(loc[1]) || null : null

    const time = chunk.match(/<time[^>]*datetime="([^"]*)"[^>]*>([\s\S]*?)<\/time>/i)
    const date = time ? stripTags(time[2]) || time[1] || null : null

    results.push({
      id,
      title,
      company,
      location,
      date,
      url,
    })
  }

  return results
}

/**
 * Searches LinkedIn public job listings without authentication
 */
export async function searchLinkedInGuest(options: {
  query: string
  location?: string
  limit?: number
  jobType?: string
  workplaceMode?: string
  datePosted?: string
}): Promise<LinkedInJobCard[]> {
  try {
    const params = new URLSearchParams()
    if (options.query) params.set('keywords', options.query)
    params.set('location', options.location || 'Mumbai, Maharashtra, India')
    params.set('start', '0')

    // Job Type filter
    if (options.jobType === 'internship') {
      params.set('f_JT', 'I')
    } else if (options.jobType === 'full-time') {
      params.set('f_JT', 'F')
    } else if (options.jobType === 'fresher') {
      params.set('f_E', '2')
    }

    // Workplace Mode filter
    if (options.workplaceMode === 'remote') {
      params.set('f_WT', '2')
    } else if (options.workplaceMode === 'on-site') {
      params.set('f_WT', '1')
    } else if (options.workplaceMode === 'hybrid') {
      params.set('f_WT', '3')
    }

    // Date Posted filter
    if (options.datePosted === '24h') {
      params.set('f_TPR', 'r86400')
    } else if (options.datePosted === '7d') {
      params.set('f_TPR', 'r604800')
    } else if (options.datePosted === '30d') {
      params.set('f_TPR', 'r2592000')
    }

    const url = `${SEARCH_URL}?${params.toString()}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`LinkedIn guest search returned status ${response.status}`)
      return []
    }

    const html = await response.text()
    const cards = parseLinkedInCards(html)

    return options.limit ? cards.slice(0, options.limit) : cards
  } catch (err) {
    console.error('LinkedIn guest search failed:', err)
    return []
  }
}

/**
 * Fetches full job description for a specific LinkedIn job ID
 */
export async function fetchLinkedInDetail(jobId: string): Promise<string | null> {
  try {
    const url = `${DETAIL_URL}/${jobId}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)
    if (!response.ok) return null

    const html = await response.text()
    // Extract description section
    const descMatch = html.match(/class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (descMatch) {
      return stripTags(descMatch[1])
    }
    return stripTags(html).slice(0, 2000)
  } catch {
    return null
  }
}
