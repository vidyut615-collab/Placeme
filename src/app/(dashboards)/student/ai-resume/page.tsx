import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, FileText, Calendar, Plus } from 'lucide-react'
import { CreateResumeModal } from './CreateResumeModal'

export default async function AIResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // 1. Fetch student credits & access
  const { data: student } = await supabase
    .from('students')
    .select('credit_balance, access_end_date')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div>Error loading profile.</div>
  }

  // 2. Fetch all previously generated resumes
  const { data: resumes } = await supabase
    .from('ai_resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 3. Check if profile has enough data (at least 1 work history OR 1 project)
  // For safety, we'll just check if they have at least *something* in their digiprofile
  const { count: workCount } = await supabase
    .from('student_work_histories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: projectCount } = await supabase
    .from('student_projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const hasProfileData = (workCount || 0) > 0 || (projectCount || 0) > 0

  // Check if they have active access
  const isActive = student.access_end_date && new Date(student.access_end_date) >= new Date()

  return (
    <div className="flex flex-1 flex-col p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" /> AI Resume Maker
          </h1>
          <p className="text-zinc-500 mt-2">
            Tailor your resume perfectly to any Job Description using AI.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full font-medium text-sm border border-purple-200 dark:border-purple-800">
            {student.credit_balance || 0} AI Credits
          </div>
          
          <CreateResumeModal 
            creditBalance={student.credit_balance || 0} 
            isActive={isActive}
            hasProfileData={hasProfileData}
          />
        </div>
      </div>

      {!isActive && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <span>Your platform access is currently inactive. You must unlock access in the Billing tab to create AI Resumes.</span>
        </div>
      )}

      {resumes && resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resumes.map((resume: any) => (
            <Card key={resume.id} className="hover:shadow-md transition-shadow group flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{resume.title || 'Untitled Resume'}</CardTitle>
                <CardDescription className="line-clamp-1">{resume.target_role || 'General Role'} at {resume.target_employer || 'Any Company'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xs text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(resume.created_at).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="secondary" className="w-full group-hover:bg-purple-600 group-hover:text-white transition-colors" asChild>
                  <a href={`/student/ai-resume/builder/${resume.id}`}>
                    <FileText className="w-4 h-4 mr-2" /> Open Builder
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No AI Resumes Yet</h3>
          <p className="text-zinc-500 text-center max-w-md mb-6">
            Create your first AI-tailored resume by pasting a job description. We'll perfectly align your profile to the role.
          </p>
          <CreateResumeModal 
            creditBalance={student.credit_balance || 0} 
            isActive={isActive} 
          />
        </div>
      )}
    </div>
  )
}
