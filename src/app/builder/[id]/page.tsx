import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BuilderClient from './BuilderClient'

export default async function ResumeBuilderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch the specific AI Resume
  const { data: resume, error } = await supabase
    .from('ai_resumes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !resume) {
    return (
      <div className="p-8">
        <h1 className="text-2xl text-red-500 mb-4">Error Loading Resume</h1>
        <pre className="bg-zinc-100 p-4 rounded text-sm text-black">
          {JSON.stringify({ error, resumeId: params.id, userId: user.id }, null, 2)}
        </pre>
      </div>
    )
  }

  // Fetch the student profile for static data
  const { data: student } = await supabase
    .from('students')
    .select('profile_data')
    .eq('user_id', user.id)
    .single()

  return (
    <BuilderClient 
      resume={resume} 
      profileData={student?.profile_data || {}} 
    />
  )
}
