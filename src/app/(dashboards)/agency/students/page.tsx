import { createClient } from '@/utils/supabase/server'
import { Input } from '@/components/ui/input'
import { AgencyStudentsDirectoryTable } from '@/components/AgencyStudentsDirectoryTable'

export default async function AgencyStudentsPage(props: { 
  searchParams?: Promise<{ 
    q?: string
    page?: string
    colleges?: string
    degrees?: string
    departments?: string
    years?: string
    statuses?: string
  }> 
}) {
  const searchParams = (await props.searchParams) || {}
  const q = searchParams.q?.toLowerCase() || ''
  const page = parseInt(searchParams.page || '1', 10)
  const pageSize = 25
  
  // Parse arrays from comma-separated strings
  const colleges = searchParams.colleges ? searchParams.colleges.split(',') : []
  const degrees = searchParams.degrees ? searchParams.degrees.split(',') : []
  const departments = searchParams.departments ? searchParams.departments.split(',') : []
  const years = searchParams.years ? searchParams.years.split(',') : []
  const statuses = searchParams.statuses ? searchParams.statuses.split(',') : []

  const supabase = await createClient()

  // 1. Fetch distinct filter options using RPC
  const { data: filterMetadata } = await supabase.rpc('get_agency_students_filters')
  
  const availableColleges = filterMetadata?.colleges?.sort() || []
  const availableDegrees = filterMetadata?.degrees?.sort() || []
  const availableDepartments = filterMetadata?.departments?.sort() || []
  const availableYears = filterMetadata?.years?.sort((a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })) || []

  // 2. Build the paginated database query on the pre-combined View
  let queryBuilder = supabase
    .from('vw_agency_students_directory')
    .select('*', { count: 'exact' })

  // Apply filters at the database level
  if (q) {
    queryBuilder = queryBuilder.or(`name.ilike.%${q}%,email.ilike.%${q}%,college.ilike.%${q}%`)
  }
  if (colleges.length > 0) {
    queryBuilder = queryBuilder.in('college', colleges)
  }
  if (degrees.length > 0) {
    queryBuilder = queryBuilder.in('degree', degrees)
  }
  if (departments.length > 0) {
    queryBuilder = queryBuilder.in('department', departments)
  }
  if (years.length > 0) {
    queryBuilder = queryBuilder.in('passing_year', years)
  }
  if (statuses.length > 0) {
    const activeChecked = statuses.includes('Active')
    const pendingChecked = statuses.includes('Pending')
    if (activeChecked && !pendingChecked) queryBuilder = queryBuilder.eq('status', 'active')
    if (pendingChecked && !activeChecked) queryBuilder = queryBuilder.eq('status', 'pending')
  }

  // Apply pagination and sorting
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  const { data: studentsData, count } = await queryBuilder
    .order('date', { ascending: false })
    .range(from, to)

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / pageSize) || 1

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
          <p className="text-zinc-500 mt-2">A global view of all students across the network.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form className="w-full max-w-sm" action="/agency/students" method="GET">
          <Input
            name="q"
            placeholder="Search by name, email or college..."
            defaultValue={q}
            className="w-full bg-white dark:bg-zinc-900"
          />
          {/* Preserve other filters as hidden inputs so search doesn't clear them */}
          {colleges.length > 0 && <input type="hidden" name="colleges" value={colleges.join(',')} />}
          {degrees.length > 0 && <input type="hidden" name="degrees" value={degrees.join(',')} />}
          {departments.length > 0 && <input type="hidden" name="departments" value={departments.join(',')} />}
          {years.length > 0 && <input type="hidden" name="years" value={years.join(',')} />}
          {statuses.length > 0 && <input type="hidden" name="statuses" value={statuses.join(',')} />}
        </form>
      </div>

      <AgencyStudentsDirectoryTable
        students={studentsData || []}
        query={q}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={page}
        pageSize={pageSize}
        availableColleges={availableColleges}
        availableDegrees={availableDegrees}
        availableDepartments={availableDepartments}
        availableYears={availableYears}
        activeFilters={{
          colleges,
          degrees,
          departments,
          years,
          statuses
        }}
      />
    </div>
  )
}
