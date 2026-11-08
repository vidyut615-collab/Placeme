'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ProfileData, ResumeDataState, ResumeSettings, WorkHistoryItem, ProjectItem } from './templates/types'
import ResumeRenderer from './templates/ResumeRenderer'
import CustomizationToolbar from './CustomizationToolbar'
import { evaluateResumeQuality, executeOneClickFix, ATSIssue } from './ats-checker/engine'
import ATSCheckerPanel from './ats-checker/ATSCheckerPanel'
import ATSParserView from './ats-checker/ATSParserView'
import { 
  tailorSingleWorkHistoryAction, 
  tailorSingleProjectAction, 
  generateCareerObjectiveAction, 
  saveResumeContentAction 
} from '@/app/(dashboards)/student/ai-resume/actions'
import { 
  User, 
  Briefcase, 
  FileCode, 
  Target, 
  Palette, 
  Save, 
  Sparkles, 
  Loader2, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Edit3,
  Lock,
  AlertCircle,
  Code,
  ShieldCheck,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface BuilderClientProps {
  resume: any
  profileData: ProfileData
}

const DEFAULT_SETTINGS: ResumeSettings = {
  template: 'classic',
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  lineHeight: 1.4,
  margin: 14,
  accentColor: '#1e3a8a',
  pageFit: 'auto',
}

export default function BuilderClient({ resume, profileData }: BuilderClientProps) {
  // Parse initial content
  const parsedContent = typeof resume.content === 'string' ? JSON.parse(resume.content) : (resume.content || {})
  
  // Normalize initial resumeData state - saved resume data takes precedence!
  const [resumeData, setResumeData] = useState<ResumeDataState>(() => {
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

    return {
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
  })

  // Live Auto-Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  // Keep a mutable ref of the freshest state to prevent race conditions during rapid auto-saves
  const resumeDataRef = React.useRef(resumeData)
  useEffect(() => {
    resumeDataRef.current = resumeData
  }, [resumeData])

  // Navigation State: 'profile' | 'work_0' | 'proj_0' | 'objective' | 'settings'
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [expandedWork, setExpandedWork] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState(true)

  // Zoom scale state for live preview
  const [zoomScale, setZoomScale] = useState<number>(0.85)

  // Loading states
  const [isTailoring, setIsTailoring] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Local editor states for current active section
  const [editorText, setEditorText] = useState<string>('')
  const [techText, setTechText] = useState<string>('')
  const [selectedOptionTab, setSelectedOptionTab] = useState<number | null>(null)

  // Preview Mode: 'visual' (A4 canvas) | 'parser' (raw ATS parser terminal stream)
  const [previewMode, setPreviewMode] = useState<'visual' | 'parser'>('visual')

  // Check if all work histories and projects are saved
  const allWorkSaved = resumeData.work_histories.length === 0 || resumeData.work_histories.every(w => !!w.is_saved)
  const allProjectsSaved = resumeData.projects.length === 0 || resumeData.projects.every(p => !!p.is_saved)
  const allWorkAndProjectsSaved = allWorkSaved && allProjectsSaved

  // Career objective is unlocked if it was ALREADY generated OR if all work & projects are saved
  const isObjectiveUnlocked = resumeData.career_objective.is_generated || allWorkAndProjectsSaved

  // Resume is complete ONLY when all work & projects are saved AND career objective is generated and saved
  const isResumeComplete = allWorkAndProjectsSaved && resumeData.career_objective.is_generated && resumeData.career_objective.is_saved

  // Deterministic live ATS evaluation (0ms calculation, updates instantly)
  const atsResult = useMemo(() => {
    const jdText = resume.shortened_jd || resume.job_description || ''
    return evaluateResumeQuality(profileData, resumeData, jdText)
  }, [profileData, resumeData, resume.shortened_jd, resume.job_description])

  // Keep editorText and techText in sync when active tab changes
  useEffect(() => {
    setSelectedOptionTab(null)
    if (activeTab === 'objective') {
      const text = resumeData.career_objective.final_edited_text || ''
      setEditorText(text)
      setTechText('')
      const optIdx = resumeData.career_objective.ai_options.indexOf(text)
      if (optIdx !== -1) setSelectedOptionTab(optIdx)
    } else if (activeTab.startsWith('work_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      const work = resumeData.work_histories[idx]
      const text = work?.final_edited_text || work?.original_description || ''
      setEditorText(text)
      setTechText(work?.tech || '')
      const optIdx = work?.ai_options.indexOf(text)
      if (optIdx !== -1 && optIdx !== undefined) setSelectedOptionTab(optIdx)
    } else if (activeTab.startsWith('proj_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      const proj = resumeData.projects[idx]
      const text = proj?.final_edited_text || proj?.original_description || ''
      setEditorText(text)
      setTechText(proj?.tech || '')
      const optIdx = proj?.ai_options.indexOf(text)
      if (optIdx !== -1 && optIdx !== undefined) setSelectedOptionTab(optIdx)
    } else {
      setEditorText('')
      setTechText('')
    }
  }, [activeTab])

  // Real-time live preview synchronization when typing bullet text
  const handleEditorTextChange = (val: string) => {
    setEditorText(val)
    if (activeTab === 'objective') {
      setResumeData(prev => ({
        ...prev,
        career_objective: { ...prev.career_objective, final_edited_text: val }
      }))
    } else if (activeTab.startsWith('work_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData(prev => {
        const nextWork = [...prev.work_histories]
        if (nextWork[idx]) nextWork[idx] = { ...nextWork[idx], final_edited_text: val }
        return { ...prev, work_histories: nextWork }
      })
    } else if (activeTab.startsWith('proj_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData(prev => {
        const nextProjs = [...prev.projects]
        if (nextProjs[idx]) nextProjs[idx] = { ...nextProjs[idx], final_edited_text: val }
        return { ...prev, projects: nextProjs }
      })
    }
  }

  // Real-time live preview synchronization when typing technologies
  const handleTechChange = (val: string) => {
    setTechText(val)
    if (activeTab.startsWith('work_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData(prev => {
        const nextWork = [...prev.work_histories]
        if (nextWork[idx]) nextWork[idx] = { ...nextWork[idx], tech: val }
        return { ...prev, work_histories: nextWork }
      })
    } else if (activeTab.startsWith('proj_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData(prev => {
        const nextProjs = [...prev.projects]
        if (nextProjs[idx]) nextProjs[idx] = { ...nextProjs[idx], tech: val }
        return { ...prev, projects: nextProjs }
      })
    }
  }

  // Save current active tab text (Sets is_saved = true)
  const handleSaveActiveContent = async () => {
    setIsSaving(true)
    const updated = { ...resumeData }

    if (activeTab === 'objective') {
      updated.career_objective = {
        ...updated.career_objective,
        final_edited_text: editorText,
        is_saved: true
      }
    } else if (activeTab.startsWith('work_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      if (updated.work_histories[idx]) {
        updated.work_histories[idx] = {
          ...updated.work_histories[idx],
          final_edited_text: editorText,
          tech: techText,
          is_saved: true
        }
      }
    } else if (activeTab.startsWith('proj_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      if (updated.projects[idx]) {
        updated.projects[idx] = {
          ...updated.projects[idx],
          final_edited_text: editorText,
          tech: techText,
          is_saved: true
        }
      }
    }

    setResumeData(updated)
    resumeDataRef.current = updated
    setSaveStatus('saving')
    const res = await saveResumeContentAction(resume.id, updated)
    setIsSaving(false)

    if (res.success) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
      toast.success('Changes saved to resume!')
    } else {
      setSaveStatus('idle')
      toast.error(res.error || 'Failed to save changes')
    }
  }

  // Update Settings with instant auto-save and visual indicator
  const handleSettingsChange = async (newSettings: Partial<ResumeSettings>) => {
    const current = resumeDataRef.current
    const updated: ResumeDataState = {
      ...current,
      settings: { ...current.settings, ...newSettings }
    }
    resumeDataRef.current = updated
    setResumeData(updated)

    setSaveStatus('saving')
    const res = await saveResumeContentAction(resume.id, updated)
    if (res.success) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
    } else {
      setSaveStatus('idle')
      toast.error(res.error || 'Failed to save styling changes')
    }
  }

  // Handle 1-Click ATS Auto-Fix Action with instant auto-save
  const handleApplyFix = async (fixActionType: ATSIssue['fixActionType']) => {
    if (!fixActionType) return
    setIsSaving(true)
    setSaveStatus('saving')

    const current = resumeDataRef.current
    const { updatedResume } = executeOneClickFix(current, profileData, fixActionType)
    resumeDataRef.current = updatedResume
    setResumeData(updatedResume)

    // Sync editorText if currently viewing an affected work or project tab
    if (activeTab.startsWith('work_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      if (updatedResume.work_histories[idx]) {
        setEditorText(updatedResume.work_histories[idx].final_edited_text)
      }
    } else if (activeTab.startsWith('proj_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      if (updatedResume.projects[idx]) {
        setEditorText(updatedResume.projects[idx].final_edited_text)
      }
    }

    const res = await saveResumeContentAction(resume.id, updatedResume)
    setIsSaving(false)

    if (res.success) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
      toast.success('Applied ATS fix and saved to resume!')
    } else {
      setSaveStatus('idle')
      toast.error(res.error || 'Failed to apply ATS fix')
    }
  }

  // Tailor single work experience (1-time only)
  const handleTailorWorkHistory = async (idx: number) => {
    setIsTailoring(true)
    try {
      const res = await tailorSingleWorkHistoryAction(resume.id, idx)
      if (!res.success) throw new Error(res.error)

      setResumeData(prev => {
        const nextWork = [...prev.work_histories]
        nextWork[idx] = {
          ...nextWork[idx],
          is_tailored: true,
          ai_options: res.options || [],
          final_edited_text: res.options?.[0] || nextWork[idx].final_edited_text
        }
        return { ...prev, work_histories: nextWork }
      })

      if (res.options?.[0]) {
        setEditorText(res.options[0])
        setSelectedOptionTab(0)
      }
      toast.success('Work experience tailored with AI!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to tailor work experience')
    } finally {
      setIsTailoring(false)
    }
  }

  // Tailor single project (1-time only)
  const handleTailorProject = async (idx: number) => {
    setIsTailoring(true)
    try {
      const res = await tailorSingleProjectAction(resume.id, idx)
      if (!res.success) throw new Error(res.error)

      setResumeData(prev => {
        const nextProj = [...prev.projects]
        nextProj[idx] = {
          ...nextProj[idx],
          is_tailored: true,
          ai_options: res.options || [],
          final_edited_text: res.options?.[0] || nextProj[idx].final_edited_text
        }
        return { ...prev, projects: nextProj }
      })

      if (res.options?.[0]) {
        setEditorText(res.options[0])
        setSelectedOptionTab(0)
      }
      toast.success('Project tailored with AI!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to tailor project')
    } finally {
      setIsTailoring(false)
    }
  }

  // Generate Career Objective (1-time only)
  const handleGenerateObjective = async () => {
    if (!allWorkAndProjectsSaved) {
      toast.error('Please save all work histories and projects before generating Career Objective.')
      return
    }

    setIsTailoring(true)
    try {
      const res = await generateCareerObjectiveAction(resume.id)
      if (!res.success) throw new Error(res.error)

      setResumeData(prev => ({
        ...prev,
        career_objective: {
          is_generated: true,
          is_saved: false,
          ai_options: res.options || [],
          final_edited_text: res.options?.[0] || ''
        }
      }))

      if (res.options?.[0]) {
        setEditorText(res.options[0])
        setSelectedOptionTab(0)
      }
      toast.success('Career Objective generated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate objective')
    } finally {
      setIsTailoring(false)
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  // 1-Click Vector PDF Download via @react-pdf/renderer API Route
  const handleDownloadPDF = async () => {
    setIsExporting(true)
    try {
      // 1. Auto-save current state first so the PDF contains latest edits
      await saveResumeContentAction(resume.id, resumeDataRef.current)

      // 2. Fetch the generated vector PDF from server
      const res = await fetch(`/api/resume/${resume.id}/download`)
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to generate PDF')
      }

      // 3. Trigger immediate binary file download in browser
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      const safeTitle = (resume.title || 'Resume')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
      a.download = `${safeTitle}.pdf`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Resume downloaded successfully!')
    } catch (err: any) {
      console.error('Download error:', err)
      toast.error(err.message || 'Failed to download PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      
      {/* HEADER BAR (No-print) */}
      <header className="h-14 border-b bg-white dark:bg-zinc-900 flex items-center justify-between px-6 shrink-0 shadow-sm z-20 no-print">
        <div className="flex items-center space-x-4">
          <Link 
            href="/student/ai-resume" 
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            &larr; Resumes
          </Link>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <h1 className="font-bold text-base truncate max-w-[280px]">
            {resume.title || 'Untitled Resume'}
          </h1>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full font-semibold border border-blue-200 dark:border-blue-800">
            {resume.target_role || 'Target Role'} · {resume.target_employer || 'Company'}
          </span>

          {/* Live Auto-Save Indicator */}
          <div className="flex items-center gap-1.5 pl-1">
            {saveStatus === 'saving' || isSaving ? (
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3 h-3" />
                <span>Saved</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Zoom controls */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button 
              onClick={() => setZoomScale(s => Math.max(0.6, s - 0.05))}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono px-2 font-medium">
              {Math.round(zoomScale * 100)}%
            </span>
            <button 
              onClick={() => setZoomScale(s => Math.min(1.2, s + 0.05))}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download PDF button (1-click direct download) */}
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </header>

      {/* 3-COLUMN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUMN 1: NAVIGATION & TOOLKIT (22%) */}
        <aside className="w-[22%] border-r bg-white dark:bg-zinc-900/50 flex flex-col justify-between overflow-hidden no-print">
          
          {/* TOP SECTION: RESUME CONTENT */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 border-b bg-zinc-50/50 dark:bg-zinc-950/20">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Resume Sections
              </h2>
            </div>

            <div className="p-3 space-y-1">
              {/* Consolidated Profile Information Tab */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm' 
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Profile Information</span>
                </div>
                <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 font-medium">
                  Synced
                </span>
              </button>

              {/* Work Histories Accordion */}
              <div className="pt-2">
                <button
                  onClick={() => setExpandedWork(e => !e)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Work Histories ({resumeData.work_histories.length})</span>
                  </div>
                  {expandedWork ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {expandedWork && (
                  <div className="space-y-1 pl-2 pt-1">
                    {resumeData.work_histories.map((work, idx) => {
                      const tabId = `work_${idx}`
                      const isSelected = activeTab === tabId
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveTab(tabId)}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          <span className="truncate pr-2">{work.role || work.company || `Role ${idx + 1}`}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {work.is_tailored && (
                              <span className="text-[9px] text-purple-600 bg-purple-50 dark:bg-purple-950 px-1 rounded font-bold">
                                AI
                              </span>
                            )}
                            {work.is_saved ? (
                              <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-950 px-1.5 py-0.2 rounded border border-green-200 dark:border-green-800 font-medium flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Saved
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-normal">
                                Unsaved
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Projects Accordion */}
              <div className="pt-2">
                <button
                  onClick={() => setExpandedProjects(e => !e)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Projects ({resumeData.projects.length})</span>
                  </div>
                  {expandedProjects ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {expandedProjects && (
                  <div className="space-y-1 pl-2 pt-1">
                    {resumeData.projects.map((proj, idx) => {
                      const tabId = `proj_${idx}`
                      const isSelected = activeTab === tabId
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveTab(tabId)}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          <span className="truncate pr-2">{proj.title || `Project ${idx + 1}`}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {proj.is_tailored && (
                              <span className="text-[9px] text-purple-600 bg-purple-50 dark:bg-purple-950 px-1 rounded font-bold">
                                AI
                              </span>
                            )}
                            {proj.is_saved ? (
                              <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-950 px-1.5 py-0.2 rounded border border-green-200 dark:border-green-800 font-medium flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Saved
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-normal">
                                Unsaved
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Career Objective */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (!isObjectiveUnlocked) {
                      toast.error('Please save all work histories and projects first before unlocking Career Objective.')
                      return
                    }
                    setActiveTab('objective')
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                    activeTab === 'objective'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-sm'
                      : isObjectiveUnlocked
                        ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        : 'opacity-50 hover:bg-zinc-50 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Target className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>Career Objective</span>
                  </div>
                  {resumeData.career_objective.is_generated ? (
                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 font-medium">
                      Generated
                    </span>
                  ) : isObjectiveUnlocked ? (
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                      Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 font-normal flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: APP FEATURES (PROPERLY DIFFERENTIATED) */}
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 p-3 space-y-2">
            <div className="flex items-center justify-between px-1 pt-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Optimize & Style
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-900/40">
                App Features
              </span>
            </div>

            {/* Feature 1: Live ATS Score & Improvement Suggestion */}
            <button
              onClick={() => {
                if (!isResumeComplete) {
                  toast.error('Save all Work Histories, Projects, and Career Objective to unlock ATS Review.')
                  return
                }
                setActiveTab('ats_review')
              }}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                activeTab === 'ats_review'
                  ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-500/20'
                  : isResumeComplete
                    ? 'bg-white dark:bg-zinc-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xs'
                    : 'bg-zinc-100/60 dark:bg-zinc-900/40 opacity-70 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  activeTab === 'ats_review'
                    ? 'bg-emerald-600 text-white'
                    : isResumeComplete
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold block truncate leading-tight">ATS Review & Score</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">Live score & auto-fixes</span>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isResumeComplete ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${
                    atsResult.score >= 85
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : atsResult.score >= 60
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {atsResult.score}/100
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
            </button>

            {/* Feature 2: Edit Style & Typography */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                activeTab === 'settings'
                  ? 'bg-purple-50 text-purple-950 dark:bg-purple-950/40 dark:text-purple-100 border-purple-300 dark:border-purple-700 shadow-sm ring-1 ring-purple-500/20'
                  : 'bg-white dark:bg-zinc-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${
                  activeTab === 'settings'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  <Palette className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold block truncate leading-tight">Template & PDF Style</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">Typography & Margins</span>
                </div>
              </div>

              <span className="shrink-0 ml-2 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-200 dark:border-purple-800">
                {resumeData.settings.template.toUpperCase()}
              </span>
            </button>
          </div>

        </aside>

        {/* COLUMN 2: WORKSPACE & EDITOR (38%) */}
        <main className="w-[38%] border-r bg-white dark:bg-zinc-900 flex flex-col overflow-y-auto no-print">
          
          {/* VIEW: CONSOLIDATED PROFILE INFORMATION */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold">Profile Information</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Static information pulled directly from your student profile</p>
              </div>

              {/* Guidance Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> DigiProfile Synced
                  </span>
                  <Link 
                    href="/student/profile" 
                    target="_blank" 
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    Edit Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  These details (contact, GPA, skills, extracurriculars, awards) are stored in your DigiProfile. If you want to change or add anything, update your profile — changes will automatically reflect across all your past and new resumes.
                </p>
              </div>

              {/* Personal Details Card */}
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Personal & Contact</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Name:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {profileData.basic?.full_name || profileData.full_name || [profileData.first_name, profileData.last_name].filter(Boolean).join(' ') || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Email:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{profileData.basic?.email || profileData.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Phone:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{profileData.basic?.phone || profileData.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">LinkedIn:</span>
                    <span className="font-semibold text-blue-600 truncate block">{profileData.links?.linkedin || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Academic Details Card */}
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Academic Background</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Degree:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{profileData.type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Department:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{profileData.department || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Graduation Year:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{profileData.year || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">GPA / Percentage:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{profileData.gpa || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Skills Card */}
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Skills</h3>
                <div className="space-y-2 text-xs">
                  {profileData.skills?.languages && (
                    <div>
                      <span className="text-zinc-500 block mb-1">Languages:</span>
                      <div className="flex flex-wrap gap-1">
                        {profileData.skills.languages.split(',').map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white dark:bg-zinc-800 border rounded text-[11px] font-medium">{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profileData.skills?.frameworks && (
                    <div>
                      <span className="text-zinc-500 block mb-1">Frameworks:</span>
                      <div className="flex flex-wrap gap-1">
                        {profileData.skills.frameworks.split(',').map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white dark:bg-zinc-800 border rounded text-[11px] font-medium">{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profileData.skills?.tools && (
                    <div>
                      <span className="text-zinc-500 block mb-1">Tools & Platforms:</span>
                      <div className="flex flex-wrap gap-1">
                        {profileData.skills.tools.split(',').map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white dark:bg-zinc-800 border rounded text-[11px] font-medium">{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activities & Awards */}
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3 bg-zinc-50/50 dark:bg-zinc-950/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Activities & Honors</h3>
                <div className="space-y-2 text-xs">
                  {(profileData.activities || []).map((act, i) => (
                    <div key={i} className="border-b border-zinc-200 dark:border-zinc-800 pb-1.5 last:border-none">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{act.org} — {act.role}</span>
                      {act.description && <p className="text-zinc-500 text-[11px] mt-0.5">{act.description}</p>}
                    </div>
                  ))}
                  {(profileData.recognitions || []).map((rec, i) => (
                    <div key={i} className="border-b border-zinc-200 dark:border-zinc-800 pb-1.5 last:border-none">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rec.award}</span>
                      {rec.issuer && <span className="text-zinc-500 ml-1">({rec.issuer})</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: WORK HISTORY EDITING */}
          {activeTab.startsWith('work_') && (() => {
            const idx = parseInt(activeTab.split('_')[1], 10)
            const work = resumeData.work_histories[idx]
            if (!work) return null

            return (
              <div className="p-6 space-y-5">
                {/* SECTION HEADER (No duplicate Save button here!) */}
                <div className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{work.role || 'Work Experience'}</h2>
                    {work.is_saved ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{work.company} · {work.start_date} – {work.end_date || 'Present'}</p>
                </div>

                {/* ORIGINAL PROFILE DETAILS */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] block">
                    Original Profile Details
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {work.original_description || 'No original description provided in profile.'}
                  </p>
                </div>

                {/* EDITABLE TECHNOLOGIES USED */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-zinc-500" /> Technologies Used (Optional)
                  </label>
                  <input
                    type="text"
                    value={techText}
                    onChange={(e) => handleTechChange(e.target.value)}
                    placeholder="e.g. Python, GCP, Docker (leave empty to hide from resume)"
                    className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <p className="text-[10px] text-zinc-400">Updates live on preview. Leave blank if you don't want tech listed for this role.</p>
                </div>

                {/* AI GENERATE / RECOMMENDATION BAR */}
                {!work.is_tailored ? (
                  <div className="flex items-center justify-between p-3.5 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Tailor this Experience with AI
                      </div>
                      <div className="text-[11px] text-purple-600 dark:text-purple-400">
                        Generates 3 ATS bullet variations for this job (1-time only)
                      </div>
                    </div>
                    <button
                      onClick={() => handleTailorWorkHistory(idx)}
                      disabled={isTailoring}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {isTailoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isTailoring ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Recommendations
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">Click tab to load into Editor</span>
                    </div>

                    {/* 3 TABS (Grey styled boxes as drawn in user image) */}
                    <div className="grid grid-cols-3 gap-2">
                      {work.ai_options.map((opt, oIdx) => {
                        const isSelected = selectedOptionTab === oIdx
                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              setSelectedOptionTab(oIdx)
                              handleEditorTextChange(opt)
                            }}
                            className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <span>Option {oIdx + 1}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* EDITOR SECTION */}
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Editor
                    </label>
                  </div>
                  <textarea
                    rows={8}
                    value={editorText}
                    onChange={(e) => handleEditorTextChange(e.target.value)}
                    placeholder="Enter or edit bullet points for this experience (use - for bullets)..."
                    className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 font-mono shadow-inner"
                  />
                  {/* SINGLE SAVE BUTTON IN COLUMN */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveActiveContent}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save to Resume
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* VIEW: PROJECT EDITING */}
          {activeTab.startsWith('proj_') && (() => {
            const idx = parseInt(activeTab.split('_')[1], 10)
            const proj = resumeData.projects[idx]
            if (!proj) return null

            return (
              <div className="p-6 space-y-5">
                {/* SECTION HEADER (No duplicate Save button here!) */}
                <div className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{proj.title || 'Project'}</h2>
                    {proj.is_saved ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                </div>

                {/* ORIGINAL PROFILE DETAILS */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] block">
                    Original Project Details
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {proj.original_description || 'No original description provided in profile.'}
                  </p>
                </div>

                {/* EDITABLE TECHNOLOGIES USED */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-zinc-500" /> Technologies Used (Optional)
                  </label>
                  <input
                    type="text"
                    value={techText}
                    onChange={(e) => handleTechChange(e.target.value)}
                    placeholder="e.g. Next.js, React, Supabase (leave empty to hide from resume)"
                    className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <p className="text-[10px] text-zinc-400">Updates live on preview. Clear this field if you don't want skills/technologies listed for this project.</p>
                </div>

                {/* AI GENERATE / RECOMMENDATION BAR */}
                {!proj.is_tailored ? (
                  <div className="flex items-center justify-between p-3.5 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Tailor this Project with AI
                      </div>
                      <div className="text-[11px] text-purple-600 dark:text-purple-400">
                        Generates 3 ATS bullet variations for this job (1-time only)
                      </div>
                    </div>
                    <button
                      onClick={() => handleTailorProject(idx)}
                      disabled={isTailoring}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {isTailoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isTailoring ? 'Generating...' : 'Generate with AI'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Recommendations
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">Click tab to load into Editor</span>
                    </div>

                    {/* 3 TABS (Grey styled boxes as drawn in user image) */}
                    <div className="grid grid-cols-3 gap-2">
                      {proj.ai_options.map((opt, oIdx) => {
                        const isSelected = selectedOptionTab === oIdx
                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              setSelectedOptionTab(oIdx)
                              handleEditorTextChange(opt)
                            }}
                            className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <span>Option {oIdx + 1}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* EDITOR SECTION */}
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Editor
                    </label>
                  </div>
                  <textarea
                    rows={8}
                    value={editorText}
                    onChange={(e) => handleEditorTextChange(e.target.value)}
                    placeholder="Enter or edit project bullet points (use - for bullets)..."
                    className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 font-mono shadow-inner"
                  />
                  {/* SINGLE SAVE BUTTON IN COLUMN */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveActiveContent}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save to Resume
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* VIEW: CAREER OBJECTIVE */}
          {activeTab === 'objective' && (
            <div className="p-6 space-y-5">
              {/* SECTION HEADER */}
              <div className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Career Objective</h2>
                  {resumeData.career_objective.is_saved ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </span>
                  ) : resumeData.career_objective.is_generated ? (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
                      Unsaved Changes
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Concise summary tailored to {resume.target_role || 'Target Role'}</p>
              </div>

              {!resumeData.career_objective.is_generated ? (
                <div>
                  {!allWorkAndProjectsSaved ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Action Required Before Generating</span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Please review and click <strong>"Save to Resume"</strong> on all your Work Histories and Projects first. The AI Career Objective synthesizes your saved work entries to craft a tailored summary.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Generate Career Objective
                        </div>
                        <div className="text-[11px] text-purple-600 dark:text-purple-400">
                          Synthesizes your saved experiences & skills (1-time only)
                        </div>
                      </div>
                      <button
                        onClick={handleGenerateObjective}
                        disabled={isTailoring}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                      >
                        {isTailoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {isTailoring ? 'Generating...' : 'Generate with AI'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Recommendations
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Click tab to load into Editor</span>
                  </div>

                  {/* 3 TABS (Grey styled boxes as drawn in user image) */}
                  <div className="grid grid-cols-3 gap-2">
                    {resumeData.career_objective.ai_options.map((opt, oIdx) => {
                      const isSelected = selectedOptionTab === oIdx
                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setSelectedOptionTab(oIdx)
                            handleEditorTextChange(opt)
                          }}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span>Option {oIdx + 1}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* EDITOR SECTION */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> Editor
                  </label>
                </div>
                <textarea
                  rows={6}
                  value={editorText}
                  onChange={(e) => handleEditorTextChange(e.target.value)}
                  placeholder="Career objective statement..."
                  className="w-full p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
                {/* SINGLE SAVE BUTTON IN COLUMN */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveActiveContent}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save to Resume
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS & PDF TOOLKIT */}
          {activeTab === 'settings' && (
            <div>
              <div className="p-6 pb-2 border-b">
                <h2 className="text-lg font-bold">Template & PDF Styling</h2>
                <p className="text-xs text-zinc-500">Fine-tune fonts, layouts, margins, and page fit</p>
              </div>
              <CustomizationToolbar 
                settings={resumeData.settings} 
                onChange={handleSettingsChange} 
              />
            </div>
          )}

          {/* VIEW: ATS REVIEW & 1-CLICK IMPROVE */}
          {activeTab === 'ats_review' && (
            <div>
              <div className="p-6 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">ATS Review & Improve</h2>
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800">
                    Live Quality Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Automated screening audit with 1-click auto-fixes</p>
              </div>
              <ATSCheckerPanel 
                checkResult={atsResult} 
                onApplyFix={handleApplyFix} 
              />
            </div>
          )}

        </main>

        {/* COLUMN 3: LIVE PREVIEW & ATS STREAM (40%) */}
        <section className="w-[40%] bg-zinc-200/80 dark:bg-black/60 flex flex-col overflow-hidden relative">
          {/* Top preview sub-header with View Mode Toggle */}
          <div className="px-4 py-2.5 border-b bg-white dark:bg-zinc-900 flex items-center justify-between shadow-sm z-10 no-print">
            {/* Person vs Parser View Switcher */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setPreviewMode('visual')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  previewMode === 'visual'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>What a person sees</span>
              </button>
              <button
                onClick={() => setPreviewMode('parser')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  previewMode === 'parser'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>{`{ } What a parser reads`}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                Page 1 · A4
              </span>
            </div>
          </div>

          {/* Canvas Scroll Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 flex justify-center items-start">
            {previewMode === 'visual' ? (
              <ResumeRenderer 
                profile={profileData} 
                resumeData={resumeData} 
                settings={resumeData.settings} 
                scale={zoomScale} 
              />
            ) : (
              <ATSParserView rawText={atsResult.rawParserText} />
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
