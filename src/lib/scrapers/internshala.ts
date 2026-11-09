/**
 * Internshala Public Web Scraper
 * Extracts fresher jobs and internship listings from public HTML
 */

export interface InternshalaJobCard {
  id: string
  title: string
  company: string
  location: string
  stipend: string
  url: string
}

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
}

function getCityAliases(rawLocation: string, internshalaSlug?: string): string[] {
  if (internshalaSlug) {
    return [internshalaSlug]
  }
  const norm = rawLocation.toLowerCase()
  if (norm.includes('bengaluru') || norm.includes('bangalore') || norm.includes('blr')) {
    return ['bengaluru']
  }
  if (
    norm.includes('mumbai') ||
    norm.includes('bombay') ||
    norm.includes('thane') ||
    norm.includes('navi mumbai') ||
    norm.includes('bkc')
  ) {
    return ['mumbai', 'navi-mumbai']
  }
  if (norm.includes('pune') || norm.includes('hinjewadi')) {
    return ['pune']
  }
  if (
    norm.includes('delhi') ||
    norm.includes('noida') ||
    norm.includes('gurgaon') ||
    norm.includes('gurugram') ||
    norm.includes('ncr')
  ) {
    return ['delhi', 'noida', 'gurgaon']
  }
  if (
    norm.includes('hyderabad') ||
    norm.includes('hydrabad') ||
    norm.includes('secunderabad') ||
    norm.includes('cyberabad')
  ) {
    return ['hyderabad']
  }
  if (norm.includes('chennai') || norm.includes('madras')) {
    return ['chennai']
  }
  if (norm.includes('kolkata') || norm.includes('calcutta')) {
    return ['kolkata']
  }
  if (norm.includes('remote') || norm.includes('wfh') || norm.includes('work from home')) {
    return ['work-from-home']
  }
  const clean = rawLocation.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return [clean || 'mumbai']
}

export async function searchInternshalaPublic(options: {
  query: string
  location?: string
  internshalaSlug?: string
  limit?: number
  jobType?: string
  workplaceMode?: string
}): Promise<InternshalaJobCard[]> {
  try {
    const rawLoc = options.workplaceMode === 'remote' ? 'remote' : (options.location || 'Mumbai')
    const cityAliases = getCityAliases(rawLoc, options.internshalaSlug)
    const cleanQuery = (options.query || 'software-developer').toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const urls: string[] = []
    for (const city of cityAliases) {
      if (!options.jobType || options.jobType === 'any' || options.jobType === 'full-time' || options.jobType === 'fresher') {
        urls.push(`https://internshala.com/jobs/${cleanQuery}-jobs-in-${city}/`)
      }
      if (!options.jobType || options.jobType === 'any' || options.jobType === 'internship') {
        urls.push(`https://internshala.com/internships/${cleanQuery}-internships-in-${city}/`)
      }
    }

    const limit = options.limit || 5
    const cards: InternshalaJobCard[] = []

    for (const targetUrl of urls) {
      if (cards.length >= limit) break

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: controller.signal,
        })

        clearTimeout(timeout)
        if (!response.ok) continue

        const html = await response.text()
        const chunks = html.split(/class="[^"]*individual_internship[^"]*"/).slice(1)

        for (const chunk of chunks) {
          if (cards.length >= limit) break

          const titleMatch = chunk.match(/class="[^"]*job-internship-name[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
          if (!titleMatch) continue
          const title = stripTags(titleMatch[1])

          const linkMatch = chunk.match(/href="([^"]+)"/i)
          const relativeUrl = linkMatch ? linkMatch[1] : ''
          const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : `https://internshala.com${relativeUrl}`

          // Cross-city leak prevention: If search is city-specific, reject URLs that explicitly indicate other cities
          if (options.internshalaSlug && options.internshalaSlug !== 'work-from-home') {
            const lowerUrl = fullUrl.toLowerCase()
            if (lowerUrl.includes('-job-in-') || lowerUrl.includes('-internship-in-')) {
              if (!lowerUrl.includes(`-in-${options.internshalaSlug}`)) {
                // If it belongs to a completely different city, skip it
                continue
              }
            }
          }

          const companyMatch =
            chunk.match(/class="[^"]*company_name[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
            chunk.match(/class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\//i)
          const company = companyMatch ? stripTags(companyMatch[1]) : 'Startup Partner'

          const locMatch =
            chunk.match(/class="[^"]*locations[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
            chunk.match(/class="[^"]*location_link[^"]*"[^>]*>([\s\S]*?)<\/a>/i)
          const location = locMatch ? stripTags(locMatch[1]) : rawLoc.split(',')[0].trim()

          const stipendMatch =
            chunk.match(/class="[^"]*stipend[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
            chunk.match(/class="[^"]*salary[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
          const stipend = stipendMatch ? stripTags(stipendMatch[1]) : 'Competitive'

          const idMatch = chunk.match(/id="individual_internship_(\d+)"/i) || chunk.match(/data-internship_id="(\d+)"/i)
          const id = idMatch ? idMatch[1] : `ishala_${Math.random().toString(36).substring(7)}`

          if (!cards.some((c) => c.url === fullUrl)) {
            cards.push({
              id,
              title,
              company,
              location,
              stipend,
              url: fullUrl,
            })
          }
        }
      } catch (err) {
        continue
      }
    }

    return cards
  } catch (err) {
    console.error('Internshala scrape failed:', err)
    return []
  }
}
