import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { format } from 'date-fns'
import { ShieldAlert, History, ShieldCheck } from 'lucide-react'

type LogEntry = {
  id: string
  action: 'blacklisted' | 'reinstated'
  policy_code: string
  created_at: string
  metadata: any
  action_by_user_id: string | null
  users?: { name: string } | null
}

export function PenaltyHistoryCard({ logs }: { logs: LogEntry[] }) {
  if (!logs || logs.length === 0) {
    return null;
  }

  const formatReason = (code: string) => {
    return code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

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

  return (
    <Card className="mt-6 border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-500" />
          Disciplinary History
        </CardTitle>
        <CardDescription>
          A historical ledger of policy penalties and reinstatements applied to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((log) => {
            const isBlacklist = log.action === 'blacklisted'
            const Icon = isBlacklist ? ShieldAlert : ShieldCheck
            const colorClass = isBlacklist ? 'text-red-500' : 'text-emerald-500'
            const bgClass = isBlacklist ? 'bg-red-50 dark:bg-red-900/10' : 'bg-emerald-50 dark:bg-emerald-900/10'

            return (
              <div key={log.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                <div className={`mt-1 shrink-0 p-2 rounded-full h-fit w-fit ${bgClass}`}>
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold text-sm ${colorClass}`}>
                      {isBlacklist ? 'Blacklisted' : 'Reinstated'}
                    </p>
                    <time className="text-xs text-zinc-500 font-medium">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </time>
                  </div>
                  
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Reason: {
                      (() => {
                        let r = log.metadata?.auto_blacklist_reason || formatReason(log.policy_code)
                        if (r.startsWith('Auto-Blacklist: ')) r = r.replace('Auto-Blacklist: ', '')
                        return reasonMapping[r] || r
                      })()
                    }
                  </p>
                  
                  {log.metadata?.triggering_job_id && (
                    <p className="text-xs text-zinc-500">
                      Triggered on job application ID: <span className="font-mono">{log.metadata.triggering_job_id.substring(0, 8)}</span>
                    </p>
                  )}
                  {log.metadata?.admin_note && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded border-l-2 border-zinc-300 dark:border-zinc-600 italic">
                      &quot;{log.metadata.admin_note}&quot;
                    </p>
                  )}
                  {log.users?.name && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Action performed by: <span className="font-medium text-zinc-700 dark:text-zinc-300">{log.users.name}</span>
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
