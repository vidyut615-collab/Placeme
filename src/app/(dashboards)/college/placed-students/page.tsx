import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PlacedStudentsTable } from '@/components/PlacedStudentsTable'
import { Card, CardContent } from '@/components/ui/card'
import { Award, TrendingUp, IndianRupee, Building, Sparkles } from 'lucide-react'

export default async function PlacedStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || (user.app_metadata.role !== 'college_admin' && user.app_metadata.role !== 'college_staff')) {
    redirect('/login')
  }

  const collegeId = user.app_metadata.college_id

  // Fetch approved offers for this college
  const [
    { data: approvedOffers },
    { data: policyRow }
  ] = await Promise.all([
    supabase
      .from('student_offers')
      .select(`
        id,
        company_name,
        job_role,
        compensation_ctc,
        offer_type,
        offer_letter_url,
        reviewed_at,
        student_confirmed_at,
        students (
          id,
          user_id,
          profile_data,
          users ( email )
        )
      `)
      .eq('college_id', collegeId)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false }),

    supabase
      .from('placement_policies')
      .select('config')
      .eq('college_id', collegeId)
      .maybeSingle()
  ])

  // Normalize student user email
  const formattedOffers = (approvedOffers || []).map(offer => {
    const rawStudent = Array.isArray(offer.students) ? offer.students[0] : offer.students
    const student = rawStudent as any
    const rawUsers = student?.users
    const userEmail = Array.isArray(rawUsers) ? rawUsers[0]?.email : rawUsers?.email

    return {
      ...offer,
      students: student ? {
        id: student.id,
        user_id: student.user_id,
        profile_data: student.profile_data,
        user_email: userEmail || 
          student.profile_data?.personal?.email || 
          student.profile_data?.email || 
          ''
      } : null
    }
  })

  // Calculate statistics
  const totalPlaced = formattedOffers.length
  const ctcs = formattedOffers.map(o => Number(o.compensation_ctc) || 0)
  const highestCtc = ctcs.length > 0 ? Math.max(...ctcs) : 0
  const avgCtc = ctcs.length > 0 ? (ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(1) : '0'

  const onCampusCount = formattedOffers.filter(o => o.offer_type === 'on_campus').length
  const offCampusCount = formattedOffers.filter(o => o.offer_type === 'off_campus').length

  const dreamMin = policyRow?.config?.dream?.min_ctc || 8
  const superDreamMin = policyRow?.config?.super_dream?.min_ctc || 15

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Placed Students Directory</h1>
        <p className="text-zinc-500 mt-2">
          Authoritative master roster of all students whose placement offers have been verified and approved by the college.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Placed</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalPlaced}</h3>
              <p className="text-[11px] text-zinc-400">Verified institutional records</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Highest Package</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">₹{highestCtc} LPA</h3>
              <p className="text-[11px] text-zinc-400">Top offer secured</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Average CTC</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">₹{avgCtc} LPA</h3>
              <p className="text-[11px] text-zinc-400">Batch mean compensation</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Channel Breakdown</p>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {onCampusCount} <span className="text-xs text-zinc-500 font-normal">Campus</span> &bull; {offCampusCount} <span className="text-xs text-zinc-500 font-normal">Off</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Campus vs Direct placement</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Placed Students Table */}
      <PlacedStudentsTable
        offers={formattedOffers as any}
        dreamMin={dreamMin}
        superDreamMin={superDreamMin}
      />
    </div>
  )
}
