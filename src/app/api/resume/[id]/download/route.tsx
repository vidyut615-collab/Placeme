import { createClient } from '@/utils/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import ResumePDFDocument from '@/app/builder/[id]/pdf-export/ResumePDFDocument'
import { ResumeDataState, ResumeSettings, WorkHistoryItem, ProjectItem } from '@/app/builder/[id]/templates/types'

const DEFAULT_SETTINGS: ResumeSettings = {
  template: 'classic',
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  lineHeight: 1.35,
  margin: 14,
  accentColor: '#1e3a8a',
  pageFit: 'auto',
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 1. Fetch Resume Record
    const { data: resume, error: resumeError } = await supabase
      .from('ai_resumes')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return new Response(JSON.stringify({ error: 'Resume not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 2. Fetch Student Profile
    const { data: student } = await supabase
      .from('students')
      .select('profile_data')
      .eq('user_id', user.id)
      .single()

    const profileData = student?.profile_data || {}
    const parsedContent = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})

    // 3. Normalize Work Histories (Saved resume content takes precedence)
    const existingWork = parsedContent.work_histories || []
    const profileExperience = profileData.experience || []
    const sourceWork = existingWork.length > 0 ? existingWork : profileExperience

    const mergedWork: WorkHistoryItem[] = sourceWork.map((_: any, i: number) => {
      const match = existingWork[i] || {}
      const exp = profileExperience[i] || {}
      return {
        profile_work_id: match.profile_work_id || `work_${i}`,
        role: match.role !== undefined && match.role !== '' ? match.role : (exp.role || ''),
        company: match.company !== undefined && match.company !== '' ? match.company : (exp.company || ''),
        start_date: match.start_date !== undefined && match.start_date !== '' ? match.start_date : (exp.start_date || ''),
        end_date: match.end_date !== undefined && match.end_date !== '' ? match.end_date : (exp.end_date || ''),
        tech: match.tech !== undefined ? match.tech : (exp.tech || ''),
        original_description: match.original_description || exp.description || '',
        is_tailored: !!match.is_tailored,
        is_saved: !!match.is_saved,
        ai_options: match.ai_options || [],
        final_edited_text: match.final_edited_text !== undefined ? match.final_edited_text : (exp.description || '')
      }
    })

    // 4. Normalize Projects
    const existingProjects = parsedContent.projects || []
    const profileProjects = profileData.projects || []
    const sourceProjects = existingProjects.length > 0 ? existingProjects : profileProjects

    const mergedProjects: ProjectItem[] = sourceProjects.map((_: any, i: number) => {
      const match = existingProjects[i] || {}
      const proj = profileProjects[i] || {}
      return {
        profile_project_id: match.profile_project_id || `proj_${i}`,
        title: match.title !== undefined && match.title !== '' ? match.title : (proj.title || ''),
        tech: match.tech !== undefined ? match.tech : (proj.tech || ''),
        original_description: match.original_description || proj.description || '',
        is_tailored: !!match.is_tailored,
        is_saved: !!match.is_saved,
        ai_options: match.ai_options || [],
        final_edited_text: match.final_edited_text !== undefined ? match.final_edited_text : (proj.description || '')
      }
    })

    const resumeData: ResumeDataState = {
      settings: { ...DEFAULT_SETTINGS, ...(parsedContent.settings || {}) },
      work_histories: mergedWork,
      projects: mergedProjects,
      career_objective: {
        is_generated: !!parsedContent.career_objective?.is_generated,
        is_saved: !!parsedContent.career_objective?.is_saved,
        ai_options: parsedContent.career_objective?.ai_options || [],
        final_edited_text: parsedContent.career_objective?.final_edited_text || ''
      },
      profile_overrides: parsedContent.profile_overrides || {}
    }

    // 5. Render Vector PDF Buffer using React-PDF
    const pdfBuffer = await renderToBuffer(
      <ResumePDFDocument
        profile={profileData}
        resumeData={resumeData}
        settings={resumeData.settings}
      />
    )

    // 6. Construct clean download filename
    const safeTitle = (resume.title || 'Resume')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
    const fileName = `${safeTitle}.pdf`

    // 7. Stream binary PDF response directly as attachment
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    })

  } catch (error: any) {
    console.error('PDF Generation Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
