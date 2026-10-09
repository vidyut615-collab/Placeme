'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
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
  student_id: string | null
  email: string
  name: string
  degree: string
  department: string
  passing_year: string
  status: string
  college: string
  date: string
}

interface AgencyStudentsDirectoryTableProps {
  students: AgencyStudentRow[]
  query?: string
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
  availableColleges: string[]
  availableDegrees: string[]
  availableDepartments: string[]
  availableYears: string[]
  activeFilters: StudentFilterState
}

export function AgencyStudentsDirectoryTable({
  students,
  query,
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  availableColleges,
  availableDegrees,
  availableDepartments,
  availableYears,
  activeFilters
}: AgencyStudentsDirectoryTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([name, value]) => {
        if (value === null || value === '') {
          params.delete(name)
        } else {
          params.set(name, value)
        }
      })
      return params.toString()
    },
    [searchParams]
  )

  const handlePageChange = (page: number) => {
    router.push(pathname + '?' + createQueryString({ page: page.toString() }))
  }

  const handleFilterChange = (newFilters: StudentFilterState) => {
    const updates: Record<string, string | null> = { page: '1' } // reset to page 1
    updates.colleges = (newFilters.colleges || []).length > 0 ? (newFilters.colleges || []).join(',') : null
    updates.degrees = newFilters.degrees.length > 0 ? newFilters.degrees.join(',') : null
    updates.departments = newFilters.departments.length > 0 ? newFilters.departments.join(',') : null
    updates.years = newFilters.years.length > 0 ? newFilters.years.join(',') : null
    updates.statuses = (newFilters.statuses || []).length > 0 ? (newFilters.statuses || []).join(',') : null

    router.push(pathname + '?' + createQueryString(updates))
  }

  const handleClearFilters = () => {
    const updates = {
      page: '1',
      colleges: null,
      degrees: null,
      departments: null,
      years: null,
      statuses: null
    }
    router.push(pathname + '?' + createQueryString(updates))
  }

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900 shadow-sm">
      <div className="p-4 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
        <StudentMultiFilter
          availableDegrees={availableDegrees}
          availableDepartments={availableDepartments}
          availableYears={availableYears}
          availableColleges={availableColleges}
          filters={activeFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
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
            {students.length > 0 ? (
              students.map((item) => (
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
                  <TableCell className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.passing_year}</TableCell>
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
                    {item.student_id ? (
                      <Link
                        href={`/agency/students/${item.student_id}`}
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
                  {query || activeFilters.degrees.length > 0 || activeFilters.departments.length > 0 || activeFilters.years.length > 0 || (activeFilters.colleges && activeFilters.colleges.length > 0) || (activeFilters.statuses && activeFilters.statuses.length > 0)
                    ? 'No students found matching your search or filters.'
                    : 'No students found in the network.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          itemLabel="students"
        />
      )}
    </div>
  )
}
