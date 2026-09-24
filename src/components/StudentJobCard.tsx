'use client'

import { useTransition } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { applyForJob } from '@/app/(dashboards)/student/actions'
import { 
  Building2, 
  Globe2, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  IndianRupee, 
  FileText, 
  ShieldCheck, 
  Tag,
  Briefcase
} from 'lucide-react'
import { JobDetailsModal, JobDetailsData } from '@/components/JobDetailsModal'
import { formatDate } from '@/lib/utils'

export function StudentJobCard({ 
  job, 
  hasApplied,
  disabledReason,
  isUpgrade,
  statusBadge,
}: { 
  job: JobDetailsData; 
  hasApplied: boolean;
  disabledReason?: string;
  isUpgrade?: boolean;
  statusBadge?: { label: string; badgeColor: string };
}) {
  const [isPending, startTransition] = useTransition()

  const handleApply = () => {
    startTransition(async () => {
      const res = await applyForJob(job.id)
      if (res.error) {
        alert(res.error)
      }
    })
  }

  const isInternship = job.employment_type === 'Internship'
  const isInternPPO = job.employment_type === 'Intern+PPO'

  const skillsList = job.skills_required
    ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate leading-tight" title={job.title}>
              {job.title}
            </CardTitle>
            <div className="flex items-center text-xs font-medium text-zinc-600 dark:text-zinc-400 gap-1.5 truncate">
              <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{job.company_name || 'Employer Confidential'}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {statusBadge && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusBadge.badgeColor}`}>
                {statusBadge.label}
              </span>
            )}
            {hasApplied && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] py-0">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                Applied
              </Badge>
            )}
          </div>
        </div>

        {/* Location & Workplace Mode Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
            <MapPin className="h-3 w-3 text-red-500" />
            <span className="truncate max-w-[140px]">{job.job_location || 'Pan-India'}</span>
            <span className="text-zinc-400">({job.workplace_mode || 'On-Site'})</span>
          </span>

          <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/60">
            {job.employment_type || 'Full-time'}
          </span>

          {job.has_bond ? (
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900/60" title="Service Agreement Required">
              ⚠️ Bond
            </span>
          ) : (
            <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60" title="No Bond Required">
              🛡️ No Bond
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* Remuneration Highlight Banner */}
        <div className="p-2.5 rounded-lg border bg-zinc-50/60 dark:bg-zinc-900/40 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5 text-green-600" />
            {isInternship ? 'Stipend' : isInternPPO ? 'Stipend → PPO' : 'Package (CTC)'}
          </span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {isInternship ? (
              job.internship_stipend ? `₹${Number(job.internship_stipend).toLocaleString('en-IN')}/mo` : 'Disclosed in JD'
            ) : isInternPPO ? (
              `₹${job.internship_stipend ? Number(job.internship_stipend).toLocaleString('en-IN') : 0}/mo → ₹${job.compensation_ctc || 0} LPA`
            ) : (
              job.compensation_ctc ? `₹${job.compensation_ctc} LPA` : 'As per Norms'
            )}
          </span>
        </div>

        {/* Required Skills Chips Preview */}
        {skillsList.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skillsList.slice(0, 3).map((skill, idx) => (
              <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-900/40">
                {skill}
              </span>
            ))}
            {skillsList.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 text-zinc-400">
                +{skillsList.length - 3} more
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      </CardContent>

      <CardFooter className="pt-3 border-t flex flex-col gap-2 items-start bg-zinc-50/20 dark:bg-zinc-900/20">
        <div className="w-full flex items-center justify-between text-[11px] text-zinc-500">
          {job.application_deadline ? (
            <div className="flex items-center gap-1" suppressHydrationWarning>
              <Clock className="h-3 w-3 text-zinc-400" />
              <span>Ends: {formatDate(job.application_deadline)}</span>
            </div>
          ) : (
            <span>Open Applications</span>
          )}

          {job.jd_attachment_url && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
              <FileText className="h-2.5 w-2.5" /> PDF Attached
            </span>
          )}
        </div>

        {disabledReason && (
          <div className="w-full text-[11px] text-center text-red-600 bg-red-50 dark:bg-red-950/40 p-1.5 rounded-md font-medium border border-red-200 dark:border-red-900/60">
            {disabledReason}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 w-full pt-1">
          <JobDetailsModal
            job={job}
            hasApplied={hasApplied}
            disabledReason={disabledReason}
            isUpgrade={isUpgrade}
            onApply={handleApply}
            isApplying={isPending}
            trigger={
              <Button variant="outline" size="sm" className="w-full text-xs">
                View Details
              </Button>
            }
          />

          <Button 
            size="sm"
            className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={hasApplied || isPending || !!disabledReason}
            onClick={handleApply}
            variant={hasApplied ? "outline" : (isUpgrade ? "secondary" : "default")}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : hasApplied ? (
              'Applied'
            ) : isUpgrade ? (
              'Upgrade'
            ) : (
              'Apply Now'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
