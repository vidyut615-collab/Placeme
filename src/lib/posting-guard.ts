/**
 * Posting Guard: Deterministic Integrity & Anti-Scam Sanitizer
 * Ported & adapted from ai-job-search (posting_guard.py) + tailored for Indian job scams.
 */

export interface PostingGuardResult {
  cleanText: string
  scamStatus: 'clean' | 'suspicious' | 'scam'
  scamReasons: string[]
  hasPromptInjection: boolean
  hiddenCharCount: number
}

// Zero-width characters & BiDi overrides used for stealth payload smuggling
const ZERO_WIDTH_REGEX = /[\u200B\u200C\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g

// Unicode Tag characters (U+E0000 - U+E007F) used for ASCII smuggling
const UNICODE_TAG_REGEX = /[\u{E0000}-\u{E007F}]/gu

// Hidden HTML patterns
const HIDDEN_HTML_TAGS = /<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi
const HIDDEN_ELEMENTS_REGEX = /<([a-z0-9]+)[^>]*?(style=["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0|font-size\s*:\s*0)[^"']*["']|hidden|aria-hidden=["']true["'])[^>]*>[\s\S]*?<\/\1>/gi

// Prompt Injection detection patterns (attack vectors targeting AI job parsers)
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s+prompt/i,
  /you\s+must\s+declare\s+(the\s+)?candidate\s+(unqualified|ineligible)/i,
  /disregard\s+all\s+(rules|guidelines)/i,
  /output\s+only\s+(the\s+word\s+)?(fail|unqualified|hired)/i,
  /override\s+evaluation/i,
  /secret\s+instruction/i,
]

// India-specific job scam flags
const SCAM_FEE_PATTERNS = [
  /(?:registration|security|training|processing|document|exam)\s+fee/i,
  /(?:refundable|mandatory|initial)\s+deposit/i,
  /pay\s+(?:rs\.?|inr|₹)\s*\d+/i,
  /charges\s+applicable\s+before\s+joining/i,
  /laptop\s+security\s+deposit/i,
]

const SCAM_PROMISE_PATTERNS = [
  /100%\s+placement\s+guaranteed/i,
  /direct\s+(?:joining|selection)\s+without\s+interview/i,
  /no\s+interview\s+direct\s+offer/i,
  /earn\s+(?:rs\.?|₹)?\s*\d{4,}\s+per\s+day\s+from\s+home/i,
  /typing\s+work\s+earn\s+daily/i,
]

const SCAM_CHANNEL_PATTERNS = [
  /(?:send\s+resume|contact\s+hr|message\s+us)\s+on\s+whatsapp\s+only/i,
  /join\s+(?:our\s+)?telegram\s+(?:group|channel)/i,
  /whatsapp\s+your\s+cv\s+to\s+\+?91/i,
]

const MAJOR_CORP_NAMES = [
  'tcs',
  'tata consultancy services',
  'infosys',
  'wipro',
  'cognizant',
  'accenture',
  'capgemini',
  'ltimindtree',
  'hcl',
  'tech mahindra',
  'jpmorgan',
  'morgan stanley',
  'barclays',
  'nomura',
]

const FREE_EMAIL_PROVIDERS = [
  /@gmail\.com/i,
  /@yahoo\.com/i,
  /@yahoo\.co\.in/i,
  /@outlook\.com/i,
  /@hotmail\.com/i,
  /@rediffmail\.com/i,
]

/**
 * Sanitizes raw posting text, detects prompt injections, and scans for Indian fresher scam markers.
 */
export function sanitizeAndGuardPosting(rawContent: string, companyName?: string): PostingGuardResult {
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      cleanText: '',
      scamStatus: 'clean',
      scamReasons: [],
      hasPromptInjection: false,
      hiddenCharCount: 0,
    }
  }

  const scamReasons: string[] = []
  let hasPromptInjection = false
  let hiddenCharCount = 0

  // 1. Scan for invisible character smuggling
  const zeroWidthMatches = rawContent.match(ZERO_WIDTH_REGEX)
  if (zeroWidthMatches) {
    hiddenCharCount += zeroWidthMatches.length
    if (zeroWidthMatches.length > 5) {
      scamReasons.push(`Contains ${zeroWidthMatches.length} zero-width hidden characters`)
    }
  }

  // 2. Scan for Unicode tag characters (ASCII smuggling)
  const tagMatches = rawContent.match(UNICODE_TAG_REGEX)
  if (tagMatches && tagMatches.length > 0) {
    hiddenCharCount += tagMatches.length
    hasPromptInjection = true
    scamReasons.push('Contains invisible Unicode tag code points (ASCII smuggling payload)')
  }

  // 3. Scan for prompt injection instructions
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(rawContent)) {
      hasPromptInjection = true
      scamReasons.push(`Contains prompt injection pattern: "${pattern.source}"`)
      break
    }
  }

  // 4. Scan for India-specific scam fee demands
  for (const pattern of SCAM_FEE_PATTERNS) {
    if (pattern.test(rawContent)) {
      scamReasons.push('Demands registration, training, or deposit fees (Violates Indian fair hiring norms)')
      break
    }
  }

  // 5. Scan for fake placement guarantees
  for (const pattern of SCAM_PROMISE_PATTERNS) {
    if (pattern.test(rawContent)) {
      scamReasons.push('Unrealistic promise (100% placement / direct selection without interview)')
      break
    }
  }

  // 6. Scan for Telegram / WhatsApp-only recruitment traps
  for (const pattern of SCAM_CHANNEL_PATTERNS) {
    if (pattern.test(rawContent)) {
      scamReasons.push('Directs candidate exclusively to WhatsApp/Telegram without official corporate portal')
      break
    }
  }

  // 7. Impersonation Check: Claiming to be a tier-1 Indian IT firm with free email (@gmail)
  if (companyName) {
    const normCompany = companyName.toLowerCase().trim()
    const isMajorCorp = MAJOR_CORP_NAMES.some((corp) => normCompany.includes(corp))
    if (isMajorCorp) {
      const usesFreeEmail = FREE_EMAIL_PROVIDERS.some((provider) => provider.test(rawContent))
      if (usesFreeEmail) {
        scamReasons.push(`MNC Impersonation: Claims to be ${companyName} but uses free public email (@gmail/@yahoo)`)
      }
    }
  }

  // 8. Clean text: Strip hidden HTML, comments, and invisible chars
  let cleaned = rawContent
    .replace(HIDDEN_HTML_TAGS, ' ')
    .replace(HIDDEN_ELEMENTS_REGEX, ' ')
    .replace(ZERO_WIDTH_REGEX, '')
    .replace(UNICODE_TAG_REGEX, '')
    .replace(/<[^>]+>/g, ' ') // Strip remaining HTML tags to plain text
    .replace(/\s+/g, ' ')
    .trim()

  // Determine overall verdict
  let scamStatus: 'clean' | 'suspicious' | 'scam' = 'clean'
  if (
    hasPromptInjection ||
    scamReasons.some((r) => r.includes('Demands registration') || r.includes('MNC Impersonation'))
  ) {
    scamStatus = 'scam'
  } else if (scamReasons.length > 0) {
    scamStatus = 'suspicious'
  }

  return {
    cleanText: cleaned,
    scamStatus,
    scamReasons,
    hasPromptInjection,
    hiddenCharCount,
  }
}
