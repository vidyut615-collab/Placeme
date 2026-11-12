'use client'

import React, { useState } from 'react'
import { ATSCheckResult, ATSIssue } from './engine'
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Target,
  FileText,
  ChevronDown,
  ChevronRight,
  Wand2,
  Calendar,
  Layout,
  User,
  ShieldCheck,
  PenLine,
  Loader2,
  Check,
} from 'lucide-react'

export interface DeepAIMatchResult {
  match_score: number
  matching_keywords: string[]
  missing_keywords: string[]
  summary?: string
}

interface ATSCheckerPanelProps {
  checkResult: ATSCheckResult
  onApplyFix: (fixActionType: ATSIssue['fixActionType']) => void
  aiMatchData?: DeepAIMatchResult | null
  isRunningAIMatch?: boolean
  onRunAIMatch?: () => void
}

export default function ATSCheckerPanel({
  checkResult,
  onApplyFix,
  aiMatchData,
  isRunningAIMatch = false,
  onRunAIMatch,
}: ATSCheckerPanelProps) {
  const [subTab, setSubTab] = useState<'issues' | 'job_match' | 'categories'>('issues')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const { score, statusText, issues, categoryStats, jobMatch } = checkResult

  const getScoreCircleClass = () => {
    if (score >= 90) return 'text-[#14B8A6] border-[#14B8A6] bg-[#14B8A6]/10'
    if (score >= 70) return 'text-amber-400 border-amber-400 bg-amber-400/10'
    return 'text-rose-400 border-rose-400 bg-rose-400/10'
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat))
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header Score Gauge */}
      <div className="flex items-center gap-5 p-5 bg-[#12110F] dark:bg-[#0D0C0A] text-[#EFECE6] rounded-2xl border border-[#1C1917]/[0.15] dark:border-[#EFECE6]/[0.1]">
        <div
          className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-mono tabular-nums shrink-0 ${getScoreCircleClass()}`}
        >
          <span className="text-[24px] font-medium leading-none">{score}</span>
          <span className="text-[10px] text-[#ACA59A] mt-0.5">/ 100</span>
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-medium text-[#EFECE6]">{statusText}</h2>
            <ShieldCheck className="w-4 h-4 text-[#14B8A6] stroke-[1.5] shrink-0" />
          </div>
          <p className="text-[12px] text-[#ACA59A] leading-relaxed">
            {issues.length === 0
              ? 'All 23 structural and formatting ATS guidelines passed.'
              : `${issues.length} actionable check${issues.length === 1 ? '' : 's'} remaining to raise parser readiness.`}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8A847A] font-mono pt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
            <span>Live deterministic checks</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl">
        <button
          type="button"
          onClick={() => setSubTab('issues')}
          className={`flex-1 py-1.5 px-2 text-[12px] font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'issues'
              ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
              : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
          }`}
        >
          <span>Issues</span>
          <span
            className={`px-1.5 py-0.5 rounded-full font-mono tabular-nums text-[10px] font-medium ${
              issues.length > 0
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : 'bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6]'
            }`}
          >
            {issues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('job_match')}
          className={`flex-1 py-1.5 px-2 text-[12px] font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'job_match'
              ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
              : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
          }`}
        >
          <Target className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Job match</span>
          <span className="font-mono tabular-nums text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]">
            {aiMatchData?.match_score ?? jobMatch.score}%
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('categories')}
          className={`flex-1 py-1.5 px-2 text-[12px] font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'categories'
              ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
              : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Categories</span>
        </button>
      </div>

      {/* Tab 1: Actionable Issues */}
      {subTab === 'issues' && (
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="p-6 text-center space-y-2 bg-[#0F766E]/[0.05] dark:bg-[#14B8A6]/10 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 rounded-xl">
              <CheckCircle2 className="w-7 h-7 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5] mx-auto" />
              <h3 className="font-medium text-[14px] text-[#1C1917] dark:text-[#EFECE6]">
                All structural checks passed
              </h3>
              <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                Your resume satisfies all 23 ATS formatting, contact, and timeline standards.
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {issue.severity === 'blocker' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[1.5] shrink-0 mt-0.5" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[1.5] shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-[#0F766E] dark:text-[#14B8A6] stroke-[1.5] shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        {issue.title}
                      </h4>
                      <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] mt-0.5 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${
                      issue.severity === 'blocker'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        : issue.severity === 'warning'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                        : 'bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] border-[#0F766E]/20'
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>

                {issue.canAutoFix && issue.fixActionType && (
                  <div className="pt-2.5 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] flex justify-end">
                    <button
                      type="button"
                      onClick={() => onApplyFix(issue.fixActionType)}
                      className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                    >
                      <Wand2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      <span>{issue.fixLabel || 'Apply fix'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Job Match Keywords */}
      {subTab === 'job_match' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl space-y-2.5">
            <div className="flex justify-between items-center text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
              <span>Target job keyword alignment</span>
              <span className="font-mono tabular-nums text-[15px] text-[#0F766E] dark:text-[#14B8A6]">
                {aiMatchData?.match_score ?? jobMatch.score}%
              </span>
            </div>
            <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
              {aiMatchData?.summary ||
                'Comparison of key requirements from the target job description against your current resume bullets and skills.'}
            </p>
            {onRunAIMatch && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onRunAIMatch}
                  disabled={isRunningAIMatch}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#0F766E]/25 dark:border-[#14B8A6]/30 bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 hover:bg-[#0F766E]/15 text-[#0F766E] dark:text-[#14B8A6] text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                >
                  {isRunningAIMatch ? (
                    <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin" />
                  ) : (
                    <Target className="w-3.5 h-3.5 stroke-[1.5]" />
                  )}
                  <span>
                    {isRunningAIMatch
                      ? 'Evaluating against JD...'
                      : aiMatchData
                      ? 'Re-run deep AI match'
                      : 'Run deep AI keyword match'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {(() => {
            const matched = aiMatchData?.matching_keywords || jobMatch.matched
            const missing = aiMatchData?.missing_keywords || jobMatch.missing
            return (
              <>
                <div className="space-y-2">
                  <span className="text-[12px] font-medium text-[#0F766E] dark:text-[#14B8A6] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[1.75]" />
                    <span>Matched keywords ({matched.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {matched.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 rounded-md text-[12px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                    {matched.length === 0 && (
                      <span className="text-[12px] text-[#78716C] dark:text-[#8A847A]">
                        No exact target keywords matched yet.
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[12px] font-medium text-amber-700 dark:text-amber-300 block">
                    Missing target keywords ({missing.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missing.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 rounded-md text-[12px]"
                      >
                        {kw}
                      </span>
                    ))}
                    {missing.length === 0 && (
                      <span className="text-[12px] text-[#0F766E] dark:text-[#14B8A6]">
                        All extracted job keywords are covered.
                      </span>
                    )}
                  </div>
                  {missing.length > 0 && (
                    <p className="text-[12px] text-[#78716C] dark:text-[#8A847A]">
                      Where accurate to your experience, weave 2–3 missing keywords into your project tech stacks or bullets.
                    </p>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Tab 3: Category Stats */}
      {subTab === 'categories' && (
        <div className="space-y-2">
          {[
            { id: 'contact', name: 'Contact details', stats: categoryStats.contact, icon: User },
            { id: 'dates', name: 'Dates & timelines', stats: categoryStats.dates, icon: Calendar },
            { id: 'layout', name: 'Layout & margins', stats: categoryStats.layout, icon: Layout },
            { id: 'sections', name: 'Standard section headings', stats: categoryStats.sections, icon: FileText },
            { id: 'writing', name: 'Writing & active verbs', stats: categoryStats.writing, icon: PenLine },
          ].map((cat) => {
            const isFull = cat.stats.passed === cat.stats.total
            const isExpanded = expandedCategory === cat.id
            const Icon = cat.icon
            return (
              <div
                key={cat.id}
                className="border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl overflow-hidden bg-[#FAF8F5] dark:bg-[#12110F]"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F3EFE9] dark:hover:bg-[#191816] transition-colors duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#57534E] dark:text-[#ACA59A] stroke-[1.5]" />
                    <span className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {cat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono tabular-nums font-medium px-2 py-0.5 rounded-full border ${
                        isFull
                          ? 'bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] border-[#0F766E]/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                      }`}
                    >
                      {cat.stats.passed}/{cat.stats.total} passed
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#78716C] stroke-[1.5]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#78716C] stroke-[1.5]" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3.5 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] bg-white dark:bg-[#191816] text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                    {isFull ? (
                      <p className="text-[#0F766E] dark:text-[#14B8A6] flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>All checks in this category pass.</span>
                      </p>
                    ) : (
                      <p>Open the Issues tab to review and auto-fix remaining items.</p>
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
