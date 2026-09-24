'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { PaginationControls } from '@/components/PaginationControls'
import { StudentMultiFilter, StudentFilterState } from '@/components/StudentMultiFilter'
import { StudentRowActions } from '@/components/StudentRowActions'
import { Search, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface CollegeStudentItem {
  id: string
  studentId?: string | null
  email: string
  name: string
  degree: string
  department: string
  passingYear: string
  status: 'active' | 'pending'
  date: string
  isInvite: boolean
}

interface AgencyCollegeStudentsTableProps {
  students: CollegeStudentItem[]
  collegeName: string
  collegeId: string
}

export function AgencyCollegeStudentsTable({ students, collegeName, collegeId }: AgencyCollegeStudentsTableProps) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<StudentFilterState>({
    degrees: [],
    departments: [],
    years: [],
    statuses: []
  })
  const pageSize = 25

  const availableDegrees = useMemo(() => {
    const set = new Set<string>()
    students.forEach(s => {
      if (s.degree && s.degree !== '—') set.add(s.degree)
    })
    return Array.from(set).sort()
  }, [students])

  const availableDepartments = useMemo(() => {
    const set = new Set<string>()
    students.forEach(s => {
      if (s.department && s.department !== '—') set.add(s.department)
    })
    return Array.from(set).sort()
  }, [students])

  const availableYears = useMemo(() => {
    const set = new Set<string>()
    students.forEach(s => {
      if (s.passingYear && s.passingYear !== '—') set.add(s.passingYear)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [students])

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = search.trim().toLowerCase()
      if (q) {
        const matchesSearch =
          s.name.toLowerCase().includes(q) || 
          s.email.toLowerCase().includes(q) ||
          s.degree.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.passingYear.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }

      if (filters.degrees.length > 0 && !filters.degrees.includes(s.degree)) {
        return false
      }
      if (filters.departments.length > 0 && !filters.departments.includes(s.department)) {
        return false
      }
      if (filters.years.length > 0 && !filters.years.includes(s.passingYear)) {
        return false
      }
      if (filters.statuses && filters.statuses.length > 0) {
        const isStudentActive = s.status === 'active'
        const category = isStudentActive ? 'Active' : 'Pending'
        if (!filters.statuses.includes(category)) return false
      }

      return true
    })
  }, [students, search, filters])

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, safeCurrentPage, pageSize])

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
      <div className="p-4 border-b space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Enrolled Students & Invitations
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Directory of all students under {collegeName}.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by name, email, department..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 h-9 text-sm bg-white dark:bg-zinc-950"
            />
          </div>
        </div>

        <StudentMultiFilter
          availableDegrees={availableDegrees}
          availableDepartments={availableDepartments}
          availableYears={availableYears}
          filters={filters}
          onFilterChange={(newFilters) => {
            setFilters(newFilters)
            setCurrentPage(1)
          }}
          onClearFilters={() => {
            setFilters({ degrees: [], departments: [], years: [], statuses: [] })
            setCurrentPage(1)
          }}
        />
      </div>

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
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">
                    {item.email}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.degree !== '—' ? (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
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
                    <StudentRowActions
                      studentId={item.studentId}
                      invitationId={item.isInvite ? item.id : null}
                      email={item.email}
                      name={item.name}
                      collegeId={collegeId}
                      isInvite={item.isInvite}
                      viewProfileHref={item.studentId ? `/agency/students/${item.studentId}` : undefined}
                      canDelete={true}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-zinc-500 text-sm">
                  {search || filters.degrees.length > 0 || filters.departments.length > 0 || filters.years.length > 0 || (filters.statuses && filters.statuses.length > 0)
                    ? 'No students found matching your search or filters.'
                    : 'No students have been enrolled yet.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredStudents.length > 0 && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={filteredStudents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="students"
        />
      )}
    </div>
  )
}
