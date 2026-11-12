'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Loader2,
  Lock,
  Palette,
  Save,
  ShieldCheck,
  Target,
  User,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ProfileData,
  ResumeDataState,
  ResumeSettings,
  WorkHistoryItem,
  ProjectItem,
} from './templates/types'
import ResumeRenderer from './templates/ResumeRenderer'
import CustomizationToolbar from './CustomizationToolbar'
import { evaluateResumeQuality, executeOneClickFix, ATSIssue } from './ats-checker/engine'
import ATSCheckerPanel, { DeepAIMatchResult } from './ats-checker/ATSCheckerPanel'
import ATSParserView from './ats-checker/ATSParserView'
import {
  tailorSingleWorkHistoryAction,
  tailorSingleProjectAction,
  generateCareerObjectiveAction,
  saveResumeContentAction,
  checkATSMatchAction,
} from '@/app/(dashboards)/student/ai-resume/actions'

interface ResumeRecord {
  id: string
  title: string | null
  target_employer: string | null
  target_role: string | null
  job_description: string | null
  shortened_jd: string | null
  content: unknown
}

interface BuilderClientProps {
  resume: ResumeRecord
  profileData: ProfileData
}

const DEFAULT_SETTINGS: ResumeSettings = {
  template: 'classic',
  fontFamily: 'Inter, sans-serif',
  fontSize: 10,
  lineHeight: 1.4,
  margin: 14,
  accentColor: '#0F766E',
  pageFit: 'auto',
}

function cleanObjectiveText(rawText: string): string {
  if (!rawText) return ''
  if (rawText.includes('\n') && (rawText.includes('- ') || rawText.includes('• '))) {
    return rawText
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
      .join(' ')
  }
  return rawText
}

function getFieldsForTab(tab: string, data: ResumeDataState) {
  if (tab === 'objective') {
    const rawText = data.career_objective.final_edited_text || ''
    const optIdx = data.career_objective.ai_options.indexOf(rawText)
    return {
      editorText: cleanObjectiveText(rawText),
      techText: '',
      selectedOptionTab: optIdx !== -1 ? optIdx : null,
    }
  }
  if (tab.startsWith('work_')) {
    const idx = parseInt(tab.split('_')[1], 10)
    const work = data.work_histories[idx]
    const text = work?.final_edited_text || work?.original_description || ''
    const optIdx = work?.ai_options.indexOf(text)
    return {
      editorText: text,
      techText: work?.tech || '',
      selectedOptionTab: optIdx !== undefined && optIdx !== -1 ? optIdx : null,
    }
  }
  if (tab.startsWith('proj_')) {
    const idx = parseInt(tab.split('_')[1], 10)
    const proj = data.projects[idx]
    const text = proj?.final_edited_text || proj?.original_description || ''
    const optIdx = proj?.ai_options.indexOf(text)
    return {
      editorText: text,
      techText: proj?.tech || '',
      selectedOptionTab: optIdx !== undefined && optIdx !== -1 ? optIdx : null,
    }
  }
  return { editorText: '', techText: '', selectedOptionTab: null }
}

