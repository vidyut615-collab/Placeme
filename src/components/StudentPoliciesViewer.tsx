'use client'

import { PolicyConfig } from '@/lib/policy-engine'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldAlert, BookOpen, AlertCircle, ArrowUpRight, CheckCircle2, XCircle, Info } from 'lucide-react'

export interface StudentMetrics {
  cgpa: number;
  activeBacklogs: number;
  totalApplications: number;
  activeApplications: number;
  applicationsToday: number;
  applicationsThisWeek: number;
  totalOffers: number;
  highestOfferCTC: number;
  policyCounters: {
    non_participation: number;
    no_shows: number;
    withdrawals: number;
    post_shortlist_withdrawals: number;
  };
}

interface StudentPoliciesViewerProps {
  config: PolicyConfig
  studentMetrics: StudentMetrics
}

export function StudentPoliciesViewer({ config, studentMetrics }: StudentPoliciesViewerProps) {
  
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

  const renderMetric = (label: string, limit: number | null | undefined, current: number, unit = '', reverseThreshold = false) => {
    if (limit === undefined || limit === null || (limit === 0 && !reverseThreshold && label !== 'Max Active Backlogs')) {
      // If no limit exists, just show current
      return (
        <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
          <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Current: {current}{unit} <span className="text-xs text-zinc-400 font-normal ml-1">(No Limit)</span></span>
        </div>
      );
    }
    
    // reverseThreshold = true means higher is better (e.g. Min CGPA)
    // reverseThreshold = false means lower is better (e.g. Max Applications, Backlogs)
    
    let status = 'safe';
    let message = 'Safe';
    
    if (reverseThreshold) {
      if (current < limit) {
        status = 'danger';
        message = 'Flagged';
      } else if (current < limit + (limit * 0.1)) {
        status = 'warning';
        message = 'Warning';
      }
    } else {
      if (current >= limit) {
        status = 'danger';
        message = 'Limit Reached';
      } else if (current >= limit * 0.8) {
        status = 'warning';
        message = 'Approaching Limit';
      }
    }

    const isDanger = status === 'danger';
    const isWarning = status === 'warning';

    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 gap-2">
        <div className="flex flex-col">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">{label}</span>
          <span className="text-xs text-zinc-500">Current: {current}{unit} / Limit: {limit}{unit}</span>
        </div>
        <div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isDanger ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            isWarning ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}>
            {isDanger && <XCircle className="w-3.5 h-3.5 mr-1" />}
            {isWarning && <AlertCircle className="w-3.5 h-3.5 mr-1" />}
            {!isDanger && !isWarning && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
            {message}
          </span>
        </div>
      </div>
    )
  }

  // Determine overall status
  const issues: string[] = [];
  
  if (config.eligibility?.enabled) {
    if (config.eligibility.min_gpa && studentMetrics.cgpa < config.eligibility.min_gpa) issues.push('CGPA is below the minimum required.');
    if (config.eligibility.max_active_backlogs !== undefined && config.eligibility.max_active_backlogs !== null && studentMetrics.activeBacklogs > config.eligibility.max_active_backlogs) issues.push('Active backlogs exceed the allowed limit.');
  }
  
  if (config.application_limit?.enabled) {
    if (config.application_limit.max_total && studentMetrics.totalApplications >= config.application_limit.max_total) issues.push('Reached maximum total applications limit.');
    if (config.application_limit.max_active && studentMetrics.activeApplications >= config.application_limit.max_active) issues.push('Reached maximum active applications limit.');
  }

  if (config.offer_limit?.enabled) {
    if (config.offer_limit.max_offers_total && studentMetrics.totalOffers >= config.offer_limit.max_offers_total) issues.push('Reached maximum total offers limit.');
    if (config.offer_limit.debar_on_hired && studentMetrics.totalOffers > 0) issues.push('You have been hired. Placement drives may be restricted based on rules.');
  }

  if (config.non_participation?.enabled && config.non_participation.max_allowed) {
    if (studentMetrics.policyCounters.non_participation >= config.non_participation.max_allowed) issues.push('Exceeded allowed non-participation limit.');
  }

  if (config.no_show?.enabled && config.no_show.max_no_shows) {
    if (studentMetrics.policyCounters.no_shows >= config.no_show.max_no_shows) issues.push('Exceeded allowed no-shows limit.');
  }

  const isSafe = issues.length === 0;

  return (
    <div className="space-y-6">
      
      {/* Student Status Summary Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-4 ${isSafe ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50' : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'}`}>
        <div className={`p-2 rounded-full mt-1 ${isSafe ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
          {isSafe ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>
        <div>
          <h3 className={`text-lg font-bold ${isSafe ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
            {isSafe ? 'You are currently in good standing.' : 'Action Required: Policy Flags Detected'}
          </h3>
          <p className={`text-sm mt-1 ${isSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {isSafe ? 'You meet all enabled college policies and are safe to participate in upcoming drives.' : 'You have triggered one or more placement policies. Please review the flagged items below.'}
          </p>
          {!isSafe && (
            <ul className="mt-3 space-y-1">
              {issues.map((issue, idx) => (
                <li key={idx} className="text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
              {renderMetric('Minimum CGPA', config.eligibility.min_gpa, studentMetrics.cgpa, '', true)}
              {/* Note: We don't have 10th and 12th marks directly in metrics for now, maybe profileData has them, let's keep renderItem for them if not in metrics, or we can just pass them as 0 if not exist */}
              {renderItem('Minimum 10th Marks', config.eligibility.min_10th, '%')}
              {renderItem('Minimum 12th Marks', config.eligibility.min_12th, '%')}
              {renderMetric('Max Active Backlogs', config.eligibility.max_active_backlogs, studentMetrics.activeBacklogs)}
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
              {renderMetric('Max Total Applications', config.application_limit.max_total, studentMetrics.totalApplications)}
              {renderMetric('Max Active Applications', config.application_limit.max_active, studentMetrics.activeApplications)}
              {renderMetric('Max Apps Per Day', config.application_limit.max_per_day, studentMetrics.applicationsToday)}
              {renderMetric('Max Apps Per Week', config.application_limit.max_per_week, studentMetrics.applicationsThisWeek)}
              
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
                    {renderMetric('Max Total Offers', config.offer_limit.max_offers_total, studentMetrics.totalOffers)}
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
                  {renderMetric('Max Unapplied Drives Before Debarment', config.non_participation.max_allowed, studentMetrics.policyCounters.non_participation)}
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
                  {renderMetric('Max allowed No-shows', config.no_show.max_no_shows, studentMetrics.policyCounters.no_shows)}
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
                  <div className="mb-4">
                    {renderItem('Current Withdrawals', studentMetrics.policyCounters.withdrawals)}
                    {renderItem('Post-Shortlist Withdrawals', studentMetrics.policyCounters.post_shortlist_withdrawals)}
                  </div>
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
    </div>
  )
}

