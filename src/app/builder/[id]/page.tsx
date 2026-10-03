import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BuilderClient from './BuilderClient'

export default async function ResumeBuilderPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  // Fetch the specific AI Resume
  const { data: resume, error } = await supabase
    .from('ai_resumes')
    .select('*')
    .eq('id', params.id)
    .eq('student_id', user.id)
    .single()

  if (error || !resume) return redirect('/student/ai-resume')

  // Fetch the student profile for static data
  const { data: student } = await supabase
    .from('students')
    .select('profile_data')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Header bar */}
      <header className="h-14 border-b bg-white dark:bg-zinc-900 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <a href="/student/ai-resume" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            &larr; Back to Dashboard
          </a>
          <h1 className="font-bold text-lg">{resume.resume_name}</h1>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-full font-medium">
            AI Builder
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
            Download PDF
          </button>
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <BuilderClient 
        resume={resume} 
        profileData={student?.profile_data || {}} 
      />
    </div>
  )
}
