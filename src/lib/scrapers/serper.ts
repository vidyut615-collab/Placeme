/**
 * Serper.dev Google Jobs API Client
 * Meta-aggregator for Naukri, Indeed, Glassdoor, Foundit, and Company Career Portals
 */

export interface GoogleJobItem {
  id: string
  title: string
  company: string
  location: string
  description: string
  source: string // e.g. "via Naukri.com", "via Indeed"
  url: string
  salary?: string
}

export async function searchGoogleJobs(options: {
  query: string
  location?: string
  limit?: number
}): Promise<GoogleJobItem[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    // If API key is not configured, return empty array gracefully
    return []
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('https://google.serper.dev/jobs', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${options.query} ${options.location || 'Mumbai'}`,
        gl: 'in',
        hl: 'en',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.warn(`Serper.dev returned ${response.status}`)
      return []
    }

    const data = await response.json()
    const jobs = data.jobs || []

    return jobs.slice(0, options.limit || 10).map((j: any, i: number) => ({
      id: j.jobId || `google_${Date.now()}_${i}`,
      title: j.title || 'Software Role',
      company: j.company || 'Tech Company',
      location: j.location || options.location || 'Mumbai, India',
      description: j.description || j.snippet || '',
      source: j.via || 'Google Jobs',
      url: j.link || j.applyLink || '#',
      salary: j.salary,
    }))
  } catch (err) {
    console.error('Serper Google Jobs search failed:', err)
    return []
  }
}
