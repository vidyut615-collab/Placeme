import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface StudentFooterProps {
  collegeName: string
  accessEndDate?: string | null
}

export function StudentFooter({ collegeName, accessEndDate }: StudentFooterProps) {
  const hasValidAccess =
    Boolean(accessEndDate) && new Date(accessEndDate as string) >= new Date()

  return (
    <footer className="mt-auto border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] shrink-0 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto w-full px-6 py-4 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
        {/* Left: Workspace Network & Access Status */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="inline-flex items-center gap-2 font-medium text-[#1C1917] dark:text-[#EFECE6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Placeme</span>
          </span>
          <span className="text-[#78716C] dark:text-[#8A847A]">·</span>
          <span className="truncate max-w-[240px]">{collegeName}</span>
          <span className="text-[#78716C] dark:text-[#8A847A] hidden sm:inline">·</span>
          {hasValidAccess && accessEndDate ? (
            <span className="font-mono tabular-nums text-[11px] text-[#0F766E] dark:text-[#14B8A6]">
              Access valid through {formatDate(accessEndDate)}
            </span>
          ) : (
            <span className="font-mono tabular-nums text-[11px] text-[#78716C] dark:text-[#8A847A]">
              Cycle 2026
            </span>
          )}
        </div>

        {/* Right: Quick Workspace Links */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px]"
        >
          <Link
            href="/student/jobs"
            className="hover:text-[#0F766E] dark:hover:text-[#14B8A6] transition-colors duration-150"
          >
            Jobs
          </Link>
          <Link
            href="/student/applications"
            className="hover:text-[#0F766E] dark:hover:text-[#14B8A6] transition-colors duration-150"
          >
            Applications
          </Link>
          <Link
            href="/student/ai-resume"
            className="hover:text-[#0F766E] dark:hover:text-[#14B8A6] transition-colors duration-150"
          >
            AI Resume
          </Link>
          <Link
            href="/student/policies"
            className="hover:text-[#0F766E] dark:hover:text-[#14B8A6] transition-colors duration-150"
          >
            Policies
          </Link>
          <Link
            href="/student/billing"
            className="hover:text-[#0F766E] dark:hover:text-[#14B8A6] transition-colors duration-150"
          >
            Billing
          </Link>
          <Link
            href="/student/profile"
            className="hover:text-[#0F766E] dark:hover:text-[#14B8A6] transition-colors duration-150"
          >
            DigiProfile
          </Link>
        </nav>
      </div>
    </footer>
  )
}
