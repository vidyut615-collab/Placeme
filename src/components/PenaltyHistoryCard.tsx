import { format } from 'date-fns'
import { ShieldAlert, History, ShieldCheck, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
    return null
  }

  const formatReason = (code: string) => {
    return code.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

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

  return (
    <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden shadow-2xs">
      <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
            <History className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Disciplinary Action Ledger
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Historical ledger of policy actions, restrictions, and reinstatements.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          {logs.length} Logged Record(s)
        </span>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {logs.map((log) => {
          const isBlacklist = log.action === 'blacklisted'
          const Icon = isBlacklist ? ShieldAlert : ShieldCheck
          const badgeClass = isBlacklist
            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'

          const reasonText = (() => {
            let r = log.metadata?.auto_blacklist_reason || formatReason(log.policy_code)
            if (r.startsWith('Auto-Blacklist: ')) r = r.replace('Auto-Blacklist: ', '')
            return reasonMapping[r] || r
          })()

          return (
            <div
              key={log.id}
              className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isBlacklist
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.5]" />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`font-mono text-[10px] ${badgeClass}`}>
                      {isBlacklist ? 'Access Restricted' : 'Reinstated'}
                    </Badge>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {reasonText}
                    </span>
                  </div>
                  <time className="text-[11px] font-mono text-zinc-500">
                    {format(new Date(log.created_at), 'MMM d, yyyy · h:mm a')}
                  </time>
                </div>

                {log.metadata?.triggering_job_id && (
                  <p className="text-xs text-zinc-500">
                    Triggered on drive application:{' '}
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">
                      {log.metadata.triggering_job_id.substring(0, 8)}
                    </span>
                  </p>
                )}

                {log.metadata?.admin_note && (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border-l-2 border-zinc-300 dark:border-zinc-600">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-0.5">
                      Administrative Note:
                    </span>
                    &ldquo;{log.metadata.admin_note}&rdquo;
                  </div>
                )}

                {log.users?.name && (
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
                    <User className="w-3 h-3 stroke-[1.5] text-zinc-400" />
                    <span>Logged by:</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {log.users.name}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
