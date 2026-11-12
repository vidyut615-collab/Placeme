'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { DeleteResumeButton } from './DeleteResumeButton'
import { CreateResumeModal, CampusJobOption } from './CreateResumeModal'
import { formatDate } from '@/lib/utils'

export interface ResumeCatalogItem {
  id: string
  title: string
  target_employer: string
  target_role: string
  created_at: string
  templateName: string
  atsScore: number
  isComplete: boolean
  savedSections: number
  totalSections: number
}

interface Props {
  resumes: ResumeCatalogItem[]
  creditBalance: number
  isActive: boolean
  hasProfileData: boolean
  activeJobs: CampusJobOption[]
  initialJobId?: string
}

type StatusFilter = 'all' | 'ready' | 'draft'

export function ResumeCatalogClient({
  resumes,
  creditBalance,
  isActive,
  hasProfileData,
  activeJobs,
  initialJobId,
}: Props) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const counts = useMemo(() => {
    const ready = resumes.filter((r) => r.isComplete).length
    return {
      all: resumes.length,
      ready,
      draft: resumes.length - ready,
    }
  }, [resumes])

  const filteredResumes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resumes.filter((r) => {
      if (statusFilter === 'ready' && !r.isComplete) return false
      if (statusFilter === 'draft' && r.isComplete) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.target_employer.toLowerCase().includes(q) ||
        r.target_role.toLowerCase().includes(q)
      )
    })
  }, [resumes, query, statusFilter])

  if (resumes.length === 0) {
    return (
      <div className="p-8 sm:p-12 border border-dashed border-[#1C1917]/[0.12] dark:border-[#EFECE6]/[0.12] rounded-2xl bg-white/70 dark:bg-[#191816]/70 text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 flex items-center justify-center text-[#0F766E] dark:text-[#14B8A6] mx-auto">
          <FileText className="w-5 h-5 stroke-[1.5]" />
        </div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-[16px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
            No tailored resumes created yet
          </h3>
          <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
            Build single-page, ATS-verified resumes aligned to target job descriptions using your DigiProfile experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left pt-1">
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-1">
            <span className="font-mono text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6]">
              01 · Pick or paste target JD
            </span>
            <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] leading-snug">
              Auto-fill from an active campus drive or paste a recruiter job description.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-1">
            <span className="font-mono text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6]">
              02 · Tailor section bullets
            </span>
            <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] leading-snug">
              Generate tailored options per role or project and refine in the split builder.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] space-y-1">
            <span className="font-mono text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6]">
              03 · ATS audit & PDF export
            </span>
            <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] leading-snug">
              Verify parser readability, tune single-page layout, and download a vector PDF.
            </p>
          </div>
        </div>

        <div className="pt-1">
          <CreateResumeModal
            creditBalance={creditBalance}
            isActive={isActive}
            hasProfileData={hasProfileData}
            activeJobs={activeJobs}
            initialJobId={initialJobId}
            triggerButton={
              <button
                type="button"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white text-[13px] font-medium transition-colors duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[1.75]" />
                <span>Create your first tailored resume</span>
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Status Filter Strip */}
      <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 stroke-[1.5] text-[#78716C] dark:text-[#8A847A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resumes by company, role, or title"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[13px] text-[#1C1917] dark:text-[#EFECE6] placeholder:text-[#78716C] dark:placeholder:text-[#8A847A] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="p-1 rounded text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6] absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-[#F3EFE9] dark:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] self-start sm:self-auto">
          {(
            [
              { key: 'all', label: 'All', count: counts.all },
              { key: 'ready', label: 'Ready', count: counts.ready },
              { key: 'draft', label: 'In progress', count: counts.draft },
            ] as const
          ).map((tab) => {
            const active = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
                    : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono tabular-nums text-[11px] text-[#78716C] dark:text-[#8A847A]">
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-0.5 text-[12px] text-[#57534E] dark:text-[#ACA59A]">
        <span>
          Showing{' '}
          <span className="font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#EFECE6]">
            {filteredResumes.length}
          </span>{' '}
          {filteredResumes.length === 1 ? 'resume' : 'resumes'}
        </span>
        <span className="font-mono text-[11px] text-[#78716C] dark:text-[#8A847A]">
          Single-page A4 vector PDF export
        </span>
      </div>

      {/* Cards Grid */}
      {filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResumes.map((resume) => {
            const initial = (resume.target_employer?.[0] || resume.title?.[0] || 'R').toUpperCase()
            const scoreBadgeClass =
              resume.atsScore >= 85
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : resume.atsScore >= 70
                ? 'bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] border-[#0F766E]/20'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'

            return (
              <div
                key={resume.id}
                className="flex flex-col justify-between rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] hover:border-[#0F766E]/30 dark:hover:border-[#14B8A6]/30 transition-colors duration-150 space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#0F766E] dark:text-[#14B8A6] flex items-center justify-center font-mono text-[13px] font-medium shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                          {resume.target_role || 'Target Role'}
                        </h3>
                        <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] truncate">
                          {resume.target_employer || 'Target Employer'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-[11px] font-mono tabular-nums font-medium px-2 py-0.5 rounded-full border ${scoreBadgeClass}`}
                    >
                      ATS {resume.atsScore}%
                    </span>
                  </div>

                  {/* Metadata Box */}
                  <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] space-y-2">
                    <div className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] truncate">
                      {resume.title || 'Untitled Resume'}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#8A847A] font-mono tabular-nums">
                      <span>{resume.templateName} template</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 stroke-[1.5]" />
                        <span>{formatDate(resume.created_at)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] text-[11px]">
                      <span className="text-[#57534E] dark:text-[#ACA59A]">
                        Sections reviewed
                      </span>
                      {resume.isComplete ? (
                        <span className="inline-flex items-center gap-1 text-[#0F766E] dark:text-[#14B8A6] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          <span>Ready to export</span>
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums text-[#57534E] dark:text-[#ACA59A]">
                          {resume.savedSections}/{resume.totalSections} saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Strip */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06]">
                  <Link
                    href={`/builder/${resume.id}`}
                    className="flex-1 inline-flex items-center justify-between h-9 px-3.5 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white text-[13px] font-medium transition-colors duration-150"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="w-4 h-4 stroke-[1.5]" />
                      <span>Open builder</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.5] opacity-85" />
                  </Link>

                  <a
                    href={`/api/resume/${resume.id}/download`}
                    download
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-[#57534E] hover:text-[#1C1917] dark:text-[#ACA59A] dark:hover:text-[#EFECE6] bg-[#FAF8F5] dark:bg-[#12110F] hover:bg-[#F3EFE9] dark:hover:bg-[#24221F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] transition-colors duration-150 shrink-0"
                    title="Download PDF"
                    aria-label={`Download ${resume.title} PDF`}
                  >
                    <Download className="w-4 h-4 stroke-[1.5]" />
                  </a>

                  <DeleteResumeButton resumeId={resume.id} resumeTitle={resume.title} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-8 text-center space-y-2">
          <p className="text-[14px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
            No matching resumes
          </p>
          <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A]">
            Adjust your search term or status filter to view your compiled resumes.
          </p>
        </div>
      )}
    </div>
  )
}
