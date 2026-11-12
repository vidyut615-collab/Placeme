import { ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface PenaltyLogEntry {
  action: 'blacklisted' | 'reinstated'
  policy_code: string
  metadata?: {
    auto_blacklist_reason?: string
    admin_note?: string
    triggering_job_id?: string
    [key: string]: unknown
  } | null
  [key: string]: unknown
}

export function PenaltySummaryCard({ logs }: { logs: PenaltyLogEntry[] }) {
  if (!logs || logs.length === 0) return null

  const blacklistLogs = logs.filter((log) => log.action === 'blacklisted')
  const totalBlacklists = blacklistLogs.length

  if (totalBlacklists === 0) return null

  const reasonMapping: Record<string, string> = {
    'Exceeded No-Show Limit': 'Interview No-Show (Mid-Process)',
    'Exceeded Withdrawal Limit': 'Application Withdrawal (Mid-Process)',
    'Exceeded Application Withdrawal Limit': 'Application Withdrawal (Mid-Process)',
    'Exceeded Post-Shortlist Withdrawal Limit': 'Post-Shortlist Withdrawal (Critical Dropout)',
    'Exceeded Disciplinary Limit': 'Disciplinary Strikes (Misconduct)',
    'Disciplinary Strike Limit Reached': 'Disciplinary Strikes (Misconduct)',
    'Integrity/Fraud Violation': 'Integrity Strikes (Data Fraud)',
    'Resume / Credential Fraud': 'Integrity Strikes (Data Fraud)',
    'Offer Rejection Limit Reached': 'Offer Rejection (Post-Hire Decline)',
  }

  // Calculate distribution
  const distribution: Record<string, number> = {}
  blacklistLogs.forEach((log) => {
    let reason =
      log.metadata?.auto_blacklist_reason || log.policy_code || 'Unknown Reason'

    // Clean up reason prefix if it exists
    if (reason.startsWith('Auto-Blacklist: ')) {
      reason = reason.replace('Auto-Blacklist: ', '')
    }

    // Apply exact mapping to match College Policy Config cards
    reason = reasonMapping[reason] || reason

    distribution[reason] = (distribution[reason] || 0) + 1
  })

  return (
    <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5]/80 dark:bg-[#12110F]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
              Disciplinary Infractions Summary
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#8A847A]">
              Aggregated historical tally of policy infractions and restrictions.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs bg-rose-500/[0.08] dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20"
        >
          {totalBlacklists} Total Action(s)
        </Badge>
      </div>

      <div className="divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06]">
        {Object.entries(distribution).map(([reason, count]) => (
          <div
            key={reason}
            className="px-5 py-3 flex justify-between items-center bg-white dark:bg-[#191816]"
          >
            <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
              {reason}
            </span>
            <span className="font-mono text-xs text-[#57534E] dark:text-[#ACA59A] px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              {count} {count === 1 ? 'incident' : 'incidents'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