export default function BuilderClient({ resume, profileData }: BuilderClientProps) {
  const parsedContent = useMemo(() => {
    try {
      return typeof resume.content === 'string'
        ? JSON.parse(resume.content)
        : resume.content || {}
    } catch {
      return {}
    }
  }, [resume.content])

  const [resumeData, setResumeData] = useState<ResumeDataState>(() => {
    const existingWork = Array.isArray(parsedContent.work_histories)
      ? parsedContent.work_histories
      : []
    const profileExperience = profileData.experience || []
    const sourceWork = existingWork.length > 0 ? existingWork : profileExperience

    const mergedWork: WorkHistoryItem[] = sourceWork.map((_: unknown, i: number) => {
      const match = existingWork[i] || {}
      const exp = profileExperience[i] || {}
      return {
        profile_work_id: match.profile_work_id || `work_${i}`,
        role: match.role !== undefined && match.role !== '' ? match.role : exp.role || '',
        company:
          match.company !== undefined && match.company !== ''
            ? match.company
            : exp.company || '',
        start_date:
          match.start_date !== undefined && match.start_date !== ''
            ? match.start_date
            : exp.start_date || '',
        end_date:
          match.end_date !== undefined && match.end_date !== ''
            ? match.end_date
            : exp.end_date || '',
        tech: match.tech !== undefined ? match.tech : exp.tech || '',
        original_description: match.original_description || exp.description || '',
        is_tailored: !!match.is_tailored,
        is_saved: !!match.is_saved,
        ai_options: match.ai_options || [],
        final_edited_text:
          match.final_edited_text !== undefined ? match.final_edited_text : exp.description || '',
      }
    })

    const existingProjects = Array.isArray(parsedContent.projects) ? parsedContent.projects : []
    const profileProjects = profileData.projects || []
    const sourceProjects = existingProjects.length > 0 ? existingProjects : profileProjects

    const mergedProjects: ProjectItem[] = sourceProjects.map((_: unknown, i: number) => {
      const match = existingProjects[i] || {}
      const proj = profileProjects[i] || {}
      return {
        profile_project_id: match.profile_project_id || `proj_${i}`,
        title: match.title !== undefined && match.title !== '' ? match.title : proj.title || '',
        tech: match.tech !== undefined ? match.tech : proj.tech || '',
        original_description: match.original_description || proj.description || '',
        is_tailored: !!match.is_tailored,
        is_saved: !!match.is_saved,
        ai_options: match.ai_options || [],
        final_edited_text:
          match.final_edited_text !== undefined
            ? match.final_edited_text
            : proj.description || '',
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
        final_edited_text: parsedContent.career_objective?.final_edited_text || '',
      },
      profile_overrides: parsedContent.profile_overrides || {},
    }
  })

  const [aiMatchData, setAiMatchData] = useState<DeepAIMatchResult | null>(
    () => (parsedContent.ats_score as DeepAIMatchResult | undefined) || null
  )
  const aiMatchRef = useRef<DeepAIMatchResult | null>(aiMatchData)

  const [saveStatus, setSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved'>('idle')
  const resumeDataRef = useRef(resumeData)
  useEffect(() => {
    resumeDataRef.current = resumeData
  }, [resumeData])

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef<boolean>(false)
  const hasPendingSaveRef = useRef<boolean>(false)
  const saveVersionRef = useRef<number>(0)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (debounceTimerRef.current || hasPendingSaveRef.current) {
        const payload = {
          ...resumeDataRef.current,
          ...(aiMatchRef.current ? { ats_score: aiMatchRef.current } : {}),
        }
        saveResumeContentAction(resume.id, payload)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [resume.id])

  const [activeTab, setActiveTab] = useState<string>('profile')
  const [mobilePane, setMobilePane] = useState<'sections' | 'editor' | 'preview'>('editor')
  const [expandedWork, setExpandedWork] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState(true)
  const [showJdDrawer, setShowJdDrawer] = useState(false)
  const [showFullJd, setShowFullJd] = useState(false)

  const [zoomScale, setZoomScale] = useState<number>(0.85)
  const [isTailoring, setIsTailoring] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isRunningAIMatch, setIsRunningAIMatch] = useState(false)

  const [editorText, setEditorText] = useState<string>('')
  const [techText, setTechText] = useState<string>('')
  const [selectedOptionTab, setSelectedOptionTab] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState<'visual' | 'parser'>('visual')

  const selectTab = (nextTab: string, stateSnapshot?: ResumeDataState) => {
    const fields = getFieldsForTab(nextTab, stateSnapshot || resumeDataRef.current)
    setActiveTab(nextTab)
    setEditorText(fields.editorText)
    setTechText(fields.techText)
    setSelectedOptionTab(fields.selectedOptionTab)
    setMobilePane('editor')
  }

  const allWorkSaved =
    resumeData.work_histories.length === 0 || resumeData.work_histories.every((w) => !!w.is_saved)
  const allProjectsSaved =
    resumeData.projects.length === 0 || resumeData.projects.every((p) => !!p.is_saved)
  const allWorkAndProjectsSaved = allWorkSaved && allProjectsSaved

  const isObjectiveUnlocked = resumeData.career_objective.is_generated || allWorkAndProjectsSaved
  const isResumeComplete =
    allWorkAndProjectsSaved &&
    resumeData.career_objective.is_generated &&
    resumeData.career_objective.is_saved

  const totalSections = resumeData.work_histories.length + resumeData.projects.length + 1
  const savedSectionsCount =
    resumeData.work_histories.filter((w) => !!w.is_saved).length +
    resumeData.projects.filter((p) => !!p.is_saved).length +
    (resumeData.career_objective.is_generated && resumeData.career_objective.is_saved ? 1 : 0)

  const atsResult = useMemo(() => {
    const jdText = resume.shortened_jd || resume.job_description || ''
    return evaluateResumeQuality(profileData, resumeData, jdText)
  }, [profileData, resumeData, resume.shortened_jd, resume.job_description])

  const getNextTabAfterSave = (currentTab: string, updated: ResumeDataState): string | null => {
    const orderedSectionTabs = [
      ...updated.work_histories.map((_, i) => `work_${i}`),
      ...updated.projects.map((_, i) => `proj_${i}`),
    ]
    const currentPos = orderedSectionTabs.indexOf(currentTab)

    if (currentTab.startsWith('work_') || currentTab.startsWith('proj_')) {
      for (let i = currentPos + 1; i < orderedSectionTabs.length; i++) {
        const candidate = orderedSectionTabs[i]
        const isSaved = candidate.startsWith('work_')
          ? updated.work_histories[parseInt(candidate.split('_')[1], 10)]?.is_saved
          : updated.projects[parseInt(candidate.split('_')[1], 10)]?.is_saved
        if (!isSaved) return candidate
      }
      const anyUnsaved = orderedSectionTabs.find((candidate) => {
        if (candidate === currentTab) return false
        return candidate.startsWith('work_')
          ? !updated.work_histories[parseInt(candidate.split('_')[1], 10)]?.is_saved
          : !updated.projects[parseInt(candidate.split('_')[1], 10)]?.is_saved
      })
      if (anyUnsaved) return anyUnsaved
      return 'objective'
    }

    if (currentTab === 'objective') {
      const workAndProjDone =
        updated.work_histories.every((w) => !!w.is_saved) &&
        updated.projects.every((p) => !!p.is_saved)
      if (workAndProjDone && updated.career_objective.is_generated && updated.career_objective.is_saved) {
        return 'ats_review'
      }
    }

    return null
  }

  const handleEditorTextChange = (val: string) => {
    setEditorText(val)
    if (activeTab === 'objective') {
      setResumeData((prev) => ({
        ...prev,
        career_objective: { ...prev.career_objective, final_edited_text: val },
      }))
    } else if (activeTab.startsWith('work_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData((prev) => {
        const nextWork = [...prev.work_histories]
        if (nextWork[idx]) nextWork[idx] = { ...nextWork[idx], final_edited_text: val }
        return { ...prev, work_histories: nextWork }
      })
    } else if (activeTab.startsWith('proj_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData((prev) => {
        const nextProjs = [...prev.projects]
        if (nextProjs[idx]) nextProjs[idx] = { ...nextProjs[idx], final_edited_text: val }
        return { ...prev, projects: nextProjs }
      })
    }
  }

  const handleTechChange = (val: string) => {
    setTechText(val)
    if (activeTab.startsWith('work_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData((prev) => {
        const nextWork = [...prev.work_histories]
        if (nextWork[idx]) nextWork[idx] = { ...nextWork[idx], tech: val }
        return { ...prev, work_histories: nextWork }
      })
    } else if (activeTab.startsWith('proj_')) {
      const idx = parseInt(activeTab.split('_')[1], 10)
      setResumeData((prev) => {
        const nextProjs = [...prev.projects]
        if (nextProjs[idx]) nextProjs[idx] = { ...nextProjs[idx], tech: val }
        return { ...prev, projects: nextProjs }
      })
    }
  }

  const executeSave = async (dataToSave: ResumeDataState, showSuccessToast = false) => {
    if (isSavingRef.current) {
      hasPendingSaveRef.current = true
      return
    }

    isSavingRef.current = true
    hasPendingSaveRef.current = false
    const thisVersion = ++saveVersionRef.current

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    setSaveStatus('saving')

    const safetyTimeout = setTimeout(() => {
      if (isSavingRef.current) {
        isSavingRef.current = false
        setSaveStatus('idle')
      }
    }, 7000)

    try {
      const payload = {
        ...dataToSave,
        ...(aiMatchRef.current ? { ats_score: aiMatchRef.current } : {}),
      }
      const res = await saveResumeContentAction(resume.id, payload)
      clearTimeout(safetyTimeout)

      if (thisVersion === saveVersionRef.current) {
        if (res.success) {
          setSaveStatus('saved')
          if (showSuccessToast) {
            toast.success('Section saved to resume')
          }
          idleTimerRef.current = setTimeout(() => {
            setSaveStatus('idle')
          }, 2000)
        } else {
          setSaveStatus('idle')
          toast.error(res.error || 'Failed to save changes')
        }
      }
    } catch {
      clearTimeout(safetyTimeout)
      setSaveStatus('idle')
      toast.error('Connection issue while saving changes')
    } finally {
      isSavingRef.current = false
      if (hasPendingSaveRef.current) {
        hasPendingSaveRef.current = false
        executeSave(resumeDataRef.current, false)
      }
    }
  }

  const scheduleDebouncedSave = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setSaveStatus('unsaved')
    debounceTimerRef.current = setTimeout(() => {
      executeSave(resumeDataRef.current, false)
    }, 700)
  }

  const flushPendingSave = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    await executeSave(resumeDataRef.current, false)
  }

  const handleSaveActiveContent = async (advanceToNext = false) => {
    setIsSaving(true)
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      const updated: ResumeDataState = { ...resumeDataRef.current }

      if (activeTab === 'objective') {
        updated.career_objective = {
          ...updated.career_objective,
          final_edited_text: editorText,
          is_saved: true,
        }
      } else if (activeTab.startsWith('work_')) {
        const idx = parseInt(activeTab.split('_')[1], 10)
        if (updated.work_histories[idx]) {
          const nextWork = [...updated.work_histories]
          nextWork[idx] = {
            ...nextWork[idx],
            final_edited_text: editorText,
            tech: techText,
            is_saved: true,
          }
          updated.work_histories = nextWork
        }
      } else if (activeTab.startsWith('proj_')) {
        const idx = parseInt(activeTab.split('_')[1], 10)
        if (updated.projects[idx]) {
          const nextProj = [...updated.projects]
          nextProj[idx] = {
            ...nextProj[idx],
            final_edited_text: editorText,
            tech: techText,
            is_saved: true,
          }
          updated.projects = nextProj
        }
      }

      setResumeData(updated)
      resumeDataRef.current = updated

      await executeSave(updated, true)

      if (advanceToNext) {
        const nextTab = getNextTabAfterSave(activeTab, updated)
        if (nextTab) {
          selectTab(nextTab, updated)
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSettingsChange = (newSettings: Partial<ResumeSettings>) => {
    const current = resumeDataRef.current
    const updated: ResumeDataState = {
      ...current,
      settings: { ...current.settings, ...newSettings },
    }
    resumeDataRef.current = updated
    setResumeData(updated)
    scheduleDebouncedSave()
  }

  const handleApplyFix = async (fixActionType: ATSIssue['fixActionType']) => {
    if (!fixActionType) return
    setIsSaving(true)
    try {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      const current = resumeDataRef.current
      const { updatedResume } = executeOneClickFix(current, profileData, fixActionType)
      resumeDataRef.current = updatedResume
      setResumeData(updatedResume)

      if (activeTab.startsWith('work_')) {
        const idx = parseInt(activeTab.split('_')[1], 10)
        if (updatedResume.work_histories[idx]) {
          setEditorText(updatedResume.work_histories[idx].final_edited_text)
          setTechText(updatedResume.work_histories[idx].tech || '')
        }
      } else if (activeTab.startsWith('proj_')) {
        const idx = parseInt(activeTab.split('_')[1], 10)
        if (updatedResume.projects[idx]) {
          setEditorText(updatedResume.projects[idx].final_edited_text)
          setTechText(updatedResume.projects[idx].tech || '')
        }
      }

      await executeSave(updatedResume, false)
      toast.success('Applied fix and saved to resume')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTailorWorkHistory = async (idx: number) => {
    setIsTailoring(true)
    try {
      const res = await tailorSingleWorkHistoryAction(resume.id, idx)
      if (!res.success) throw new Error(res.error)

      setResumeData((prev) => {
        const nextWork = [...prev.work_histories]
        nextWork[idx] = {
          ...nextWork[idx],
          is_tailored: true,
          ai_options: res.options || [],
          final_edited_text: res.options?.[0] || nextWork[idx].final_edited_text,
        }
        return { ...prev, work_histories: nextWork }
      })

      if (res.options?.[0]) {
        setEditorText(res.options[0])
        setSelectedOptionTab(0)
      }
      toast.success('Work experience tailored against target JD')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to tailor work experience'
      toast.error(msg)
    } finally {
      setIsTailoring(false)
    }
  }

  const handleTailorProject = async (idx: number) => {
    setIsTailoring(true)
    try {
      const res = await tailorSingleProjectAction(resume.id, idx)
      if (!res.success) throw new Error(res.error)

      setResumeData((prev) => {
        const nextProj = [...prev.projects]
        nextProj[idx] = {
          ...nextProj[idx],
          is_tailored: true,
          ai_options: res.options || [],
          final_edited_text: res.options?.[0] || nextProj[idx].final_edited_text,
        }
        return { ...prev, projects: nextProj }
      })

      if (res.options?.[0]) {
        setEditorText(res.options[0])
        setSelectedOptionTab(0)
      }
      toast.success('Project tailored against target JD')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to tailor project'
      toast.error(msg)
    } finally {
      setIsTailoring(false)
    }
  }

  const handleGenerateObjective = async () => {
    if (!allWorkAndProjectsSaved) {
      toast.error('Save all work histories and projects before generating Career Objective')
      return
    }

    setIsTailoring(true)
    try {
      const res = await generateCareerObjectiveAction(resume.id)
      if (!res.success) throw new Error(res.error)

      setResumeData((prev) => ({
        ...prev,
        career_objective: {
          is_generated: true,
          is_saved: false,
          ai_options: res.options || [],
          final_edited_text: res.options?.[0] || '',
        },
      }))

      if (res.options?.[0]) {
        setEditorText(res.options[0])
        setSelectedOptionTab(0)
      }
      toast.success('Career objective options generated')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate objective'
      toast.error(msg)
    } finally {
      setIsTailoring(false)
    }
  }

  const handleRunAIMatch = async () => {
    setIsRunningAIMatch(true)
    try {
      await flushPendingSave()
      const res = await checkATSMatchAction(resume.id)
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to evaluate keyword match')
      }
      const nextMatch: DeepAIMatchResult = {
        match_score: Number(res.data.match_score ?? 75),
        matching_keywords: Array.isArray(res.data.matching_keywords)
          ? res.data.matching_keywords
          : [],
        missing_keywords: Array.isArray(res.data.missing_keywords) ? res.data.missing_keywords : [],
        summary: res.data.summary,
      }
      aiMatchRef.current = nextMatch
      setAiMatchData(nextMatch)
      toast.success(`Deep AI match evaluated: ${nextMatch.match_score}%`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to evaluate match'
      toast.error(msg)
    } finally {
      setIsRunningAIMatch(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsExporting(true)
    try {
      await flushPendingSave()
      const current = resumeDataRef.current

      const res = await fetch(`/api/resume/${resume.id}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: current }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Failed to generate PDF')
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      const safeTitle = (resume.title || 'Resume')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
      a.download = `${safeTitle || 'Resume'}.pdf`

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Resume PDF downloaded')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download PDF'
      toast.error(msg)
    } finally {
      setIsExporting(false)
    }
  }

  const effectiveLinkedin =
    resumeData.profile_overrides?.linkedin || profileData.links?.linkedin || 'N/A'

  const candidateName =
    profileData.basic?.full_name ||
    profileData.full_name ||
    [profileData.first_name, profileData.last_name].filter(Boolean).join(' ') ||
    'N/A'

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FAF8F5] dark:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6]">
      {/* ── Top Workspace Bar ── */}
      <header className="h-14 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] flex items-center justify-between px-4 md:px-6 shrink-0 z-20 no-print">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/student/ai-resume"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] transition-colors duration-150 font-medium shrink-0"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
            <span className="hidden sm:inline">Resumes</span>
          </Link>

          <div className="h-4 w-px bg-[#1C1917]/[0.1] dark:bg-[#EFECE6]/[0.1] shrink-0" />

          <h1 className="font-medium text-[14px] text-[#1C1917] dark:text-[#EFECE6] truncate max-w-[200px] sm:max-w-[260px]">
            {resume.title || 'Untitled Resume'}
          </h1>

          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] text-[12px] rounded-full font-medium border border-[#0F766E]/20 dark:border-[#14B8A6]/25 truncate max-w-[240px]">
            {resume.target_role || 'Target Role'} · {resume.target_employer || 'Company'}
          </span>

          {/* Save Status Indicator */}
          <div className="hidden sm:flex items-center">
            {saveStatus === 'saving' || isSaving ? (
              <span className="text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 px-2 py-0.5 rounded-full border border-[#0F766E]/20 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 stroke-[1.5] animate-spin" />
                <span>Saving...</span>
              </span>
            ) : saveStatus === 'unsaved' ? (
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Unsaved</span>
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/[0.08] dark:bg-[#14B8A6]/15 px-2 py-0.5 rounded-full border border-[#0F766E]/20 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 stroke-[1.5]" />
                <span>Saved</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Target JD Reference Toggle */}
          <button
            type="button"
            onClick={() => setShowJdDrawer((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
              showJdDrawer
                ? 'border-[#0F766E] dark:border-[#14B8A6] bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]'
                : 'border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-[#FAF8F5] dark:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden sm:inline">Target JD</span>
          </button>

          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-[#FAF8F5] dark:bg-[#12110F] rounded-lg p-0.5 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.max(0.6, Math.round((s - 0.05) * 100) / 100))}
              className="p-1.5 hover:bg-white dark:hover:bg-[#191816] rounded text-[#57534E] dark:text-[#ACA59A] cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
            <span className="text-[11px] font-mono tabular-nums px-2 text-[#1C1917] dark:text-[#EFECE6]">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.min(1.2, Math.round((s + 0.05) * 100) / 100))}
              className="p-1.5 hover:bg-white dark:hover:bg-[#191816] rounded text-[#57534E] dark:text-[#ACA59A] cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </div>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[13px] font-medium transition-colors duration-150 disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 stroke-[1.5] animate-spin" />
            ) : (
              <Download className="w-4 h-4 stroke-[1.5]" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </header>

      {/* Collapsible Target JD Reference Strip */}
      {showJdDrawer && (
        <div className="border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#F3EFE9]/80 dark:bg-[#191816] px-4 md:px-6 py-3.5 shrink-0 no-print">
          <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-medium text-[#0F766E] dark:text-[#14B8A6]">
                  Target job requirements · {resume.target_employer} ({resume.target_role})
                </span>
                {resume.job_description && resume.shortened_jd && (
                  <button
                    type="button"
                    onClick={() => setShowFullJd((v) => !v)}
                    className="text-[11px] font-medium text-[#57534E] dark:text-[#ACA59A] underline hover:text-[#1C1917] dark:hover:text-[#EFECE6] cursor-pointer"
                  >
                    {showFullJd ? 'Show extracted summary' : 'Show original full JD'}
                  </button>
                )}
              </div>
              <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto pr-2">
                {showFullJd
                  ? resume.job_description || resume.shortened_jd || 'No description saved.'
                  : resume.shortened_jd || resume.job_description || 'No description saved.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowJdDrawer(false)}
              className="p-1.5 rounded-lg text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#EFECE6] cursor-pointer shrink-0"
              aria-label="Close target JD panel"
            >
              <X className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile / Tablet Pane Switcher (< lg) */}
      <div className="lg:hidden border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] px-4 py-2 flex items-center gap-1.5 shrink-0 no-print">
        {(
          [
            { key: 'sections', label: `Sections (${savedSectionsCount}/${totalSections})` },
            { key: 'editor', label: 'Editor' },
            { key: 'preview', label: 'Preview & Parser' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMobilePane(tab.key)}
            className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
              mobilePane === tab.key
                ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6]'
                : 'text-[#57534E] dark:text-[#ACA59A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 3-Column Desktop Workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Sections & Optimizer Navigation */}
        <aside
          className={`${
            mobilePane === 'sections' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-[22%] border-r border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] flex-col justify-between overflow-hidden no-print`}
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] bg-[#FAF8F5]/60 dark:bg-[#12110F]/40 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A]">
                  Resume sections
                </h2>
                <span className="font-mono tabular-nums text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6]">
                  {savedSectionsCount}/{totalSections} saved
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#F3EFE9] dark:bg-[#24221F] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0F766E] to-[#10B981] transition-all duration-300"
                  style={{
                    width: `${totalSections > 0 ? Math.round((savedSectionsCount / totalSections) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3 space-y-1">
              {/* Profile Tab */}
              <button
                type="button"
                onClick={() => selectTab('profile')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/25 dark:border-[#14B8A6]/30'
                    : 'hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6] border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4 stroke-[1.5]" />
                  <span>Profile information</span>
                </span>
                <span className="text-[11px] font-mono bg-[#F3EFE9] dark:bg-[#24221F] px-2 py-0.5 rounded-full text-[#57534E] dark:text-[#ACA59A]">
                  Synced
                </span>
              </button>

              {/* Work Histories */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setExpandedWork((e) => !e)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Work experience ({resumeData.work_histories.length})</span>
                  </span>
                  {expandedWork ? (
                    <ChevronDown className="w-3.5 h-3.5 stroke-[1.5]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                  )}
                </button>

                {expandedWork && (
                  <div className="space-y-1 pl-2 pt-1">
                    {resumeData.work_histories.length === 0 ? (
                      <p className="px-3 py-1.5 text-[11px] text-[#78716C] dark:text-[#8A847A]">
                        No experience entries in DigiProfile.
                      </p>
                    ) : (
                      resumeData.work_histories.map((work, idx) => {
                        const tabId = `work_${idx}`
                        const isSelected = activeTab === tabId
                        return (
                          <button
                            key={tabId}
                            type="button"
                            onClick={() => selectTab(tabId)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] font-medium'
                                : 'hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A]'
                            }`}
                          >
                            <span className="truncate pr-2">
                              {work.role || work.company || `Role ${idx + 1}`}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {work.is_tailored && (
                                <span className="text-[10px] font-mono text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 px-1.5 py-0.5 rounded">
                                  AI
                                </span>
                              )}
                              {work.is_saved ? (
                                <span className="text-[10px] text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 px-1.5 py-0.5 rounded border border-[#0F766E]/20 inline-flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5 stroke-[1.5]" />
                                  <span>Saved</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Review
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Projects */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setExpandedProjects((e) => !e)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Projects ({resumeData.projects.length})</span>
                  </span>
                  {expandedProjects ? (
                    <ChevronDown className="w-3.5 h-3.5 stroke-[1.5]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 stroke-[1.5]" />
                  )}
                </button>

                {expandedProjects && (
                  <div className="space-y-1 pl-2 pt-1">
                    {resumeData.projects.length === 0 ? (
                      <p className="px-3 py-1.5 text-[11px] text-[#78716C] dark:text-[#8A847A]">
                        No projects in DigiProfile.
                      </p>
                    ) : (
                      resumeData.projects.map((proj, idx) => {
                        const tabId = `proj_${idx}`
                        const isSelected = activeTab === tabId
                        return (
                          <button
                            key={tabId}
                            type="button"
                            onClick={() => selectTab(tabId)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] font-medium'
                                : 'hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] text-[#57534E] dark:text-[#ACA59A]'
                            }`}
                          >
                            <span className="truncate pr-2">{proj.title || `Project ${idx + 1}`}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {proj.is_tailored && (
                                <span className="text-[10px] font-mono text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 px-1.5 py-0.5 rounded">
                                  AI
                                </span>
                              )}
                              {proj.is_saved ? (
                                <span className="text-[10px] text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 px-1.5 py-0.5 rounded border border-[#0F766E]/20 inline-flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5 stroke-[1.5]" />
                                  <span>Saved</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Review
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Career Objective */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isObjectiveUnlocked) {
                      toast.error(
                        'Save all work experiences and projects first to unlock Career Objective'
                      )
                      return
                    }
                    selectTab('objective')
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150 flex items-center justify-between ${
                    activeTab === 'objective'
                      ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] border border-[#0F766E]/25 dark:border-[#14B8A6]/30 cursor-pointer'
                      : isObjectiveUnlocked
                      ? 'hover:bg-[#FAF8F5] dark:hover:bg-[#12110F] text-[#1C1917] dark:text-[#EFECE6] border border-transparent cursor-pointer'
                      : 'opacity-55 text-[#78716C] dark:text-[#8A847A] border border-transparent cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Target className="w-4 h-4 stroke-[1.5]" />
                    <span>Career objective</span>
                  </span>
                  {resumeData.career_objective.is_saved ? (
                    <span className="text-[10px] text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 px-2 py-0.5 rounded-full border border-[#0F766E]/20">
                      Saved
                    </span>
                  ) : resumeData.career_objective.is_generated ? (
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Review
                    </span>
                  ) : isObjectiveUnlocked ? (
                    <span className="text-[10px] text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 px-2 py-0.5 rounded-full border border-[#0F766E]/20">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#78716C] inline-flex items-center gap-1">
                      <Lock className="w-3 h-3 stroke-[1.5]" />
                      <span>Locked</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section: Optimize & Style */}
          <div className="shrink-0 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-[#FAF8F5] dark:bg-[#12110F] p-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A]">
                Audit & styling
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isResumeComplete) {
                  toast.error(
                    'Save all work experiences, projects, and Career Objective to unlock ATS Review'
                  )
                  return
                }
                selectTab('ats_review')
              }}
              className={`w-full text-left p-2.5 rounded-xl border transition-colors duration-150 flex items-center justify-between ${
                activeTab === 'ats_review'
                  ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border-[#0F766E]/35 dark:border-[#14B8A6]/35 text-[#1C1917] dark:text-[#EFECE6] cursor-pointer'
                  : isResumeComplete
                  ? 'bg-white dark:bg-[#191816] hover:border-[#0F766E]/30 border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6] cursor-pointer'
                  : 'bg-white/50 dark:bg-[#191816]/50 opacity-65 border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] text-[#78716C] cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    activeTab === 'ats_review'
                      ? 'bg-[#0F766E] text-white'
                      : isResumeComplete
                      ? 'bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6]'
                      : 'bg-[#F3EFE9] dark:bg-[#24221F] text-[#78716C]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div className="truncate">
                  <span className="text-[13px] font-medium block truncate leading-tight">
                    ATS review & score
                  </span>
                  <span className="text-[11px] text-[#57534E] dark:text-[#ACA59A] truncate block">
                    Live checks & 1-click fixes
                  </span>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {isResumeComplete ? (
                  <span
                    className={`font-mono tabular-nums text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      atsResult.score >= 85
                        ? 'bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] border-[#0F766E]/20'
                        : atsResult.score >= 65
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                    }`}
                  >
                    {atsResult.score}/100
                  </span>
                ) : (
                  <span className="text-[11px] text-[#78716C] inline-flex items-center gap-1 bg-[#F3EFE9] dark:bg-[#24221F] px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3 stroke-[1.5]" />
                    <span>Locked</span>
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectTab('settings')}
              className={`w-full text-left p-2.5 rounded-xl border transition-colors duration-150 flex items-center justify-between cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 border-[#0F766E]/35 dark:border-[#14B8A6]/35 text-[#1C1917] dark:text-[#EFECE6]'
                  : 'bg-white dark:bg-[#191816] hover:border-[#0F766E]/30 border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    activeTab === 'settings'
                      ? 'bg-[#0F766E] text-white'
                      : 'bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6]'
                  }`}
                >
                  <Palette className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div className="truncate">
                  <span className="text-[13px] font-medium block truncate leading-tight">
                    Template & PDF style
                  </span>
                  <span className="text-[11px] text-[#57534E] dark:text-[#ACA59A] truncate block">
                    Layout, typography & margins
                  </span>
                </div>
              </div>

              <span className="shrink-0 ml-2 text-[11px] font-mono bg-[#F3EFE9] dark:bg-[#24221F] text-[#57534E] dark:text-[#ACA59A] px-2 py-0.5 rounded-full capitalize">
                {resumeData.settings.template}
              </span>
            </button>
          </div>
        </aside>

        {/* Column 2: Active Section Editor */}
        <main
          className={`${
            mobilePane === 'editor' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-[38%] border-r border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] flex-col overflow-y-auto no-print`}
        >
          {/* VIEW: PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Profile information
                  </h2>
                  <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                    Static education, contact, and skill entries synced from your DigiProfile.
                  </p>
                </div>
                {resumeData.work_histories.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => selectTab('work_0')}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] text-[12px] font-medium hover:bg-[#0F766E]/15 transition-colors duration-150 shrink-0 cursor-pointer"
                  >
                    <span>Start tailoring</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                ) : resumeData.projects.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => selectTab('proj_0')}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] text-[12px] font-medium hover:bg-[#0F766E]/15 transition-colors duration-150 shrink-0 cursor-pointer"
                  >
                    <span>Start tailoring</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectTab('objective')}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#0F766E]/10 dark:bg-[#14B8A6]/15 text-[#0F766E] dark:text-[#14B8A6] text-[12px] font-medium hover:bg-[#0F766E]/15 transition-colors duration-150 shrink-0 cursor-pointer"
                  >
                    <span>Write objective</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>
                )}
              </div>

              <div className="p-4 bg-[#0F766E]/[0.05] dark:bg-[#14B8A6]/[0.08] border border-[#0F766E]/20 dark:border-[#14B8A6]/25 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#0F766E] dark:text-[#14B8A6] inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>DigiProfile live link</span>
                  </span>
                  <Link
                    href="/student/profile"
                    target="_blank"
                    className="text-[12px] font-medium text-[#0F766E] dark:text-[#14B8A6] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Edit DigiProfile</span>
                    <ExternalLink className="w-3 h-3 stroke-[1.5]" />
                  </Link>
                </div>
                <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                  Contact details, GPA, skills, and awards are pulled directly from your student profile so verified academics stay consistent.
                </p>
              </div>

              {/* Personal & Contact */}
              <div className="p-4 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl space-y-3 bg-[#FAF8F5] dark:bg-[#12110F]">
                <h3 className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A]">
                  Personal & contact
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">Name</span>
                    <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {candidateName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">Email</span>
                    <span className="font-medium text-[#1C1917] dark:text-[#EFECE6] break-all">
                      {profileData.basic?.email || profileData.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">Phone</span>
                    <span className="font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {profileData.basic?.phone || profileData.phone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">LinkedIn</span>
                    <span className="font-medium text-[#0F766E] dark:text-[#14B8A6] truncate block">
                      {effectiveLinkedin}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Background */}
              <div className="p-4 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl space-y-3 bg-[#FAF8F5] dark:bg-[#12110F]">
                <h3 className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A]">
                  Academic background
                </h3>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">Degree</span>
                    <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {profileData.type || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">Department</span>
                    <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {profileData.department || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">
                      Graduation year
                    </span>
                    <span className="font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {profileData.year || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#78716C] dark:text-[#8A847A] block">
                      GPA / Percentage
                    </span>
                    <span className="font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#EFECE6]">
                      {profileData.gpa || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="p-4 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl space-y-3 bg-[#FAF8F5] dark:bg-[#12110F]">
                <h3 className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A]">
                  Skills
                </h3>
                <div className="space-y-2.5 text-[12px]">
                  {profileData.skills?.languages && (
                    <div>
                      <span className="text-[#78716C] dark:text-[#8A847A] block mb-1">
                        Languages
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profileData.skills.languages.split(',').map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-md text-[12px]"
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profileData.skills?.frameworks && (
                    <div>
                      <span className="text-[#78716C] dark:text-[#8A847A] block mb-1">
                        Frameworks
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profileData.skills.frameworks.split(',').map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-md text-[12px]"
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profileData.skills?.tools && (
                    <div>
                      <span className="text-[#78716C] dark:text-[#8A847A] block mb-1">
                        Tools & platforms
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profileData.skills.tools.split(',').map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white dark:bg-[#191816] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-md text-[12px]"
                          >
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activities & Honors */}
              {((profileData.activities?.length || 0) > 0 ||
                (profileData.recognitions?.length || 0) > 0) && (
                <div className="p-4 border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] rounded-xl space-y-2.5 bg-[#FAF8F5] dark:bg-[#12110F]">
                  <h3 className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A]">
                    Activities & honors
                  </h3>
                  <div className="space-y-2 text-[12px]">
                    {(profileData.activities || []).map((act, i) => (
                      <div
                        key={i}
                        className="border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] pb-1.5 last:border-none"
                      >
                        <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                          {act.org} — {act.role}
                        </span>
                        {act.description && (
                          <p className="text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                            {act.description}
                          </p>
                        )}
                      </div>
                    ))}
                    {(profileData.recognitions || []).map((rec, i) => (
                      <div
                        key={i}
                        className="border-b border-[#1C1917]/[0.06] dark:border-[#EFECE6]/[0.06] pb-1.5 last:border-none"
                      >
                        <span className="font-medium text-[#1C1917] dark:text-[#EFECE6]">
                          {rec.award}
                        </span>
                        {rec.issuer && (
                          <span className="text-[#57534E] dark:text-[#ACA59A] ml-1">
                            ({rec.issuer})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: WORK HISTORY EDITING */}
          {activeTab.startsWith('work_') &&
            (() => {
              const idx = parseInt(activeTab.split('_')[1], 10)
              const work = resumeData.work_histories[idx]
              if (!work) return null

              return (
                <div className="p-6 space-y-5">
                  <div className="pb-3 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[18px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        {work.role || 'Work experience'}
                      </h2>
                      {work.is_saved ? (
                        <span className="text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 px-2.5 py-0.5 rounded-full border border-[#0F766E]/20 inline-flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 stroke-[1.5]" />
                          <span>Saved</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                          Needs review
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] mt-0.5 font-mono tabular-nums">
                      {work.company} · {work.start_date || 'Start'} – {work.end_date || 'Present'}
                    </p>
                  </div>

                  {/* Original Details */}
                  <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#12110F] rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[12px] space-y-1">
                    <span className="font-medium text-[#57534E] dark:text-[#ACA59A] block">
                      Original DigiProfile summary
                    </span>
                    <p className="text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
                      {work.original_description || 'No original description recorded.'}
                    </p>
                  </div>

                  {/* Technologies */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 stroke-[1.5] text-[#57534E]" />
                      <span>Technologies used (optional)</span>
                    </label>
                    <input
                      type="text"
                      value={techText}
                      onChange={(e) => handleTechChange(e.target.value)}
                      placeholder="e.g. TypeScript, PostgreSQL, Docker"
                      className="w-full h-9 px-3 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-[#FAF8F5] dark:bg-[#12110F] text-[13px] text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
                    />
                  </div>

                  {/* AI Generation / Variations */}
                  {!work.is_tailored ? (
                    <div className="flex items-center justify-between gap-3 p-3.5 bg-[#0F766E]/[0.06] dark:bg-[#14B8A6]/10 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                          <Wand2 className="w-4 h-4 stroke-[1.5] text-[#0F766E] dark:text-[#14B8A6]" />
                          <span>Tailor bullets against target JD</span>
                        </div>
                        <div className="text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                          Generates 3 quantified bullet variations (one-time per entry)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTailorWorkHistory(idx)}
                        disabled={isTailoring}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 shrink-0 cursor-pointer"
                      >
                        {isTailoring ? (
                          <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        )}
                        <span>{isTailoring ? 'Generating...' : 'Tailor bullets'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5 stroke-[1.5] text-[#0F766E] dark:text-[#14B8A6]" />
                          <span>Tailored variations</span>
                        </span>
                        <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                          Select a version to load below
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {work.ai_options.map((opt, oIdx) => {
                          const isSelected = selectedOptionTab === oIdx
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                setSelectedOptionTab(oIdx)
                                handleEditorTextChange(opt)
                              }}
                              className={`py-2 px-3 text-[12px] font-medium rounded-lg border text-center transition-colors duration-150 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                                  : 'bg-[#FAF8F5] dark:bg-[#12110F] hover:bg-[#F3EFE9] dark:hover:bg-[#24221F] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]'
                              }`}
                            >
                              Option {oIdx + 1}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Editor */}
                  <div className="space-y-2 pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                    <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 stroke-[1.5] text-[#57534E]" />
                      <span>Resume bullets (use - for bullet lines)</span>
                    </label>
                    <textarea
                      rows={8}
                      value={editorText}
                      onChange={(e) => handleEditorTextChange(e.target.value)}
                      placeholder="- Engineered a low-latency payment service handling..."
                      className="w-full p-3.5 rounded-xl border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-[#FAF8F5] dark:bg-[#12110F] text-[12px] leading-relaxed focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] font-mono text-[#1C1917] dark:text-[#EFECE6] transition-colors duration-150"
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveActiveContent(false)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6] text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveActiveContent(true)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 h-9 px-4 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                        )}
                        <span>Save & next</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}

          {/* VIEW: PROJECT EDITING */}
          {activeTab.startsWith('proj_') &&
            (() => {
              const idx = parseInt(activeTab.split('_')[1], 10)
              const proj = resumeData.projects[idx]
              if (!proj) return null

              return (
                <div className="p-6 space-y-5">
                  <div className="pb-3 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[18px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                        {proj.title || 'Project'}
                      </h2>
                      {proj.is_saved ? (
                        <span className="text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 px-2.5 py-0.5 rounded-full border border-[#0F766E]/20 inline-flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 stroke-[1.5]" />
                          <span>Saved</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                          Needs review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Original Details */}
                  <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#12110F] rounded-xl border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[12px] space-y-1">
                    <span className="font-medium text-[#57534E] dark:text-[#ACA59A] block">
                      Original project details
                    </span>
                    <p className="text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
                      {proj.original_description || 'No original description recorded.'}
                    </p>
                  </div>

                  {/* Technologies */}
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 stroke-[1.5] text-[#57534E]" />
                      <span>Technologies used (optional)</span>
                    </label>
                    <input
                      type="text"
                      value={techText}
                      onChange={(e) => handleTechChange(e.target.value)}
                      placeholder="e.g. Next.js, Supabase, Redis"
                      className="w-full h-9 px-3 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-[#FAF8F5] dark:bg-[#12110F] text-[13px] text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] transition-colors duration-150"
                    />
                  </div>

                  {/* AI Generation / Variations */}
                  {!proj.is_tailored ? (
                    <div className="flex items-center justify-between gap-3 p-3.5 bg-[#0F766E]/[0.06] dark:bg-[#14B8A6]/10 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 rounded-xl">
                      <div className="space-y-0.5">
                        <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                          <Wand2 className="w-4 h-4 stroke-[1.5] text-[#0F766E] dark:text-[#14B8A6]" />
                          <span>Tailor project against target JD</span>
                        </div>
                        <div className="text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                          Generates 3 ATS bullet variations (one-time per project)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTailorProject(idx)}
                        disabled={isTailoring}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 shrink-0 cursor-pointer"
                      >
                        {isTailoring ? (
                          <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5 stroke-[1.5]" />
                        )}
                        <span>{isTailoring ? 'Generating...' : 'Tailor bullets'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
                          <Wand2 className="w-3.5 h-3.5 stroke-[1.5] text-[#0F766E] dark:text-[#14B8A6]" />
                          <span>Tailored variations</span>
                        </span>
                        <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                          Select a version to load below
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {proj.ai_options.map((opt, oIdx) => {
                          const isSelected = selectedOptionTab === oIdx
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                setSelectedOptionTab(oIdx)
                                handleEditorTextChange(opt)
                              }}
                              className={`py-2 px-3 text-[12px] font-medium rounded-lg border text-center transition-colors duration-150 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                                  : 'bg-[#FAF8F5] dark:bg-[#12110F] hover:bg-[#F3EFE9] dark:hover:bg-[#24221F] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]'
                              }`}
                            >
                              Option {oIdx + 1}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Editor */}
                  <div className="space-y-2 pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                    <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 stroke-[1.5] text-[#57534E]" />
                      <span>Project bullets (use - for bullet lines)</span>
                    </label>
                    <textarea
                      rows={8}
                      value={editorText}
                      onChange={(e) => handleEditorTextChange(e.target.value)}
                      placeholder="- Built full-stack workflow reducing latency by..."
                      className="w-full p-3.5 rounded-xl border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-[#FAF8F5] dark:bg-[#12110F] text-[12px] leading-relaxed focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] font-mono text-[#1C1917] dark:text-[#EFECE6] transition-colors duration-150"
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveActiveContent(false)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6] text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5 stroke-[1.5]" />
                        <span>Save</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveActiveContent(true)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 h-9 px-4 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
                        )}
                        <span>Save & next</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}

          {/* VIEW: CAREER OBJECTIVE */}
          {activeTab === 'objective' && (
            <div className="p-6 space-y-5">
              <div className="pb-3 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[18px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    Career objective
                  </h2>
                  {resumeData.career_objective.is_saved ? (
                    <span className="text-[11px] font-medium text-[#0F766E] dark:text-[#14B8A6] bg-[#0F766E]/10 px-2.5 py-0.5 rounded-full border border-[#0F766E]/20 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 stroke-[1.5]" />
                      <span>Saved</span>
                    </span>
                  ) : resumeData.career_objective.is_generated ? (
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Needs review
                    </span>
                  ) : null}
                </div>
                <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                  Concise opening summary tailored for {resume.target_role || 'Target Role'}
                </p>
              </div>

              {!resumeData.career_objective.is_generated ? (
                !allWorkAndProjectsSaved ? (
                  <div className="p-4 bg-amber-500/[0.08] border border-amber-500/25 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium text-[13px]">
                      <AlertCircle className="w-4 h-4 text-amber-600 stroke-[1.5] shrink-0" />
                      <span>Save your work and project sections first</span>
                    </div>
                    <p className="text-[12px] text-[#57534E] dark:text-[#ACA59A] leading-relaxed">
                      Once your experience and projects are saved, we synthesize those exact highlights into a targeted Career Objective.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 p-3.5 bg-[#0F766E]/[0.06] dark:bg-[#14B8A6]/10 border border-[#0F766E]/20 dark:border-[#14B8A6]/25 rounded-xl">
                    <div className="space-y-0.5">
                      <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4 stroke-[1.5] text-[#0F766E] dark:text-[#14B8A6]" />
                        <span>Generate career objective</span>
                      </div>
                      <div className="text-[12px] text-[#57534E] dark:text-[#ACA59A]">
                        Synthesizes saved experiences & target JD (one-time)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateObjective}
                      disabled={isTailoring}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isTailoring ? (
                        <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5 stroke-[1.5]" />
                      )}
                      <span>{isTailoring ? 'Generating...' : 'Generate options'}</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#57534E] dark:text-[#ACA59A] flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 stroke-[1.5] text-[#0F766E] dark:text-[#14B8A6]" />
                      <span>Summary variations</span>
                    </span>
                    <span className="text-[11px] text-[#78716C] dark:text-[#8A847A]">
                      Select a version to load below
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {resumeData.career_objective.ai_options.map((opt, oIdx) => {
                      const isSelected = selectedOptionTab === oIdx
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => {
                            setSelectedOptionTab(oIdx)
                            const cleanOpt = opt
                              .split('\n')
                              .map((l) => l.replace(/^[-•*]\s*/, '').trim())
                              .filter(Boolean)
                              .join(' ')
                            handleEditorTextChange(cleanOpt)
                          }}
                          className={`py-2 px-3 text-[12px] font-medium rounded-lg border text-center transition-colors duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-[#0F766E] text-white border-[#0F766E]'
                              : 'bg-[#FAF8F5] dark:bg-[#12110F] hover:bg-[#F3EFE9] dark:hover:bg-[#24221F] border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] text-[#1C1917] dark:text-[#EFECE6]'
                          }`}
                        >
                          Option {oIdx + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Editor */}
              <div className="space-y-2 pt-3 border-t border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                <label className="text-[12px] font-medium text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 stroke-[1.5] text-[#57534E]" />
                  <span>Summary statement</span>
                </label>
                <textarea
                  rows={6}
                  value={editorText}
                  onChange={(e) => handleEditorTextChange(e.target.value)}
                  placeholder="Tailored career objective statement..."
                  className="w-full p-3.5 rounded-xl border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-[#FAF8F5] dark:bg-[#12110F] text-[13px] leading-relaxed focus:outline-none focus:border-[#0F766E] dark:focus:border-[#14B8A6] text-[#1C1917] dark:text-[#EFECE6] transition-colors duration-150"
                />
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveActiveContent(false)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#1C1917]/[0.1] dark:border-[#EFECE6]/[0.1] bg-white dark:bg-[#191816] hover:bg-[#FAF8F5] dark:hover:bg-[#24221F] text-[#1C1917] dark:text-[#EFECE6] text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 stroke-[1.5]" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveActiveContent(true)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-gradient-to-r from-[#0F766E] to-[#10B981] hover:from-[#0D655E] hover:to-[#0EA572] text-white rounded-lg text-[13px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 stroke-[1.5] animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
                    )}
                    <span>Save & open ATS review</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: TEMPLATE & STYLE */}
          {activeTab === 'settings' && (
            <div>
              <div className="p-6 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                <h2 className="text-[18px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                  Template & PDF style
                </h2>
                <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                  Adjust layout template, font pairing, margins, accent color, and single-page fit.
                </p>
              </div>
              <CustomizationToolbar settings={resumeData.settings} onChange={handleSettingsChange} />
            </div>
          )}

          {/* VIEW: ATS REVIEW */}
          {activeTab === 'ats_review' && (
            <div>
              <div className="p-6 pb-4 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[18px] font-medium text-[#1C1917] dark:text-[#EFECE6]">
                    ATS review & fixes
                  </h2>
                  <span className="text-[11px] font-medium bg-[#0F766E]/10 text-[#0F766E] dark:text-[#14B8A6] px-2.5 py-0.5 rounded-full border border-[#0F766E]/20">
                    23 automated checks
                  </span>
                </div>
                <p className="text-[13px] text-[#57534E] dark:text-[#ACA59A] mt-0.5">
                  Inspect formatting issues, keyword alignment, and apply 1-click fixes.
                </p>
              </div>
              <ATSCheckerPanel
                checkResult={atsResult}
                onApplyFix={handleApplyFix}
                aiMatchData={aiMatchData}
                isRunningAIMatch={isRunningAIMatch}
                onRunAIMatch={handleRunAIMatch}
              />
            </div>
          )}
        </main>

        {/* Column 3: Live A4 Preview & Raw Parser Stream */}
        <section
          className={`${
            mobilePane === 'preview' ? 'flex w-full' : 'hidden'
          } lg:flex lg:w-[40%] bg-[#F3EFE9] dark:bg-[#0D0C0A] flex-col overflow-hidden relative`}
        >
          <div className="px-4 py-2.5 border-b border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] bg-white dark:bg-[#191816] flex items-center justify-between z-10 no-print">
            <div className="flex items-center bg-[#F3EFE9] dark:bg-[#24221F] p-1 rounded-lg border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08]">
              <button
                type="button"
                onClick={() => setPreviewMode('visual')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                  previewMode === 'visual'
                    ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
                    : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Visual preview</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('parser')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                  previewMode === 'parser'
                    ? 'bg-white dark:bg-[#191816] text-[#1C1917] dark:text-[#EFECE6] shadow-[0_1px_2px_rgba(28,25,23,0.06)]'
                    : 'text-[#57534E] dark:text-[#ACA59A] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'
                }`}
              >
                <Code className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Parser view</span>
              </button>
            </div>

            <span className="text-[11px] font-mono tabular-nums text-[#57534E] dark:text-[#ACA59A] bg-[#FAF8F5] dark:bg-[#12110F] border border-[#1C1917]/[0.08] dark:border-[#EFECE6]/[0.08] px-2.5 py-0.5 rounded-md">
              A4 · Live sync
            </span>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 flex justify-center items-start">
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
