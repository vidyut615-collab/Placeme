import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    'Exceeded No-Show Limit': 'No-Show (Mid-Process)',
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
    <Card className="mt-6 border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
      <div className="bg-red-50 dark:bg-red-900/10 px-6 py-4 flex items-center gap-3 border-b border-red-100 dark:border-red-900/30">
        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-900 dark:text-red-400">Total Blacklists: {totalBlacklists}</h3>
          <p className="text-sm text-red-700/80 dark:text-red-400/80">Lifetime count of policy violations</p>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {Object.entries(distribution).map(([reason, count]) => (
            <div key={reason} className="px-6 py-3 flex justify-between items-center bg-white dark:bg-zinc-950">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{reason}</span>
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                {count} {count === 1 ? 'time' : 'times'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
