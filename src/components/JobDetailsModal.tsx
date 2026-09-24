'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  MapPin, 
  IndianRupee, 
  ShieldCheck, 
  FileText, 
  Download, 
  GraduationCap, 
  Clock, 
  Layers, 
  Tag, 
  CheckCircle2, 
  AlertTriangle,
  Briefcase,
  Sparkles,
  Info
} from 'lucide-react'

export interface JobDetailsData {
  id: string
  title: string
  company_name?: string | null
  description: string
  college_id: string | null
  created_at: string
  application_deadline?: string | null
  status?: string
  workplace_mode?: string | null
  job_location?: string | null
  employment_type?: string | null
  internship_stipend?: number | null
  internship_duration?: string | null
  has_bond?: boolean | null
  bond_duration?: string | null
  bond_penalty_amount?: number | null
  job_domain?: string | null
  skills_required?: string | null
  drive_mode?: string | null
  jd_attachment_url?: string | null
  jd_attachment_name?: string | null
  compensation_ctc?: number | null
  compensation_fixed?: number | null
  compensation_variable?: number | null
  eligibility_criteria?: any
  custom_stages?: any
}

interface JobDetailsModalProps {
  job: JobDetailsData
  hasApplied?: boolean
  disabledReason?: string
  isUpgrade?: boolean
  onApply?: () => void
  isApplying?: boolean
  trigger?: React.ReactNode
}

