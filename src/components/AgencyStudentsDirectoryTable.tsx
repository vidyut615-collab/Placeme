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
import { PaginationControls } from '@/components/PaginationControls'
import { StudentMultiFilter, StudentFilterState } from '@/components/StudentMultiFilter'
import { formatDate } from '@/lib/utils'

export interface AgencyStudentRow {
  id: string
  studentId: string | null
  email: string
  name: string
  degree: string
  department: string
  passingYear: string
  status: string
  college: string
  date: string
}

interface AgencyStudentsDirectoryTableProps {
  students: AgencyStudentRow[]
  query?: string
}

export function AgencyStudentsDirectoryTable({
  students,
  query
}: AgencyStudentsDirectoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<StudentFilterState>({
    degrees: [],
    departments: [],
    years: [],
    colleges: [],
    statuses: []
  })
  const pageSize = 25

  const availableColleges = useMemo(() => {
    const set = new Set<string>()
    students.forEach(s => {
      if (s.college && s.college !== '—' && s.college !== 'Unknown') set.add(s.college)
    })
    return Array.from(set).sort()
  }, [students])

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
      if (filters.colleges && filters.colleges.length > 0 && !filters.colleges.includes(s.college)) return false
      if (filters.degrees.length > 0 && !filters.degrees.includes(s.degree)) return false
      if (filters.departments.length > 0 && !filters.departments.includes(s.department)) return false
      if (filters.years.length > 0 && !filters.years.includes(s.passingYear)) return false
      if (filters.statuses && filters.statuses.length > 0) {
        const isStudentActive = s.status === 'active'
        const category = isStudentActive ? 'Active' : 'Pending'
        if (!filters.statuses.includes(category)) return false
      }
      return true
    })
  }, [students, filters])

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return filteredStudents.slice(start, start + pageSize)
  }, [filteredStudents, safeCurrentPage, pageSize])

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
      <div className="p-4 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
        <StudentMultiFilter
          availableDegrees={availableDegrees}
          availableDepartments={availableDepartments}
          availableYears={availableYears}
          availableColleges={availableColleges}
          filters={filters}
          onFilterChange={(newFilters) => {
            setFilters(newFilters)
            setCurrentPage(1)
          }}
          onClearFilters={() => {
            setFilters({ degrees: [], departments: [], years: [], colleges: [], statuses: [] })
            setCurrentPage(1)
          }}
        />
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Degree</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Passing Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>College</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedStudents.length > 0 ? (
              paginatedStudents.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm">{item.email}</TableCell>
                  <TableCell className="text-sm">
                    {item.degree !== '—' ? (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {item.degree}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700 dark:text-zinc-300">{item.department}</TableCell>
                  <TableCell className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.passingYear}</TableCell>
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
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">{item.college}</TableCell>
                  <TableCell className="text-right">
                    {item.studentId ? (
                      <Link
                        href={`/agency/students/${item.studentId}`}
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                      >
                        View Profile
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-zinc-500 text-sm">
                  {query || filters.degrees.length > 0 || filters.departments.length > 0 || filters.years.length > 0 || (filters.colleges && filters.colleges.length > 0) || (filters.statuses && filters.statuses.length > 0)
                    ? 'No students found matching your search or filters.'
                    : 'No students found in the network.'}
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
