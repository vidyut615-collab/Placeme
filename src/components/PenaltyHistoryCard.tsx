import { format } from 'date-fns'
import { ShieldAlert, History, ShieldCheck, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface PenaltyHistoryLogEntry {
  id: string
  action: 'blacklisted' | 'reinstated'
  policy_code: string
  created_at: string
  metadata?: {
    auto_blacklist_reason?: string
    admin_note?: string
    triggering_job_id?: string
    [key: string]: unknown
  } | null
  action_by_user_id: string | null
  users?: { name: string } | null
  [key: string]: unknown
}

export function PenaltyHistoryCard({ logs }: { logs: PenaltyHistoryLogEntry[] }) {
  if (!logs || logs.length === 0) {
    return null
  }

  const formatReason = (code: string) => {
    return code.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
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
    <div className="rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] overflow-hidden shadow-[0_1px_2px_rgba(28,25,23,0.03)]">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5]/80 dark:bg-[#12110F]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] flex items-center justify-center text-[#57534E] dark:text-[#ACA59A]">
            <History className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#1C1917] dark:text-[#EFECE6]">
              Disciplinary Action Ledger
            </h3>
            <p className="text-xs text-[#78716C] dark:text-[#8A847A]">
              Historical ledger of policy actions, restrictions, and reinstatements.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
          {logs.length} Logged Record(s)
        </span>
      </div>

      <div className="divide-y divide-[#1C1917]/[0.06] dark:divide-[#EFECE6]/[0.06]">
        {logs.map((log) => {
          const isBlacklist = log.action === 'blacklisted'
          const Icon = isBlacklist ? ShieldAlert : ShieldCheck
          const badgeClass = isBlacklist
            ? 'bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 border-rose-500/20'
            : 'bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border-emerald-500/20'

          const reasonText = (() => {
            let r = log.metadata?.auto_blacklist_reason || formatReason(log.policy_code)
            if (r.startsWith('Auto-Blacklist: ')) r = r.replace('Auto-Blacklist: ', '')
            return reasonMapping[r] || r
          })()

          return (
            <div
              key={log.id}
              className="p-5 flex flex-col sm:flex-row gap-4 hover:bg-[#FAF8F5]/50 dark:hover:bg-[#12110F]/40 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isBlacklist
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
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
                    <span className="text-xs font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {reasonText}
                    </span>
                  </div>
                  <time className="text-[11px] font-mono text-[#78716C] dark:text-[#8A847A]">
                    {format(new Date(log.created_at), 'MMM d, yyyy · h:mm a')}
                  </time>
                </div>

                {log.metadata?.triggering_job_id && (
                  <p className="text-xs text-[#78716C] dark:text-[#8A847A]">
                    Triggered on drive application:{' '}
                    <span className="font-mono text-[#1C1917] dark:text-[#EFECE6]">
                      {log.metadata.triggering_job_id.substring(0, 8)}
                    </span>
                  </p>
                )}

                {log.metadata?.admin_note && (
                  <div className="text-xs text-[#57534E] dark:text-[#ACA59A] p-2.5 bg-[#FAF8F5] dark:bg-[#12110F] rounded-lg border-l-2 border-[#0F766E] dark:border-[#14B8A6]">
                    <span className="text-[10px] font-mono uppercase text-[#78716C] dark:text-[#8A847A] block mb-0.5">
                      Administrative Note:
                    </span>
                    &ldquo;{log.metadata.admin_note}&rdquo;
                  </div>
                )}

                {log.users?.name && (
                  <p className="text-[11px] text-[#78716C] dark:text-[#8A847A] flex items-center gap-1.5 pt-1">
                    <User className="w-3 h-3 stroke-[1.5] text-[#78716C]" />
                    <span>Logged by:</span>
                    <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
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
