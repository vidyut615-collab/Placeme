'use client'

import React, { useState } from 'react'
import { ATSCheckResult, ATSIssue } from './engine'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  Target, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Wand2,
  Calendar,
  Layout,
  User,
  ShieldCheck
} from 'lucide-react'

interface ATSCheckerPanelProps {
  checkResult: ATSCheckResult
  onApplyFix: (fixActionType: ATSIssue['fixActionType']) => void
}

export default function ATSCheckerPanel({ checkResult, onApplyFix }: ATSCheckerPanelProps) {
  const [subTab, setSubTab] = useState<'issues' | 'job_match' | 'categories'>('issues')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const { score, statusText, issues, categoryStats, jobMatch } = checkResult

  const getScoreColor = () => {
    if (score >= 90) return 'text-green-500 border-green-500 bg-green-50/20'
    if (score >= 70) return 'text-amber-500 border-amber-500 bg-amber-50/20'
    return 'text-red-500 border-red-500 bg-red-50/20'
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategory(prev => prev === cat ? null : cat)
  }

  return (
    <div className="p-6 space-y-6">
      {/* HEADER SCORE GAUGE */}
      <div className="flex items-center gap-5 p-5 bg-zinc-950 text-white rounded-2xl shadow-lg border border-zinc-800">
        {/* Score Circle */}
        <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold shrink-0 ${getScoreColor()}`}>
          <span className="text-2xl leading-none">{score}</span>
          <span className="text-[10px] font-normal uppercase tracking-wider text-zinc-400">/ 100</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{statusText}</h2>
            <ShieldCheck className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {issues.length === 0 ? 'All 23 structural and ATS checks pass.' : `${issues.length} suggested improvement${issues.length === 1 ? '' : 's'} to optimize parsing score.`}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live - updates in real time as you edit
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
        <button
          onClick={() => setSubTab('issues')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'issues'
              ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <span>Issues</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            issues.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
          }`}>
            {issues.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('job_match')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'job_match'
              ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Job Match</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
            {jobMatch.score}%
          </span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            subTab === 'categories'
              ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Category Stats</span>
        </button>
      </div>

      {/* TAB 1: ACTIONABLE ISSUES WITH 1-CLICK FIX */}
      {subTab === 'issues' && (
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="p-6 text-center space-y-2 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
              <h3 className="font-bold text-sm text-green-900 dark:text-green-200">Nothing to fix!</h3>
              <p className="text-xs text-green-700 dark:text-green-300">
                Your resume meets all 23 ATS formatting and structural guidelines.
              </p>
            </div>
          ) : (
            issues.map(issue => (
              <div 
                key={issue.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {issue.severity === 'blocker' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{issue.title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{issue.description}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    issue.severity === 'blocker' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : issue.severity === 'warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {issue.severity}
                  </span>
                </div>

                {/* 1-CLICK ACTIONABLE IMPROVE BUTTON */}
                {issue.canAutoFix && issue.fixActionType && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                      onClick={() => onApplyFix(issue.fixActionType)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      {issue.fixLabel || 'Apply Fix'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: JOB MATCH KEYWORDS */}
      {subTab === 'job_match' && (
        <div className="space-y-5">
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-blue-900 dark:text-blue-200">
              <span>Target Job Keyword Alignment</span>
              <span className="text-sm">{jobMatch.score}%</span>
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
              Automated ATS filters screen for these core competencies extracted from the target Job Description.
            </p>
          </div>

          {/* Matched Keywords */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 block mb-2">
              ✓ Matched Keywords ({jobMatch.matched.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {jobMatch.matched.map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-md text-xs font-medium">
                  {kw}
                </span>
              ))}
              {jobMatch.matched.length === 0 && (
                <span className="text-xs text-zinc-400 italic">No exact target keywords matched yet.</span>
              )}
            </div>
          </div>

          {/* Missing Keywords */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-2">
              Missing Target Keywords ({jobMatch.missing.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {jobMatch.missing.map((kw, i) => (
                <span key={i} className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md text-xs font-medium">
                  + {kw}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Tip: Naturally include 2–3 of these missing tools in your Projects or Skills section to improve recruiter shortlisting.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORY STATS ACCORDIONS */}
      {subTab === 'categories' && (
        <div className="space-y-2">
          {[
            { id: 'contact', name: 'Contact Details', stats: categoryStats.contact, icon: User },
            { id: 'dates', name: 'Dates & Timelines', stats: categoryStats.dates, icon: Calendar },
            { id: 'layout', name: 'Layout & Margins', stats: categoryStats.layout, icon: Layout },
            { id: 'sections', name: 'Standard Section Headings', stats: categoryStats.sections, icon: FileText },
            { id: 'writing', name: 'Writing & Active Verbs', stats: categoryStats.writing, icon: Sparkles },
          ].map(cat => {
            const isFull = cat.stats.passed === cat.stats.total
            const isExpanded = expandedCategory === cat.id
            const Icon = cat.icon
            return (
              <div 
                key={cat.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900"
              >
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-bold">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isFull ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {cat.stats.passed} of {cat.stats.total} passed
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs text-zinc-600 dark:text-zinc-400">
                    {isFull ? (
                      <p className="text-green-600 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All guidelines in this category are satisfied.
                      </p>
                    ) : (
                      <p>Review the suggestions in the Issues tab to address any gaps in this category.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
