'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ChevronDown, ChevronRight, Lock, Save, Edit3, Briefcase, FileCode, CheckCircle2, Loader2 } from 'lucide-react'
import { generateCareerObjectiveAction } from '@/app/(dashboards)/student/ai-resume/actions'

export default function BuilderClient({ resume, profileData }: { resume: any, profileData: any }) {
  const [activeTab, setActiveTab] = useState<string>('personal')
  const [isGeneratingObjective, setIsGeneratingObjective] = useState(false)

  const handleGenerateObjective = async () => {
    setIsGeneratingObjective(true)
    try {
      const workDump = aiWorkHistories.map((w: any) => w.final_edited_text).filter(Boolean).join('\n\n')
      const res = await generateCareerObjectiveAction(
        workDump,
        profileData.skills || {},
        resume.job_role,
        resume.company_name,
        resume.jd_text
      )
      if (res.error) throw new Error(res.error)
      
      const newObjective = { is_generated: true, ai_options: res.options, final_edited_text: "" }
      
      setResumeData((prev: any) => {
         const newData = { ...prev, career_objective: newObjective }
         // Save to DB immediately
         const supabase = createClient()
         supabase.from('ai_resumes').update({ content: newData }).eq('id', resume.id).then(({error}) => {
            if (error) console.error("Failed to save objective:", error)
         })
         return newData
      })
      
      import('sonner').then(m => m.toast.success('Career Objective Generated!'))
    } catch (err: any) {
      import('sonner').then(m => m.toast.error(err.message))
    } finally {
      setIsGeneratingObjective(false)
    }
  }
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Parse JSON state
  const initialContent = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})
  const [resumeData, setResumeData] = useState(initialContent)
  
  const [editorText, setEditorText] = useState<Record<string, string>>(() => {
    const state: Record<string, string> = {}
    if (initialContent.career_objective?.final_edited_text) state['objective'] = initialContent.career_objective.final_edited_text
    initialContent.work_histories?.forEach((w: any, i: number) => { if (w.final_edited_text) state[`work_${i}`] = w.final_edited_text })
    initialContent.projects?.forEach((p: any, i: number) => { if (p.final_edited_text) state[`proj_${i}`] = p.final_edited_text })
    return state
  })
  


  const aiWorkHistories = resumeData.work_histories || []
  const aiProjects = resumeData.projects || []
  
  const handleSelectOption = (text: string) => {
    setEditorText(prev => ({ ...prev, [activeTab]: text }))
  }

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorText(prev => ({ ...prev, [activeTab]: e.target.value }))
  }

  const handleSave = async () => {
    if (!editorText[activeTab] || editorText[activeTab].trim() === '') {
      import('sonner').then(m => m.toast.error('Editor cannot be empty'))
      return
    }

    let updatedContent = {}
    
    setResumeData((prev: any) => {
       const newData = { ...prev }
       if (activeTab === 'objective') {
         newData.career_objective = { ...newData.career_objective, final_edited_text: editorText[activeTab] }
       } else if (activeTab.startsWith('work_')) {
         const idx = parseInt(activeTab.split('_')[1])
         newData.work_histories[idx] = { ...newData.work_histories[idx], final_edited_text: editorText[activeTab] }
       } else if (activeTab.startsWith('proj_')) {
         const idx = parseInt(activeTab.split('_')[1])
         newData.projects[idx] = { ...newData.projects[idx], final_edited_text: editorText[activeTab] }
       }
       updatedContent = newData
       return newData
    })
    
    // Save directly to database
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ai_resumes')
        .update({ content: updatedContent })
        .eq('id', resume.id)
        
      if (error) throw error
      import('sonner').then(m => m.toast.success('Saved to Database!'))
    } catch (err: any) {
      import('sonner').then(m => m.toast.error('Failed to save to database'))
      console.error(err)
    }
  }
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  const toggleAccordion = (section: string) => {
    if (expandedSection === section) setExpandedSection(null)
    else setExpandedSection(section)
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      
      {/* COLUMN 1: NAVIGATION (20%) */}
      <div className="w-[20%] border-r bg-zinc-50 dark:bg-zinc-950/50 flex flex-col overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Resume Sections</h2>
        </div>
        
        <div className="p-2 space-y-1">
          {/* Static Tabs */}
          <button 
            onClick={() => handleTabClick('personal')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'personal' ? 'bg-white dark:bg-zinc-800 shadow-sm border' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'}`}
          >
            Personal Details
          </button>
          
          <button 
            onClick={() => handleTabClick('academic')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'academic' ? 'bg-white dark:bg-zinc-800 shadow-sm border' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'}`}
          >
            Academic Information
          </button>

          <button 
            onClick={() => handleTabClick('skills')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'skills' ? 'bg-white dark:bg-zinc-800 shadow-sm border' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'}`}
          >
            Skills
          </button>

          <button 
            onClick={() => handleTabClick('activities')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'activities' ? 'bg-white dark:bg-zinc-800 shadow-sm border' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'}`}
          >
            Activities
          </button>

          <button 
            onClick={() => handleTabClick('recognitions')}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'recognitions' ? 'bg-white dark:bg-zinc-800 shadow-sm border' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'}`}
          >
            Awards & Recognitions
          </button>

          {/* AI Accordion: Work History */}
          <div className="pt-2">
            <button 
              onClick={() => toggleAccordion('work')}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-500" />
                Work Histories
              </div>
              {expandedSection === 'work' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedSection === 'work' && (
              <div className="pl-6 pr-2 pt-1 pb-2 space-y-1 border-l-2 ml-4 mt-1 border-zinc-200 dark:border-zinc-800">
                {profileData.experience?.map((exp: any, i: number) => {
                  const tabId = `work_${i}`
                  return (
                    <button 
                      key={i}
                      onClick={() => handleTabClick(tabId)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${activeTab === tabId ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      <span className="truncate">{exp.company || 'Experience ' + (i+1)}</span>
                      {!!aiWorkHistories[i]?.final_edited_text && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* AI Accordion: Projects */}
          <div>
            <button 
              onClick={() => toggleAccordion('projects')}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-zinc-500" />
                Projects
              </div>
              {expandedSection === 'projects' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {expandedSection === 'projects' && (
              <div className="pl-6 pr-2 pt-1 pb-2 space-y-1 border-l-2 ml-4 mt-1 border-zinc-200 dark:border-zinc-800">
                {profileData.projects?.map((proj: any, i: number) => {
                  const tabId = `proj_${i}`
                  return (
                    <button 
                      key={i}
                      onClick={() => handleTabClick(tabId)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${activeTab === tabId ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      <span className="truncate">{proj.title || 'Project ' + (i+1)}</span>
                      {!!aiProjects[i]?.final_edited_text && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              // Since we don't have selected_option saving fully implemented yet,
              // we temporarily simulate the lock by strictly checking if they are not null.
              // Since they are null by default, this will visually lock the user out for now as requested.
              const isAllWorkSaved = aiWorkHistories.every((w: any) => !!w.final_edited_text)
              const isAllProjSaved = aiProjects.every((p: any) => !!p.final_edited_text)
              if (!isAllWorkSaved || !isAllProjSaved) {
                import('sonner').then(m => m.toast.error('Please save an AI option for all Work Histories and Projects first.'))
                return
              }
              handleTabClick('objective')
            }}
            className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${activeTab === 'objective' ? 'bg-white dark:bg-zinc-800 shadow-sm border' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'} ${(!aiWorkHistories.every((w: any) => !!w.final_edited_text) || !aiProjects.every((p: any) => !!p.final_edited_text)) ? 'opacity-50' : ''}`}
          >
            <span>Career Objective</span>
            {(!aiWorkHistories.every((w: any) => !!w.final_edited_text) || !aiProjects.every((p: any) => !!p.final_edited_text)) && <Lock className="w-3 h-3 opacity-50" />}
          </button>
        </div>
      </div>

      {(() => {
        let currentAiOptions: string[] = []
        let headerTitle = activeTab.replace('_', ' ')
        
        if (activeTab === 'objective') {
          currentAiOptions = resumeData.career_objective?.ai_options || []
          headerTitle = 'Career Objective'
        } else if (activeTab.startsWith('work_')) {
          const idx = parseInt(activeTab.split('_')[1])
          currentAiOptions = aiWorkHistories[idx]?.ai_options || []
          const w = profileData.experience?.[idx]
          headerTitle = w ? `${w.role} at ${w.company}` : `Work History ${idx + 1}`
        } else if (activeTab.startsWith('proj_')) {
          const idx = parseInt(activeTab.split('_')[1])
          currentAiOptions = aiProjects[idx]?.ai_options || []
          const p = profileData.projects?.[idx]
          headerTitle = p ? (p.title || `Project ${idx + 1}`) : `Project ${idx + 1}`
        }

        return (
          <>
            {/* COLUMN 2: EDITOR WORKSPACE (40%) */}
            <div className="w-[40%] border-r bg-white dark:bg-zinc-900 flex flex-col overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50 sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold capitalize">{headerTitle}</h2>
                  <p className="text-sm text-zinc-500">Edit and customize this section</p>
                </div>
                <div className="flex items-center gap-3">
                  {activeTab === 'objective' && (
                    <button 
                      onClick={handleGenerateObjective}
                      disabled={isGeneratingObjective}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-95 text-zinc-700 dark:text-zinc-200 rounded-md text-sm font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingObjective ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />} 
                      {isGeneratingObjective ? 'Generating...' : 'Generate using AI'}
                    </button>
                  )}
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md text-sm font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
        
        <div className="p-6">
          {/* Static Editor Placeholder */}
          {!activeTab.startsWith('work_') && !activeTab.startsWith('proj_') && activeTab !== 'objective' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-sm border border-blue-200 dark:border-blue-900/50 flex items-center gap-2">
                <span className="font-semibold">Synced Data:</span> This information is pulled directly from your DigiProfile and cannot be edited here.
              </div>

              {activeTab === 'personal' && (
                <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-950">
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Full Name</label>
                    <div className="mt-1 font-medium">{profileData.basic?.full_name || profileData.full_name || (profileData.first_name + ' ' + profileData.last_name)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Phone</label>
                    <div className="mt-1 font-medium">{profileData.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Email</label>
                    <div className="mt-1 font-medium">{profileData.email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">LinkedIn</label>
                    <div className="mt-1 font-medium text-blue-600">{profileData.links?.linkedin || 'N/A'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-950">
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Degree Type</label>
                    <div className="mt-1 font-medium">{profileData.type || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Graduation Year</label>
                    <div className="mt-1 font-medium">{profileData.year || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Department</label>
                    <div className="mt-1 font-medium">{profileData.department || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Current GPA</label>
                    <div className="mt-1 font-medium">{profileData.gpa || 'N/A'}</div>
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Core Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {(profileData.skills?.languages || '').split(',').map((s: string, i: number) => s.trim() && (
                        <span key={i} className="px-2 py-1 bg-white dark:bg-zinc-900 border rounded-md text-sm">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">Tools & Tech</label>
                    <div className="flex flex-wrap gap-2">
                      {(profileData.skills?.tools || '').split(',').map((s: string, i: number) => s.trim() && (
                        <span key={i} className="px-2 py-1 bg-white dark:bg-zinc-900 border rounded-md text-sm">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-3">
                  {(!profileData.activities || profileData.activities.length === 0) ? (
                    <div className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-500 italic text-sm">No activities listed in DigiProfile.</div>
                  ) : profileData.activities.map((act: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-950">
                      <div className="font-semibold text-lg">{act.org}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{act.role} | {act.start_date} - {act.end_date}</div>
                      <div className="text-sm">{act.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'recognitions' && (
                <div className="space-y-3">
                  {(!profileData.recognitions || profileData.recognitions.length === 0) ? (
                    <div className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-500 italic text-sm">No awards listed in DigiProfile.</div>
                  ) : profileData.recognitions.map((rec: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-950">
                      <div className="font-semibold text-lg">{rec.award}</div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{rec.issuer} | {rec.date}</div>
                      <div className="text-sm">{rec.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Editor Placeholder (3 Options) */}
          {(activeTab.startsWith('work_') || activeTab.startsWith('proj_') || activeTab === 'objective') && (
            <div className="space-y-6">
               <div className="pb-4">
                 <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                   <Edit3 className="w-4 h-4" /> Editor
                 </label>
                 <textarea 
                  className="w-full h-32 p-4 border rounded-md bg-white dark:bg-zinc-900 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Select a recommendation below to edit it here..."
                  value={editorText[activeTab] || ''}
                  onChange={handleEditorChange}
                 />
               </div>
               
               <div className="grid gap-2 pt-4 border-t">
                  {currentAiOptions.length > 0 ? currentAiOptions.map((optText, idx) => (
                                        <div 
                      key={idx} 
                      onClick={() => handleSelectOption(optText)}
                      className="p-3 border-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 cursor-pointer transition-all border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">AI Recommendation {idx + 1}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {optText}
                      </p>
                    </div>
                  )) : (
                    <div className="text-sm text-zinc-500 italic p-4 text-center">No AI options generated for this section yet.</div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>


      {/* COLUMN 3: LIVE PREVIEW (40%) */}
      <div className="w-[40%] bg-zinc-100 dark:bg-black flex flex-col">
        <div className="p-4 border-b bg-white dark:bg-zinc-900 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Live Preview</h2>
          <span className="text-xs text-zinc-400">Auto-updates</span>
        </div>
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          {/* A4 Paper Silhouette */}
          <div className="w-full max-w-[600px] h-[850px] bg-white shadow-xl border border-zinc-200 p-8 flex flex-col gap-6">
             {/* Header Skeleton */}
             <div className="text-center space-y-2 border-b-2 border-zinc-800 pb-4">
               <h1 className="text-2xl font-bold uppercase tracking-widest text-zinc-900">{profileData.basic?.full_name || 'JOHN DOE'}</h1>
               <p className="text-xs text-zinc-600">{profileData.basic?.email || 'email@example.com'} • {profileData.basic?.phone || '123-456-7890'} • {profileData.links?.linkedin || 'linkedin.com/in/johndoe'}</p>
             </div>
             
             {/* Content Skeleton */}
             <div className="space-y-4">
                <div className="h-4 bg-zinc-200 rounded w-1/4"></div>
                <div className="h-2 bg-zinc-100 rounded w-full"></div>
                <div className="h-2 bg-zinc-100 rounded w-5/6"></div>
                <div className="h-2 bg-zinc-100 rounded w-4/6"></div>
             </div>
             
             <div className="space-y-4 mt-4">
                <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                <div className="h-2 bg-zinc-100 rounded w-full"></div>
                <div className="h-2 bg-zinc-100 rounded w-full"></div>
                <div className="h-2 bg-zinc-100 rounded w-3/4"></div>
             </div>
          </div>
        </div>
      </div>
          </>
        )
      })()}
    </div>
  )
}

















