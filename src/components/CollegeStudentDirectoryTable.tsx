'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StudentActionsDropdown } from '@/components/StudentActionsDropdown'
import { StudentRowActions } from '@/components/StudentRowActions'
import { PaginationControls } from '@/components/PaginationControls'
import { StudentMultiFilter, StudentFilterState } from '@/components/StudentMultiFilter'
import { formatDate } from '@/lib/utils'

export interface CollegeStudentRow {
  id: string
  email: string
  name: string
  degree: string
  department: string
  passingYear: string
  status: string
  date: string
  isInvite: boolean
  isBlacklisted: boolean
  blacklistReason: string | null
  counters: any
}

interface CollegeStudentDirectoryTableProps {
  activeAndPendingList: CollegeStudentRow[]
  blacklistedList: CollegeStudentRow[]
  query?: string
  collegeId?: string
}

export function CollegeStudentDirectoryTable({
  activeAndPendingList,
  blacklistedList,
  query,
  collegeId
}: CollegeStudentDirectoryTableProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'blacklisted'>('active')
  const [activePage, setActivePage] = useState(1)
  const [blacklistedPage, setBlacklistedPage] = useState(1)
  const [filters, setFilters] = useState<StudentFilterState>({
    degrees: [],
    departments: [],
    years: [],
    statuses: []
  })
  const pageSize = 25

  const allStudents = useMemo(
    () => [...activeAndPendingList, ...blacklistedList],
    [activeAndPendingList, blacklistedList]
  )

  const availableDegrees = useMemo(() => {
    const set = new Set<string>()
    allStudents.forEach(s => {
      if (s.degree && s.degree !== '—') set.add(s.degree)
    })
    return Array.from(set).sort()
  }, [allStudents])

  const availableDepartments = useMemo(() => {
    const set = new Set<string>()
    allStudents.forEach(s => {
      if (s.department && s.department !== '—') set.add(s.department)
    })
    return Array.from(set).sort()
  }, [allStudents])

  const availableYears = useMemo(() => {
    const set = new Set<string>()
    allStudents.forEach(s => {
      if (s.passingYear && s.passingYear !== '—') set.add(s.passingYear)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [allStudents])

  // Filtered lists
  const filteredActiveList = useMemo(() => {
    return activeAndPendingList.filter(s => {
      if (filters.degrees.length > 0 && !filters.degrees.includes(s.degree)) return false
      if (filters.departments.length > 0 && !filters.departments.includes(s.department)) return false
      if (filters.years.length > 0 && !filters.years.includes(s.passingYear)) return false
      if (filters.statuses && filters.statuses.length > 0) {
        const isStudentActive = !s.isBlacklisted && s.status === 'active'
        const category = isStudentActive ? 'Active' : 'Pending'
        if (!filters.statuses.includes(category)) return false
      }
      return true
    })
  }, [activeAndPendingList, filters])

  const filteredBlacklistedList = useMemo(() => {
    return blacklistedList.filter(s => {
      if (filters.degrees.length > 0 && !filters.degrees.includes(s.degree)) return false
      if (filters.departments.length > 0 && !filters.departments.includes(s.department)) return false
      if (filters.years.length > 0 && !filters.years.includes(s.passingYear)) return false
      if (filters.statuses && filters.statuses.length > 0) {
        // Blacklisted students are neither Active nor Pending
        return false
      }
      return true
    })
  }, [blacklistedList, filters])

  // Active & Pending pagination
  const totalActivePages = Math.ceil(filteredActiveList.length / pageSize) || 1
  const safeActivePage = Math.min(activePage, totalActivePages)
  const paginatedActiveList = useMemo(() => {
    const start = (safeActivePage - 1) * pageSize
    return filteredActiveList.slice(start, start + pageSize)
  }, [filteredActiveList, safeActivePage, pageSize])

  // Blacklisted pagination
  const totalBlacklistedPages = Math.ceil(filteredBlacklistedList.length / pageSize) || 1
  const safeBlacklistedPage = Math.min(blacklistedPage, totalBlacklistedPages)
  const paginatedBlacklistedList = useMemo(() => {
    const start = (safeBlacklistedPage - 1) * pageSize
    return filteredBlacklistedList.slice(start, start + pageSize)
  }, [filteredBlacklistedList, safeBlacklistedPage, pageSize])

  const hasAnyFilter = 
    filters.degrees.length > 0 || 
    filters.departments.length > 0 || 
    filters.years.length > 0 ||
    (filters.statuses ? filters.statuses.length > 0 : false)

  return (
    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'active' | 'blacklisted')} className="w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <TabsList>
          <TabsTrigger value="active">Active & Pending ({filteredActiveList.length})</TabsTrigger>
          <TabsTrigger value="blacklisted">Blacklisted ({filteredBlacklistedList.length})</TabsTrigger>
        </TabsList>

        <StudentMultiFilter
          availableDegrees={availableDegrees}
          availableDepartments={availableDepartments}
          availableYears={availableYears}
          filters={filters}
          onFilterChange={(newFilters) => {
            setFilters(newFilters)
            setActivePage(1)
            setBlacklistedPage(1)
          }}
          onClearFilters={() => {
            setFilters({ degrees: [], departments: [], years: [], statuses: [] })
            setActivePage(1)
            setBlacklistedPage(1)
          }}
        />
      </div>

      <TabsContent value="active">
        <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm w-full overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Passing Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActiveList.length > 0 ? (
                  paginatedActiveList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</div>
                        {item.counters && Object.keys(item.counters).length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap max-w-[220px]">
                            {item.counters.no_shows > 0 && (
                              <span className="text-[10px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                                {item.counters.no_shows} No-Shows
                              </span>
                            )}
                            {item.counters.withdrawals > 0 && (
                              <span className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.5 rounded-full">
                                {item.counters.withdrawals} Withdrawals
                              </span>
                            )}
                            {item.counters.post_shortlist_withdrawals > 0 && (
                              <span className="text-[10px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                                {item.counters.post_shortlist_withdrawals} Late Drops
                              </span>
                            )}
                            {item.counters.disciplinary > 0 && (
                              <span className="text-[10px] bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                                {item.counters.disciplinary} Disciplinary
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">{item.email}</TableCell>
                      <TableCell className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
                        {item.degree !== '—' ? (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium">
                            {item.degree}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-700 dark:text-zinc-300">
                        {item.department}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {item.passingYear}
                      </TableCell>
                      <TableCell>
                        {item.status === 'active' ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-950/50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-950/50 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300 ring-1 ring-inset ring-yellow-600/20">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs" suppressHydrationWarning>
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!item.isInvite ? (
                          <StudentActionsDropdown studentId={item.id} isBlacklisted={item.isBlacklisted} />
                        ) : (
                          <StudentRowActions
                            invitationId={item.id}
                            email={item.email}
                            name={item.name}
                            collegeId={collegeId || ''}
                            isInvite={true}
                            canDelete={false}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                      {query || hasAnyFilter
                        ? 'No active students match your search or filters.'
                        : 'No active students found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredActiveList.length > 0 && (
            <PaginationControls
              currentPage={safeActivePage}
              totalPages={totalActivePages}
              totalItems={filteredActiveList.length}
              pageSize={pageSize}
              onPageChange={setActivePage}
              itemLabel="active students"
            />
          )}
        </div>
      </TabsContent>

      <TabsContent value="blacklisted">
        <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm w-full overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Passing Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBlacklistedList.length > 0 ? (
                  paginatedBlacklistedList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">{item.email}</TableCell>
                      <TableCell className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
                        {item.degree !== '—' ? (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium">
                            {item.degree}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-700 dark:text-zinc-300">
                        {item.department}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {item.passingYear}
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/50 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300 ring-1 ring-inset ring-red-600/20 max-w-[200px] truncate"
                          title={item.blacklistReason || ''}
                        >
                          Blacklisted: {item.blacklistReason || 'Policy Violation'}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs" suppressHydrationWarning>
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!item.isInvite ? (
                          <StudentActionsDropdown studentId={item.id} isBlacklisted={item.isBlacklisted} />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                      {query || hasAnyFilter
                        ? 'No blacklisted students match your search or filters.'
                        : 'No students have been blacklisted.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredBlacklistedList.length > 0 && (
            <PaginationControls
              currentPage={safeBlacklistedPage}
              totalPages={totalBlacklistedPages}
              totalItems={filteredBlacklistedList.length}
              pageSize={pageSize}
              onPageChange={setBlacklistedPage}
              itemLabel="blacklisted students"
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
