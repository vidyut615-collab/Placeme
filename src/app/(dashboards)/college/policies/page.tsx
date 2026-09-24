import { createClient } from '@/utils/supabase/server'
import { NewPlacementPolicyEditor } from '@/components/NewPlacementPolicyEditor'
import { DEFAULT_POLICY_CONFIG } from '@/lib/policy-engine'

export default async function CollegePoliciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user?.app_metadata?.role === 'college_admin'

  // Fetch the current policy config for the college
  const { data: policyRow } = await supabase
    .from('placement_policies')
    .select('config')
    .maybeSingle()

  // Merge with defaults
  const initialConfig = {
    ...DEFAULT_POLICY_CONFIG,
    ...(policyRow?.config || {})
  }

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Placement Policies</h1>
          <p className="text-zinc-500 mt-2">
            Configure rules, limits, and penalties for your placement cycle.
            Active policies are automatically enforced when managing students.
          </p>
        </div>
      </div>

      <NewPlacementPolicyEditor initialConfig={initialConfig} isAdmin={isAdmin} />
    </div>
  )
}
