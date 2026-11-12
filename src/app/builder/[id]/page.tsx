import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import BuilderClient from './BuilderClient'

export default async function ResumeBuilderPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: resume, error } = await supabase
    .from('ai_resumes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !resume) {
    return (
      <div className="min-h-screen w-full bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[14px] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] p-6 space-y-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertCircle className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-[18px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
              Resume not found
            </h1>
            <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
              This resume may have been deleted or you do not have access to open it.
            </p>
          </div>
          <Link
            href="/student/ai-resume"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-[#0F766E] to-[#10B981] text-white text-[13px] font-medium transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
            <span>Back to AI Resume Maker</span>
          </Link>
        </div>
      </div>
    )
  }

  const { data: student } = await supabase
    .from('students')
    .select('profile_data')
    .eq('user_id', user.id)
    .single()

  return <BuilderClient resume={resume} profileData={student?.profile_data || {}} />
}
