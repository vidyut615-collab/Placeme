'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Lock, Save, Edit3, Briefcase, FileCode, CheckCircle2 } from 'lucide-react'

export default function BuilderClient({ resume, profileData }: { resume: any, profileData: any }) {
  const [activeTab, setActiveTab] = useState<string>('personal')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Parse JSON state
  const content = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})
  const aiWorkHistories = content.work_histories || []
  const aiProjects = content.projects || []
  
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
                      {aiWorkHistories[i]?.selected_option && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
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
                      {aiProjects[i]?.selected_option && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Career Objective (Locked at bottom) */}
        <div className="mt-auto p-4 border-t bg-zinc-50 dark:bg-zinc-950">
           <button 
            onClick={() => handleTabClick('objective')}
            disabled={false} // TODO: Add logic to lock unless all Work/Projects are saved
            className={`w-full text-left px-3 py-3 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${activeTab === 'objective' ? 'bg-black text-white shadow-md' : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700'}`}
          >
            <span>Career Objective</span>
            <Lock className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>


      {/* COLUMN 2: EDITOR WORKSPACE (40%) */}
      <div className="w-[40%] border-r bg-white dark:bg-zinc-900 flex flex-col overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold capitalize">{activeTab.replace('_', ' ')}</h2>
            <p className="text-sm text-zinc-500">Edit and customize this section</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
        
        <div className="p-6">
          {/* Static Editor Placeholder */}
          {!activeTab.startsWith('work_') && !activeTab.startsWith('proj_') && activeTab !== 'objective' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500 text-sm border border-yellow-200 dark:border-yellow-900/50">
                This information is synced from your DigiProfile. You can tweak it here just for this resume.
              </div>
              <textarea 
                className="w-full h-64 p-4 border rounded-md bg-zinc-50 dark:bg-zinc-950 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                defaultValue={JSON.stringify(profileData, null, 2)}
              />
            </div>
          )}

          {/* AI Editor Placeholder (3 Options) */}
          {(activeTab.startsWith('work_') || activeTab.startsWith('proj_') || activeTab === 'objective') && (
            <div className="space-y-6">
               <div className="grid gap-4">
                  {[1, 2, 3].map((opt) => (
                    <div key={opt} className="p-4 border-2 border-transparent hover:border-blue-500 rounded-xl bg-zinc-50 dark:bg-zinc-950 cursor-pointer transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">AI Option {opt}</span>
                        <input type="radio" name="ai_selection" className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {/* Placeholder for AI Generated Text */}
                        Successfully led the implementation of cloud-native microservices architecture, reducing system latency by 45% and increasing overall platform scalability to support 100k+ concurrent users. Collaborated seamlessly across cross-functional teams to deliver critical infrastructure upgrades within the Q3 deadline.
                      </p>
                    </div>
                  ))}
               </div>
               
               <div className="pt-4 border-t">
                 <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                   <Edit3 className="w-4 h-4" /> Rich Text Editor
                 </label>
                 <textarea 
                  className="w-full h-48 p-4 border rounded-md bg-white dark:bg-zinc-900 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Select an option above to edit it here..."
                 />
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

    </div>
  )
}
