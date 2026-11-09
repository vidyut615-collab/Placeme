import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { ReportDetailClient } from './ReportDetailClient'

interface PageProps {
  params: Promise<{ reportId: string }>
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { reportId } = await params

  const supabase = await createClient()
  const adminDb = getAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  if (!collegeId) {
    redirect('/college/placement-readiness')
  }

  // Fetch report by ID
  const { data: report, error } = await adminDb
    .from('tpo_readiness_reports')
    .select('*')
    .eq('id', reportId)
    .eq('college_id', collegeId)
    .maybeSingle()

  if (error || !report) {
    redirect('/college/placement-readiness')
  }

  return <ReportDetailClient report={report} />
}
