import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentPoliciesViewer } from '@/components/StudentPoliciesViewer'
import { PolicyConfig, DEFAULT_POLICY_CONFIG } from '@/lib/policy-engine'

export default async function StudentPoliciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // Get student's college_id
  const { data: student } = await supabase
    .from('students')
    .select('college_id')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading student profile.</div>
  }

  // Fetch policies for the college
  const { data: policyDoc } = await supabase
    .from('placement_policies')
    .select('config')
    .eq('college_id', student.college_id)
    .single()
    
  const config = (policyDoc?.config || DEFAULT_POLICY_CONFIG) as PolicyConfig

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Placement Policies</h1>
        <p className="text-zinc-500 mt-2">Review the placement rules and policies set by your college.</p>
      </div>

      <StudentPoliciesViewer config={config} />
    </div>
  )
}
