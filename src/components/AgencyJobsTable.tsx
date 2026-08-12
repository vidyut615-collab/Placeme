'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

// The joined type from our query
type JobRow = {
  id: string
  title: string
  status: string
  college_id: string | null
  created_at: string
  colleges: { name: string } | null
  application_count?: number
}

interface AgencyJobsTableProps {
  jobs: JobRow[]
}

export function AgencyJobsTable({ jobs }: AgencyJobsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterScope, setFilterScope] = useState('all') // 'all', 'global', 'local'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'paused'

  // Filter and Sort logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search by title or college name
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        job.title.toLowerCase().includes(query) || 
        (job.colleges?.name || 'Global').toLowerCase().includes(query)

      // 2. Filter by Scope
      let matchesScope = true
      if (filterScope === 'global') matchesScope = job.college_id === null
      if (filterScope === 'local') matchesScope = job.college_id !== null

      // 3. Filter by Status
      let matchesStatus = true
      if (filterStatus !== 'all') matchesStatus = job.status === filterStatus

      return matchesSearch && matchesScope && matchesStatus
    })
  }, [jobs, searchQuery, filterScope, filterStatus])

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-md border shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search by job or college..." 
            className="pl-9" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <Select value={filterScope} onValueChange={(val) => setFilterScope(val || 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="global">Global (Agency)</SelectItem>
              <SelectItem value="local">Local (Colleges)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'all')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Scope (College)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applicants</TableHead>
              <TableHead>Posted On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs && filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    {job.college_id ? (
                      <div className="flex flex-col">
                        <span className="text-sm">{job.colleges?.name}</span>
                        <span className="text-xs text-blue-600 font-medium">Local</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                        Global (Agency)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {job.application_count ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/agency/jobs/${job.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                      View Applications
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                  No jobs matched your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
