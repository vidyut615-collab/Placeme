import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type LogEntry = {
  action: 'blacklisted' | 'reinstated'
  policy_code: string
  metadata: any
}

export function PenaltySummaryCard({ logs }: { logs: LogEntry[] }) {
  if (!logs || logs.length === 0) return null

  const blacklistLogs = logs.filter(log => log.action === 'blacklisted')
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
  blacklistLogs.forEach(log => {
    let reason = log.metadata?.auto_blacklist_reason || log.policy_code || 'Unknown Reason'
    
    // Clean up reason prefix if it exists
    if (reason.startsWith('Auto-Blacklist: ')) {
      reason = reason.replace('Auto-Blacklist: ', '')
    }
    
    // Apply exact mapping to match College Policy Config cards
    reason = reasonMapping[reason] || reason
    
    distribution[reason] = (distribution[reason] || 0) + 1
  })

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-2xs">
      <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Disciplinary Infractions Summary
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Aggregated historical tally of policy infractions and restrictions.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
        >
          {totalBlacklists} Total Action(s)
        </Badge>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {Object.entries(distribution).map(([reason, count]) => (
          <div key={reason} className="px-5 py-3 flex justify-between items-center bg-white dark:bg-zinc-900/20">
            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{reason}</span>
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              {count} {count === 1 ? 'incident' : 'incidents'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
