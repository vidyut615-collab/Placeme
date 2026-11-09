import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { PlacementReadinessClient } from './PlacementReadinessClient'

export default async function PlacementReadinessPage() {
  const supabase = await createClient()
  const adminDb = getAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.app_metadata?.role || ''
  if (!['college_admin', 'college_staff', 'superadmin'].includes(role)) {
    redirect('/login')
  }

  let collegeId = user.app_metadata?.college_id
  if (!collegeId) {
    const { data: userRow } = await adminDb
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .maybeSingle()
    collegeId = userRow?.college_id
  }

  let collegeCredits = 500
  let availableYears: string[] = ['2026', '2025', '2027', '2028']
  let availableDegrees: string[] = ['B.Tech', 'MCA', 'M.Tech', 'BBA', 'B.Com']
  let availableDepartments: string[] = [
    'CMPN',
    'IT',
    'CIVIL',
    'MECH',
  ]

  if (collegeId) {
    const { data: college } = await adminDb
      .from('colleges')
      .select('credit_balance, onboarding_fields')
      .eq('id', collegeId)
      .maybeSingle()

    if (college) {
      if (typeof college.credit_balance === 'number') {
        collegeCredits = college.credit_balance
      }
      if (college.onboarding_fields?.years && college.onboarding_fields.years.length > 0) {
        availableYears = college.onboarding_fields.years
      }
      if (college.onboarding_fields?.types && college.onboarding_fields.types.length > 0) {
        availableDegrees = college.onboarding_fields.types
      }
      if (college.onboarding_fields?.departments && college.onboarding_fields.departments.length > 0) {
        availableDepartments = college.onboarding_fields.departments
      }
    }
  }

  // Fetch lightweight student metadata for instant client-side student counting and credit calculation
  let studentsMeta: { id: string; year: string; degree: string; department: string }[] = []
  if (collegeId) {
    const { data: students } = await adminDb
      .from('students')
      .select('id, profile_data')
      .eq('college_id', collegeId)

    if (students) {
      studentsMeta = students.map((s: any) => {
        const prof = s.profile_data || {}
        return {
          id: s.id,
          year: String(prof.year || prof.academic_year || prof.graduation_year || prof.academics?.graduation_year || ''),
          degree: String(prof.type || prof.degree || prof.academics?.degree || ''),
          department: String(prof.department || prof.branch || prof.academics?.department || ''),
        }
      })
    }
  }

  // Fetch past reports using admin client to guarantee complete history visibility
  let pastReports: any[] = []
  if (collegeId) {
    const { data } = await adminDb
      .from('tpo_readiness_reports')
      .select('*')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      pastReports = data
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
      <PlacementReadinessClient
        collegeCredits={collegeCredits}
        availableYears={availableYears}
        availableDegrees={availableDegrees}
        availableDepartments={availableDepartments}
        studentsMeta={studentsMeta}
        pastReports={pastReports}
      />
    </div>
  )
}
