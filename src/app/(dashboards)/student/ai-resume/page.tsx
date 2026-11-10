import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, FileText, Calendar, ArrowRight, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react'
import { CreateResumeModal } from './CreateResumeModal'
import { DeleteResumeButton } from './DeleteResumeButton'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function AIResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'student') {
    redirect('/login')
  }

  // 1. Fetch student credits, access, and profile JSON
  const { data: student } = await supabase
    .from('students')
    .select('credit_balance, access_end_date, profile_data')
    .eq('user_id', user.id)
    .single()

  if (!student) {
    return <div className="p-8 text-zinc-400 font-mono text-sm">Error loading candidate profile.</div>
  }

  // 2. Fetch all previously generated resumes
  const { data: resumes } = await supabase
    .from('ai_resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // 3. Check if profile has enough data
  const profileData = (student.profile_data as any) || {}
  const workCount = profileData.experience?.length || 0
  const projectCount = profileData.projects?.length || 0
  const actCount = profileData.activities?.length || 0
  const recCount = profileData.recognitions?.length || 0
  
  const hasProfileData = workCount > 0 || projectCount > 0 || actCount > 0 || recCount > 0

  // Check if they have active access
  const isActive = student.access_end_date && new Date(student.access_end_date) >= new Date()

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">AI Resume Studio</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
              LaTeX ATS Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Compile job-tailored, ATS-optimized resumes with verifiable metrics and keyword alignment.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono shadow-2xs">
            <span className="text-zinc-500">Balance:</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{student.credit_balance || 0} Credits</span>
          </div>
          
          <CreateResumeModal 
            creditBalance={student.credit_balance || 0} 
            isActive={!!isActive}
            hasProfileData={hasProfileData}
          />
        </div>
      </div>

      {/* Inactive Access Alert */}
      {!isActive && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 stroke-[1.5]" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">Subscription Required</p>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your AI workspace access is inactive. Please activate your subscription via the Billing portal to trigger LLM synthesis runs.
            </p>
          </div>
        </div>
      )}

      {/* Resumes Grid / List */}
      {resumes && resumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume: any) => {
            let score: number | null = null
            try {
              const content = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})
              score = content.ats_score?.match_score || null
            } catch (e) {
              score = null
            }

            return (
              <div
                key={resume.id}
                className="group flex flex-col justify-between p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 transition space-y-4 shadow-xs"
              >
                <div className="space-y-3">
                  {/* Top Bar: Title & ATS Score */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition truncate">
                        {resume.title || 'Untitled Resume'}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {resume.target_role || 'Target Role'} <span className="text-zinc-400 dark:text-zinc-600">at</span> {resume.target_employer || 'Target Employer'}
                      </p>
                    </div>

                    {score !== null && (
                      <span className="shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
                        ATS {score}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                    <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span suppressHydrationWarning>{formatDate(resume.created_at)}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Link
                    href={`/builder/${resume.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition"
                  >
                    <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Open Studio</span>
                    <ArrowRight className="w-3 h-3 ml-auto text-zinc-400" />
                  </Link>
                  <DeleteResumeButton resumeId={resume.id} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400">
            <Cpu className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Tailored Resumes Compiled</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Paste a Job Description and compile your first LaTeX resume tailored to pass ATS algorithms with 90%+ match score.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