export function JobDetailsModal({
  job,
  hasApplied = false,
  disabledReason,
  isUpgrade = false,
  onApply,
  isApplying = false,
  trigger
}: JobDetailsModalProps) {
  const [open, setOpen] = useState(false)

  const isInternship = job.employment_type === 'Internship'
  const isInternPPO = job.employment_type === 'Intern+PPO'

  const skillsList = job.skills_required
    ? job.skills_required.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const crit = job.eligibility_criteria || {}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        trigger ? (
          trigger as any
        ) : (
          <Button variant="outline" size="sm" className="text-xs">
            View Details
          </Button>
        )
      } />
      <DialogContent 
        className="!w-[min(95vw,calc(90vh*16/9))] !max-w-[min(95vw,calc(90vh*16/9))] sm:!max-w-[min(95vw,calc(90vh*16/9))] h-[90vh] max-h-[90vh] flex flex-col p-6 md:p-8 overflow-hidden"
        style={{
          width: 'min(95vw, calc(90vh * 16 / 9))',
          maxWidth: 'min(95vw, calc(90vh * 16 / 9))',
          height: '90vh',
          maxHeight: '90vh',
        }}
      >
        <DialogHeader className="pb-4 border-b flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-blue-600" />
                {job.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-zinc-500" />
                  {job.company_name || 'Employer Confidential'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  {job.job_location || 'Pan-India'} ({job.workplace_mode || 'On-Site'})
                </span>
                {job.college_id ? (
                  <Badge variant="secondary" className="text-[10px]">College Exclusive</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Global Placement</Badge>
                )}
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-1.5 sm:self-start">
              <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
                {job.employment_type || 'Full-time'}
              </Badge>
              <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
                {job.drive_mode || 'Virtual / Online'}
              </Badge>
              {job.has_bond ? (
                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40">
                  ⚠️ Service Bond
                </Badge>
              ) : (
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40">
                  🛡️ No Bond
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            
            {/* ══════════════════════════════════════════════════════════
                LEFT COLUMN: Remuneration, Bond, Skills, Attachment
                ══════════════════════════════════════════════════════════ */}
            <div className="space-y-5">
              
              {/* Remuneration Card */}
              <div className="p-4 rounded-xl border bg-zinc-50/70 dark:bg-zinc-900/50 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4" />
                  Remuneration &amp; Compensation
                </div>

                {isInternship && (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
                      <span>₹{job.internship_stipend ? Number(job.internship_stipend).toLocaleString('en-IN') : 'Disclosed in JD'}</span>
                      <span className="text-sm font-normal text-zinc-500 ml-1.5">/ month</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      Engagement: Internship {job.internship_duration ? `(${job.internship_duration})` : ''}
                    </div>
                  </div>
                )}

                {isInternPPO && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-zinc-500">Internship Period:</div>
                      <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                        ₹{job.internship_stipend ? Number(job.internship_stipend).toLocaleString('en-IN') : '—'} / month
                        {job.internship_duration ? ` (${job.internship_duration})` : ''}
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-500">Full-Time Conversion (PPO):</div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {job.compensation_ctc ? `₹${job.compensation_ctc} LPA CTC` : 'Performance Based'}
                      </div>
                    </div>
                  </div>
                )}

                {!isInternship && !isInternPPO && (
                  <div className="space-y-1.5">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {job.compensation_ctc ? `₹${job.compensation_ctc} LPA` : 'CTC as per Norms'}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      {job.compensation_fixed && <span>Fixed Base: ₹{job.compensation_fixed} LPA</span>}
                      {job.compensation_variable && <span>Variable / Bonus: ₹{job.compensation_variable} LPA</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Service Agreement (Bond) Card */}
              <div className="p-4 rounded-xl border bg-zinc-50/70 dark:bg-zinc-900/50 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Service Agreement &amp; Bond Terms
                </div>

                {job.has_bond ? (
                  <div className="space-y-1.5">
                    <div className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <span>Agreement Duration:</span>
                      <span className="underline">{job.bond_duration || 'Specified in Offer Letter'}</span>
                    </div>
                    {job.bond_penalty_amount && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Early Break Penalty: <strong>₹{Number(job.bond_penalty_amount).toLocaleString('en-IN')}</strong>
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-500">
                      Students accepting this offer agree to complete the stipulated service duration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Zero Service Bond
                    </div>
                    <p className="text-xs text-zinc-500">
                      No mandatory lock-in period or financial break penalty is imposed by the employer.
                    </p>
                  </div>
                )}
              </div>

              {/* Required Skills */}
              {skillsList.length > 0 && (
                <div className="p-4 rounded-xl border bg-white dark:bg-zinc-950 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-indigo-600" />
                    Required Skills &amp; Tech Stack
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skillsList.map((skill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs px-2.5 py-0.5"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Official JD Attachment */}
              {job.jd_attachment_url && (
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-blue-950 dark:text-blue-200 truncate">
                        {job.jd_attachment_name || 'Official_Job_Description.pdf'}
                      </div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-400">
                        Official Recruiter Document (PDF)
                      </div>
                    </div>
                  </div>
                  <a
                    href={job.jd_attachment_url}
                    download={job.jd_attachment_name || 'Job_Description.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shrink-0 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </a>
                </div>
              )}

            </div>

            {/* ══════════════════════════════════════════════════════════
                RIGHT COLUMN: Rounds, Eligibility, Full Description
                ══════════════════════════════════════════════════════════ */}
            <div className="space-y-5">
              
              {/* Interview Rounds / Process */}
              {job.custom_stages && Object.keys(job.custom_stages).length > 0 && (
                <div className="p-4 rounded-xl border bg-white dark:bg-zinc-950 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <Layers className="h-4 w-4" />
                    Drive Rounds &amp; Selection Process
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="font-medium px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">1. Applied</span>
                    <span>→</span>
                    {job.custom_stages.stage_1 && (
                      <>
                        <span className="font-medium px-2.5 py-1 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-900">
                          2. {job.custom_stages.stage_1}
                        </span>
                        <span>→</span>
                      </>
                    )}
                    {job.custom_stages.stage_2 && (
                      <>
                        <span className="font-medium px-2.5 py-1 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-900">
                          3. {job.custom_stages.stage_2}
                        </span>
                        <span>→</span>
                      </>
                    )}
                    {job.custom_stages.stage_3 && (
                      <>
                        <span className="font-medium px-2.5 py-1 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-900">
                          4. {job.custom_stages.stage_3}
                        </span>
                        <span>→</span>
                      </>
                    )}
                    <span className="font-medium px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded border border-emerald-300">
                      Final Offer
                    </span>
                  </div>
                </div>
              )}

              {/* Academic Eligibility Cutoffs */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-950 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  Academic Eligibility Criteria
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="text-zinc-500 mb-0.5">Min CGPA</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{crit.min_cgpa ? `${crit.min_cgpa}` : 'No Bar'}</div>
                  </div>
                  <div className="p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="text-zinc-500 mb-0.5">10th / 12th %</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {crit.min_10th || crit.min_12th ? `${crit.min_10th || 0}% / ${crit.min_12th || 0}%` : 'No Bar'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="text-zinc-500 mb-0.5">Active Backlogs</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {crit.max_active_backlogs !== null && crit.max_active_backlogs !== undefined ? `Max ${crit.max_active_backlogs}` : 'Allowed'}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="text-zinc-500 mb-0.5">Gender</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                      {crit.allowed_genders && crit.allowed_genders.length > 0 ? crit.allowed_genders.join(', ') : 'Any'}
                    </div>
                  </div>
                </div>

                {crit.allowed_departments && crit.allowed_departments.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[11px] text-zinc-500 font-medium">Eligible Departments:</div>
                    <div className="flex flex-wrap gap-1">
                      {crit.allowed_departments.map((dept: string) => (
                        <span key={dept} className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="p-4 rounded-xl border bg-white dark:bg-zinc-950 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Role Description &amp; Responsibilities
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed text-xs max-h-48 overflow-y-auto pr-1">
                  {job.description}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t flex-shrink-0">
          <div className="text-xs text-zinc-500 flex items-center gap-1.5">
            {job.application_deadline && (
              <>
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span>Application Deadline: <strong>{new Date(job.application_deadline).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
            {onApply && (
              <Button
                size="sm"
                disabled={hasApplied || isApplying || !!disabledReason}
                onClick={onApply}
                className={hasApplied ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-600 hover:bg-blue-700 text-white min-w-[110px]'}
              >
                {isApplying ? 'Applying...' : hasApplied ? 'Already Applied' : isUpgrade ? 'Apply (Upgrade)' : 'Apply Now'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
