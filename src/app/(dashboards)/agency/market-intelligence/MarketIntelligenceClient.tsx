'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PaginationControls } from '@/components/PaginationControls'
import {
  Globe,
  ShieldCheck,
  AlertTriangle,
  Building2,
  ExternalLink,
  MapPin,
  TrendingUp,
  Search,
  Database,
} from 'lucide-react'

interface MarketIntelligenceProps {
  jobs: any[]
  totalCount: number
  cleanCount: number
  scamCount: number
}

export function MarketIntelligenceClient({
  jobs: initialJobs,
  totalCount,
  cleanCount,
  scamCount,
}: MarketIntelligenceProps) {
  const [filter, setFilter] = useState<'all' | 'clean' | 'suspicious' | 'scam'>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 100

  // Reset to page 1 whenever search query or status filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, search])

  const filteredJobs = useMemo(() => {
    return initialJobs.filter((j) => {
      if (filter !== 'all' && j.scam_status !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        const titleMatch = (j.title || '').toLowerCase().includes(q)
        const companyMatch = (j.company_name || '').toLowerCase().includes(q)
        const locMatch = (j.location || '').toLowerCase().includes(q)
        if (!titleMatch && !companyMatch && !locMatch) return false
      }
      return true
    })
  }, [initialJobs, filter, search])

  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedJobs = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredJobs.slice(start, start + pageSize)
  }, [filteredJobs, safeCurrentPage, pageSize])

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold">Total Lake Postings</CardDescription>
            <CardTitle className="text-3xl font-black">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Indexed across Indian portals
            </span>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Verified Clean
            </CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
              {cleanCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Passed prompt &amp; fee audits
            </span>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Flagged Scams / Suspicious
            </CardDescription>
            <CardTitle className="text-3xl font-black text-amber-700 dark:text-amber-400">
              {scamCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Blocked / Quarantined
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold">Primary Tech Hub</CardDescription>
            <CardTitle className="text-2xl font-black text-purple-600 dark:text-purple-400">
              Mumbai MMR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> BKC, Powai, Andheri, Navi Mumbai
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by role, company, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border w-full sm:w-auto">
          {(['all', 'clean', 'suspicious', 'scam'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium capitalize transition-colors flex-1 sm:flex-none ${
                filter === s
                  ? 'bg-white dark:bg-zinc-700 shadow-xs font-bold text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Discovered Jobs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" /> Discovered Jobs Lake Explorer
            </CardTitle>
            <Badge variant="secondary" className="w-fit text-[11px] font-normal text-zinc-600 dark:text-zinc-400">
              100 jobs per view
            </Badge>
          </div>
          <CardDescription>
            Live view of off-campus jobs aggregated from LinkedIn, Internshala, and Google Jobs with Posting Guard verdicts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-6">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-zinc-500 text-left">
                  <th className="py-2.5 font-semibold">Job Title &amp; Company</th>
                  <th className="py-2.5 font-semibold">Location</th>
                  <th className="py-2.5 font-semibold">Sources</th>
                  <th className="py-2.5 font-semibold">Posting Guard Status</th>
                  <th className="py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      No jobs matching current filter.
                    </td>
                  </tr>
                ) : (
                  paginatedJobs.map((job) => {
                    const sourcePortal = job.sources?.[0]?.portal || 'LinkedIn'
                    const applyUrl = job.sources?.[0]?.url || '#'

                    return (
                      <tr key={job.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{job.title}</div>
                          <div className="text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" /> {job.company_name}
                          </div>
                        </td>
                        <td className="py-3 text-zinc-600 dark:text-zinc-400">
                          {job.location}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-[10px]">
                            {sourcePortal}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {job.scam_status === 'clean' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[10px]">
                              Verified Clean
                            </Badge>
                          ) : job.scam_status === 'suspicious' ? (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-[10px]">
                              Suspicious
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 text-[10px]">
                              Blocked Scam
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <a
                            href={applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                          >
                            Source Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredJobs.length > 0 && (
            <PaginationControls
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredJobs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="discovered jobs"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
