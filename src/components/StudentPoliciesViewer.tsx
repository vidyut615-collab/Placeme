'use client'

import { PolicyConfig } from '@/lib/policy-engine'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldAlert, BookOpen, AlertCircle, ArrowUpRight, CheckCircle2, XCircle, Info } from 'lucide-react'

interface StudentPoliciesViewerProps {
  config: PolicyConfig
}

export function StudentPoliciesViewer({ config }: StudentPoliciesViewerProps) {
  
  // Helper to safely render text
  const renderItem = (label: string, value: any, suffix = '') => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}{suffix}</span>
      </div>
    )
  }

  const renderBooleanItem = (label: string, value: boolean | undefined) => {
    if (value === undefined) return null;
    return (
      <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        {value ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>
    )
  }

  const formatText = (text: string) => {
    return text?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      
      {/* 1. Eligibility Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Eligibility Rules
          </CardTitle>
          <CardDescription>Academic and profile requirements required to participate in placements.</CardDescription>
        </CardHeader>
        <CardContent>
          {config.eligibility?.enabled ? (
            <div className="space-y-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4 text-sm text-blue-800 dark:text-blue-300 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>These are the minimum academic criteria you must meet to apply for jobs. Jobs may also have their own specific criteria.</p>
              </div>
              {renderItem('Minimum CGPA', config.eligibility.min_gpa)}
              {renderItem('Minimum 10th Marks', config.eligibility.min_10th, '%')}
              {renderItem('Minimum 12th Marks', config.eligibility.min_12th, '%')}
              {renderItem('Max Active Backlogs', config.eligibility.max_active_backlogs)}
              {renderItem('Max Historical Backlogs', config.eligibility.max_historical_backlogs)}
              {renderItem('Max Gap Years', config.eligibility.max_gap_years)}
              
              {(!config.eligibility.min_gpa && !config.eligibility.min_10th && !config.eligibility.min_12th && !config.eligibility.max_active_backlogs) && (
                <p className="text-sm text-zinc-500 italic">No specific college-wide eligibility rules are configured.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">Eligibility policy is not currently enforced globally.</p>
          )}
        </CardContent>
      </Card>

      {/* 2. Application Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Application Limits
          </CardTitle>
          <CardDescription>Restrictions on the number of jobs you can apply to.</CardDescription>
        </CardHeader>
        <CardContent>
          {config.application_limit?.enabled ? (
            <div className="space-y-1">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md mb-4 text-sm text-amber-800 dark:text-amber-300 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Limits are placed to ensure fair opportunities for all students. Choose your applications wisely.</p>
              </div>
              {renderItem('Max Total Applications', config.application_limit.max_total)}
              {renderItem('Max Active Applications', config.application_limit.max_active)}
              {renderItem('Max Apps Per Day', config.application_limit.max_per_day)}
              {renderItem('Max Apps Per Week', config.application_limit.max_per_week)}
              
              {(!config.application_limit.max_total && !config.application_limit.max_active && !config.application_limit.max_per_day) && (
                <p className="text-sm text-zinc-500 italic">No specific application limits are configured.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">No application limits are currently enforced.</p>
          )}
        </CardContent>
      </Card>

      {/* 3. Offer & Upgrade Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            Offer & Upgrade Policy
          </CardTitle>
          <CardDescription>Rules that apply once you receive a job offer.</CardDescription>
        </CardHeader>
        <CardContent>
          {config.offer_limit?.enabled || config.upgrade?.enabled ? (
            <div className="space-y-6">
              {config.offer_limit?.enabled && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-zinc-900 dark:text-zinc-100 border-b pb-1">Offer Limits</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Defines how many offers you can hold and what happens when you are hired.</p>
                  <div className="space-y-1">
                    {renderItem('Max Total Offers', config.offer_limit.max_offers_total)}
                    {renderBooleanItem('Placement ends once hired', config.offer_limit.debar_on_hired)}
                  </div>
                </div>
              )}
              {config.upgrade?.enabled && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-zinc-900 dark:text-zinc-100 border-b pb-1">Upgrades</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">If you are placed, you may apply for a better offer if it meets these criteria.</p>
                  <div className="space-y-1">
                    {renderItem('Min Increment Required', config.upgrade.min_increment_pct, '% higher CTC')}
                    {renderItem('Max Upgrade Attempts', config.upgrade.max_upgrade_attempts)}
                    {renderBooleanItem('Must be higher tier/level', config.upgrade.must_be_higher_level)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic">Offer and upgrade limits are not enabled.</p>
          )}
        </CardContent>
      </Card>

      {/* 4. Penalty Rules (No Show, Withdrawal) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Penalties & Restrictions
          </CardTitle>
          <CardDescription>Consequences for missing events or withdrawing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-zinc-900 dark:text-zinc-100 border-b pb-1">Non-Participation (Eligibility Ignored)</h4>
              {config.non_participation?.enabled ? (
                <div className="space-y-1">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Students who meet all academic eligibility criteria for a posted drive are required to apply or seek formal coordinator excusal.</p>
                  {renderItem('Max Unapplied Drives Before Debarment', config.non_participation.max_allowed)}
                  {renderItem('Default Action', formatText(config.non_participation.penalty || 'Add Strike'))}
                  {renderItem('Reinstatement Quota (if appealed)', config.non_participation.reinstatement_chances)}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">Mandatory application / non-participation policy is not active.</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 text-zinc-900 dark:text-zinc-100 border-b pb-1">No-Show Policy</h4>
              {config.no_show?.enabled ? (
                <div className="space-y-1">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Missing scheduled interviews or assessments will result in penalties.</p>
                  {renderItem('Max allowed No-shows', config.no_show.max_no_shows)}
                  {renderItem('1st Offense', formatText(config.no_show.first_consequence))}
                  {renderItem('2nd Offense', formatText(config.no_show.second_consequence))}
                  {renderItem('3rd Offense', formatText(config.no_show.third_consequence))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">No-show policy is not enabled.</p>
              )}
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2 text-zinc-900 dark:text-zinc-100 border-b pb-1">Withdrawal Policy</h4>
              {config.withdrawal?.enabled ? (
                <div className="space-y-1">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Rules regarding withdrawing your application during the recruitment process.</p>
                  {renderItem('General Consequence', formatText(config.withdrawal.consequence))}
                  {renderBooleanItem('Reason required for withdrawal', config.withdrawal.reason_required)}
                  {config.withdrawal.rules && (
                    <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 text-sm">
                      <p className="font-medium mb-2 text-zinc-700 dark:text-zinc-300">When can you withdraw?</p>
                      <ul className="space-y-1">
                        <li className="flex justify-between"><span>After Applied:</span> <span className="font-medium">{formatText(config.withdrawal.rules.after_applied)}</span></li>
                        <li className="flex justify-between"><span>After Shortlisted:</span> <span className="font-medium">{formatText(config.withdrawal.rules.after_shortlisted)}</span></li>
                        <li className="flex justify-between"><span>During Interviews:</span> <span className="font-medium">{formatText(config.withdrawal.rules.after_interviewing)}</span></li>
                        <li className="flex justify-between"><span>After Selected:</span> <span className="font-medium text-red-600">{formatText(config.withdrawal.rules.after_selected)}</span></li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">Withdrawal policy is not enabled.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

